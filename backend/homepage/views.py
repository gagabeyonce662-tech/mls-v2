"""Homepage API (/api/home/…). Views are thin: parse, call a service, shape.

Reads are public and cached by the services; writes are throttled. Every
AMPRE-backed read answers 503 with a readable message when the upstream is
down and nothing is cached — the frontend then shows its unavailable state
rather than an empty section that looks like "no data".
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import (
    BuyerIncentive,
    CommunityImage,
    NearbyAlert,
    NewsArticle,
    NewsletterSubscriber,
    Partner,
)
from .serializers import (
    BuyerIncentiveSerializer,
    CommunityImageSerializer,
    NearbyAlertCreateSerializer,
    NearbyAlertSerializer,
    NewsArticleSerializer,
    NewsletterSubscribeSerializer,
    PartnerSerializer,
    TokenSerializer,
)
from .services import feeds
from .services.subscriptions import (
    MAX_ALERTS_PER_EMAIL,
    NEARBY_CONSENT_TEXT,
    listings_near,
    subscribe_newsletter,
    unsubscribe_url,
)

logger = logging.getLogger(__name__)


def _int_param(request, name: str, default: int, lo: int, hi: int) -> int:
    try:
        value = int(request.query_params.get(name, default))
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return (forwarded.split(",")[0].strip() or request.META.get("REMOTE_ADDR")) or None


def _unavailable(message: str) -> Response:
    return Response({"error": message}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class PublicView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []


# --------------------------------------------------------------------------
# Editorial content
# --------------------------------------------------------------------------


class BuyerIncentiveListView(PublicView):
    def get(self, request):
        rows = BuyerIncentive.objects.filter(is_active=True)
        return Response({"results": BuyerIncentiveSerializer(rows, many=True).data})


class PartnerListView(PublicView):
    def get(self, request):
        rows = Partner.objects.filter(is_active=True)
        return Response({"results": PartnerSerializer(rows, many=True).data})


class CommunityImageListView(PublicView):
    def get(self, request):
        return Response({"results": CommunityImageSerializer(CommunityImage.objects.all(), many=True).data})


class NewsListView(PublicView):
    def get(self, request):
        limit = _int_param(request, "limit", 3, 1, 20)
        rows = NewsArticle.objects.filter(is_hidden=False).select_related("source")[:limit]
        return Response({"results": NewsArticleSerializer(rows, many=True).data})


# --------------------------------------------------------------------------
# Derived feeds
# --------------------------------------------------------------------------


class InvestorPicksView(PublicView):
    def get(self, request):
        limit = _int_param(request, "limit", 3, 1, 12)
        city = (request.query_params.get("city") or "").strip() or None
        return Response(feeds.investor_picks(limit=limit, city=city))


class MarketDealsView(PublicView):
    def get(self, request):
        try:
            return Response(feeds.market_deals(limit=_int_param(request, "limit", 4, 1, 12)))
        except feeds.FeedUnavailable:
            return _unavailable("Deals are temporarily unavailable.")


class SoldBelowPurchaseView(PublicView):
    def get(self, request):
        limit = _int_param(request, "limit", 3, 1, 12)
        city = (request.query_params.get("city") or "").strip() or None
        return Response(feeds.sold_below_purchase(limit=limit, city=city))


class MarketSnapshotView(PublicView):
    def get(self, request):
        try:
            return Response(feeds.market_snapshot("gta"))
        except feeds.FeedUnavailable:
            return _unavailable("Market data is temporarily unavailable.")


class NearbyActivityView(PublicView):
    """New listings around a point — the feed beside the neighbour-alert form."""

    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
        except (KeyError, TypeError, ValueError):
            return Response({"error": "lat and lng are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return Response({"error": "lat/lng out of range."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            radius = min(max(float(request.query_params.get("radius_km", 1)), 0.2), 5.0)
        except (TypeError, ValueError):
            radius = 1.0
        limit = _int_param(request, "limit", 4, 1, 12)
        since = timezone.now() - timedelta(days=30)
        results = listings_near(lat, lng, radius, since=since, limit=limit)
        return Response({"results": [item.__dict__ for item in results], "radius_km": radius})


# --------------------------------------------------------------------------
# Subscriptions
# --------------------------------------------------------------------------


class NewsletterSubscribeView(APIView):
    """Anonymous sign-up is allowed (it's a homepage form), so it's throttled
    and always answers the same way — whether the address was new or already
    subscribed is not revealed."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "home_subscribe"

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        subscriber, created = subscribe_newsletter(
            email=serializer.validated_data["email"],
            source=serializer.validated_data["source"],
            ip_address=_client_ip(request),
            user=user,
        )
        if created:
            _send_quietly(
                subject="You're subscribed to the HomeAtlas newsletter",
                body=(
                    "Thanks for subscribing. You'll get GTA market updates and new-listing highlights.\n\n"
                    "If you didn't sign up, or change your mind, unsubscribe here:\n"
                    f"{unsubscribe_url('newsletter', subscriber.token)}\n"
                ),
                to=subscriber.email,
            )
        return Response({"subscribed": True}, status=status.HTTP_201_CREATED)


class NearbyAlertListCreateView(APIView):
    """Signed-in only: an alert emails whoever it names, so an anonymous form
    would let anyone enrol a stranger's inbox."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "home_subscribe"

    def get_throttles(self):
        # Only creating is rate-limited; listing your own alerts is free.
        return super().get_throttles() if self.request.method == "POST" else []

    def get(self, request):
        rows = NearbyAlert.objects.filter(user=request.user, is_active=True)
        return Response({"results": NearbyAlertSerializer(rows, many=True).data})

    def post(self, request):
        serializer = NearbyAlertCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            active = NearbyAlert.objects.select_for_update().filter(email=data["email"], is_active=True)
            if active.count() >= MAX_ALERTS_PER_EMAIL:
                return Response(
                    {"error": f"You can follow up to {MAX_ALERTS_PER_EMAIL} locations. Remove one first."},
                    status=status.HTTP_409_CONFLICT,
                )
            alert = NearbyAlert.objects.create(
                user=data["user"],
                email=data["email"],
                label=data["label"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                radius_km=data["radius_km"],
                consent_at=timezone.now(),
                consent_text=NEARBY_CONSENT_TEXT,
            )
        return Response(
            {"id": alert.pk, "label": alert.label, "radius_km": float(alert.radius_km)},
            status=status.HTTP_201_CREATED,
        )


class NearbyAlertDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk: int):
        updated = NearbyAlert.objects.filter(pk=pk, user=request.user, is_active=True).update(is_active=False)
        if not updated:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnsubscribeView(PublicView):
    """One-click unsubscribe from an email link. Idempotent, and an unknown
    token gets the same 200 so tokens can't be probed."""

    def post(self, request):
        serializer = TokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kind, token = serializer.validated_data["kind"], serializer.validated_data["token"]
        now = timezone.now()
        if kind == "newsletter":
            NewsletterSubscriber.objects.filter(token=token, unsubscribed_at__isnull=True).update(unsubscribed_at=now)
        else:
            NearbyAlert.objects.filter(token=token, is_active=True).update(is_active=False)
        return Response({"unsubscribed": True})


def _send_quietly(*, subject: str, body: str, to: str) -> None:
    """A failed welcome email must not fail the sign-up that triggered it."""
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=False)
    except Exception:  # noqa: BLE001
        logger.exception("Homepage email to %s failed", to)
