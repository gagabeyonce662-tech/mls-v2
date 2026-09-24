"""Newsletter and neighbour-alert subscriptions, plus their notification job.

Both are CASL-covered commercial email, so each record stores when and how
consent was given, and every message carries a one-click unsubscribe link
that works without signing in.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from mls.models import Property

from .common import base_city, to_float
from .geo import bounding_box, haversine_km

logger = logging.getLogger(__name__)

NEWSLETTER_CONSENT_TEXT = (
    "I agree to receive the HomeAtlas real estate newsletter by email. "
    "I can unsubscribe at any time."
)
NEARBY_CONSENT_TEXT = (
    "I agree to receive emails when homes near this location are listed. "
    "I can unsubscribe at any time."
)
MAX_RADIUS_KM = Decimal("5")
MAX_ALERTS_PER_EMAIL = 5
# First run for a new alert looks back this far rather than mailing the
# whole neighbourhood's inventory.
FIRST_RUN_LOOKBACK = timedelta(days=1)
MAX_LISTINGS_PER_EMAIL = 10


def unsubscribe_url(kind: str, token: str) -> str:
    base = settings.FRONTEND_URL.rstrip("/")
    return f"{base}/unsubscribe?kind={kind}&token={token}"


# --------------------------------------------------------------------------
# Newsletter
# --------------------------------------------------------------------------


def subscribe_newsletter(*, email: str, source: str, ip_address: str | None, user=None):
    """Create or re-activate a subscription. Idempotent: subscribing twice is
    not an error, and re-subscribing refreshes the consent evidence."""
    from homepage.models import NewsletterSubscriber

    email = email.strip().lower()
    now = timezone.now()
    with transaction.atomic():
        subscriber, created = NewsletterSubscriber.objects.select_for_update().get_or_create(
            email=email,
            defaults={
                "consent_at": now,
                "consent_text": NEWSLETTER_CONSENT_TEXT,
                "source": source,
                "ip_address": ip_address,
                "user": user,
            },
        )
        if not created:
            subscriber.consent_at = now
            subscriber.consent_text = NEWSLETTER_CONSENT_TEXT
            subscriber.source = source
            subscriber.ip_address = ip_address
            subscriber.unsubscribed_at = None
            if user and not subscriber.user_id:
                subscriber.user = user
            subscriber.save()
    return subscriber, created


# --------------------------------------------------------------------------
# Neighbour alerts
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class NearbyListing:
    listing_key: str
    address: str
    city: str
    list_price: float | None
    bedrooms: int | None
    bathrooms: int | None
    distance_km: float
    listed_at: str | None


def listings_near(lat: float, lng: float, radius_km: float, *, since=None, limit: int = 20) -> list[NearbyListing]:
    """Active for-sale listings within ``radius_km``, newest first."""
    lat_min, lat_max, lng_min, lng_max = bounding_box(lat, lng, radius_km)
    qs = Property.objects.filter(
        standard_status__iexact="active",
        list_price__gt=0,
        latitude__gte=lat_min, latitude__lte=lat_max,
        longitude__gte=lng_min, longitude__lte=lng_max,
    )
    if since is not None:
        qs = qs.filter(original_entry_timestamp__gt=since)
    rows = qs.order_by("-original_entry_timestamp").values(
        "listing_key", "unparsed_address", "city", "list_price", "bedrooms_total",
        "bathrooms_total_integer", "latitude", "longitude", "original_entry_timestamp",
    )[: limit * 4]

    found: list[NearbyListing] = []
    for row in rows:
        distance = haversine_km(lat, lng, float(row["latitude"]), float(row["longitude"]))
        if distance > radius_km:
            continue  # bbox corner
        listed = row["original_entry_timestamp"]
        found.append(
            NearbyListing(
                listing_key=row["listing_key"],
                address=row["unparsed_address"] or "",
                city=base_city(row["city"]),
                list_price=to_float(row["list_price"]),
                bedrooms=row["bedrooms_total"],
                bathrooms=row["bathrooms_total_integer"],
                distance_km=round(distance, 2),
                listed_at=listed.isoformat() if listed else None,
            )
        )
        if len(found) >= limit:
            break
    return found


def _alert_email(alert, listings: list[NearbyListing]) -> tuple[str, str]:
    base = settings.FRONTEND_URL.rstrip("/")
    lines = [
        f"{len(listings)} new {'home' if len(listings) == 1 else 'homes'} listed near {alert.label}:",
        "",
    ]
    for item in listings:
        price = f"${item.list_price:,.0f}" if item.list_price else "Price on request"
        lines.append(f"• {item.address}, {item.city} — {price} ({item.distance_km} km away)")
        lines.append(f"  {base}/property/{item.listing_key}")
    lines += [
        "",
        "You're receiving this because you asked to be told when homes near this location are listed.",
        f"Stop these alerts: {unsubscribe_url('nearby', alert.token)}",
    ]
    subject = f"New listings near {alert.label}"
    return subject, "\n".join(lines)


def send_nearby_alerts(now=None) -> dict[str, int]:
    """Email each active alert the listings added since its last run."""
    from homepage.models import NearbyAlert

    now = now or timezone.now()
    sent = skipped = failed = 0
    for alert in NearbyAlert.objects.filter(is_active=True).iterator():
        since = alert.last_notified_at or (now - FIRST_RUN_LOOKBACK)
        listings = listings_near(
            float(alert.latitude), float(alert.longitude), float(alert.radius_km),
            since=since, limit=MAX_LISTINGS_PER_EMAIL,
        )
        if not listings:
            skipped += 1
            alert.last_notified_at = now
            alert.save(update_fields=["last_notified_at"])
            continue
        subject, body = _alert_email(alert, listings)
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [alert.email], fail_silently=False)
        except Exception:  # noqa: BLE001 — one bad address must not stop the batch
            logger.exception("Nearby alert %s failed", alert.pk)
            failed += 1
            continue
        alert.last_notified_at = now
        alert.save(update_fields=["last_notified_at"])
        sent += 1
    return {"sent": sent, "skipped": skipped, "failed": failed}
