"""Pre-con activity beacons and the Studio activity report (scope #26)."""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from mls.models import (
    AIAssistLog,
    AISearchLog,
    ListingSubmission,
    ListingViewEvent,
    PreconActivityEvent,
    PreComProperty,
    Property,
    PropertyInquiry,
    SearchEvent,
)
from mls.services.request_meta import client_ip, user_agent
from vlog.permissions import IsStaffUser

try:
    from homepage.models import NearbyAlert, NewsletterSubscriber
except Exception:  # pragma: no cover - homepage app is part of this project
    NearbyAlert = None
    NewsletterSubscriber = None

EVENTS = {choice for choice, _label in PreconActivityEvent.EVENT_CHOICES}


class ActivityAnonThrottle(AnonRateThrottle):
    scope = "precon_activity_anon"


class ActivityUserThrottle(UserRateThrottle):
    scope = "precon_activity_user"


class PreconActivityAPIView(APIView):
    """POST /api/mls/activity/precon/ — one view or button click. Best-effort."""

    permission_classes = [AllowAny]
    throttle_classes = [ActivityAnonThrottle, ActivityUserThrottle]

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        event = str(data.get("event") or "").strip()
        if event not in EVENTS:
            return Response({"error": "Unknown event."}, status=400)
        try:
            project_id = int(data.get("project_id"))
        except (TypeError, ValueError):
            return Response({"error": "project_id is required."}, status=400)
        if not PreComProperty.objects.filter(pk=project_id).exists():
            return Response({"error": "Project not found."}, status=404)

        session_key = str(data.get("session_key") or "")[:64]
        PreconActivityEvent.objects.create(
            project_id=project_id,
            event=event,
            user=request.user if request.user.is_authenticated else None,
            session_key=session_key,
            ip_address=client_ip(request),
            user_agent=user_agent(request),
        )
        return Response({"ok": True}, status=201)


def _window_days(raw) -> int:
    try:
        days = int(raw)
    except (TypeError, ValueError):
        days = 30
    return max(1, min(days, 90))


def _email(user) -> str | None:
    if user is None:
        return None
    return getattr(user, "email", None) or None


class StudioActivityAPIView(APIView):
    """GET /api/mls/studio/activity/?days=30&user_id= — staff report."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        days = _window_days(request.query_params.get("days"))
        since = timezone.now() - timedelta(days=days)
        user_id = request.query_params.get("user_id")
        user = None
        if user_id:
            user = get_user_model().objects.filter(pk=user_id).first()
            if user is None:
                return Response({"error": "User not found."}, status=404)

        listing_qs = ListingViewEvent.objects.filter(created_at__gte=since)
        precon_qs = PreconActivityEvent.objects.filter(created_at__gte=since)
        search_qs = SearchEvent.objects.filter(created_at__gte=since)
        ai_qs = AISearchLog.objects.filter(created_at__gte=since)
        assist_qs = AIAssistLog.objects.filter(created_at__gte=since)
        inquiry_qs = PropertyInquiry.objects.filter(created_at__gte=since)
        assignment_qs = ListingSubmission.objects.filter(
            purpose=ListingSubmission.Purpose.ASSIGNMENT,
            submitted_at__gte=since,
        )
        if user is not None:
            listing_qs = listing_qs.filter(user=user)
            precon_qs = precon_qs.filter(user=user)
            search_qs = search_qs.filter(user=user)
            ai_qs = ai_qs.filter(user=user)
            assist_qs = assist_qs.filter(user=user)
            inquiry_qs = inquiry_qs.filter(user=user)
            assignment_qs = assignment_qs.filter(submitted_by=user)

        top_listings = []
        listing_rows = list(
            listing_qs.values("listing_key").annotate(views=Count("id")).order_by("-views")[:8]
        )
        props = {
            row.listing_key: row
            for row in Property.objects.filter(listing_key__in=[item["listing_key"] for item in listing_rows])
        }
        for item in listing_rows:
            prop = props.get(item["listing_key"])
            top_listings.append(
                {
                    "listing_key": item["listing_key"],
                    "views": item["views"],
                    "address": (getattr(prop, "unparsed_address", None) or "") if prop else "",
                    "city": (getattr(prop, "city", None) or "") if prop else "",
                }
            )

        project_rows = list(
            precon_qs.values("project_id", "event").annotate(total=Count("id"))
        )
        by_project: dict[int, dict] = {}
        for row in project_rows:
            bucket = by_project.setdefault(
                row["project_id"],
                {"id": row["project_id"], "views": 0, "floor_plans": 0, "pricing": 0, "contact": 0},
            )
            key = {
                PreconActivityEvent.EVENT_VIEW: "views",
                PreconActivityEvent.EVENT_FLOOR_PLANS: "floor_plans",
                PreconActivityEvent.EVENT_PRICING: "pricing",
                PreconActivityEvent.EVENT_CONTACT: "contact",
            }.get(row["event"])
            if key:
                bucket[key] = row["total"]
        titles = {
            project.pk: project.content.title
            for project in PreComProperty.objects.filter(pk__in=by_project).select_related("content")
        }
        top_projects = sorted(by_project.values(), key=lambda row: row["views"], reverse=True)[:8]
        for row in top_projects:
            row["title"] = titles.get(row["id"], f"Project {row['id']}")

        top_queries = list(
            search_qs.exclude(query="")
            .values("query")
            .annotate(count=Count("id"))
            .order_by("-count")[:8]
        )

        newsletter = 0
        neighbour = 0
        if NewsletterSubscriber is not None and user is None:
            newsletter = NewsletterSubscriber.objects.filter(created_at__gte=since).count()
        elif NewsletterSubscriber is not None and user is not None:
            newsletter = NewsletterSubscriber.objects.filter(created_at__gte=since, user=user).count()
        if NearbyAlert is not None and user is None:
            neighbour = NearbyAlert.objects.filter(created_at__gte=since).count()
        elif NearbyAlert is not None and user is not None:
            neighbour = NearbyAlert.objects.filter(created_at__gte=since, user=user).count()

        timeline = []
        for row in listing_qs.select_related("user").order_by("-created_at")[:15]:
            timeline.append(
                {
                    "at": row.created_at.isoformat(),
                    "kind": "listing_view",
                    "label": row.listing_key,
                    "user_email": _email(row.user),
                }
            )
        for row in precon_qs.select_related("user", "project__content").order_by("-created_at")[:15]:
            timeline.append(
                {
                    "at": row.created_at.isoformat(),
                    "kind": f"precon_{row.event}",
                    "label": row.project.content.title,
                    "user_email": _email(row.user),
                }
            )
        for row in search_qs.select_related("user").order_by("-created_at")[:10]:
            timeline.append(
                {
                    "at": row.created_at.isoformat(),
                    "kind": "search",
                    "label": row.query or row.city or "Search",
                    "user_email": _email(row.user),
                }
            )
        for row in assist_qs.select_related("user").order_by("-created_at")[:10]:
            timeline.append(
                {
                    "at": row.created_at.isoformat(),
                    "kind": "ai_assist",
                    "label": row.question,
                    "user_email": _email(row.user),
                }
            )
        for row in inquiry_qs.select_related("user").order_by("-created_at")[:10]:
            timeline.append(
                {
                    "at": row.created_at.isoformat(),
                    "kind": "inquiry",
                    "label": row.email,
                    "user_email": row.email,
                }
            )
        timeline.sort(key=lambda item: item["at"], reverse=True)

        return Response(
            {
                "window_days": days,
                "user_id": user.pk if user else None,
                "top_listings": top_listings,
                "top_projects": top_projects,
                "searches": {
                    "count": search_qs.count() + ai_qs.count(),
                    "ai_count": ai_qs.count(),
                    "top_queries": top_queries,
                },
                "leads": {
                    "inquiries": inquiry_qs.count(),
                    "assignment_submissions": assignment_qs.count(),
                    "newsletter": newsletter,
                    "neighbour_alerts": neighbour,
                },
                "timeline": timeline[:40],
            }
        )
