"""Saved-search email alerts (scope #22: "create your own search to get daily updates").

For every saved search with a daily or weekly cadence that is due, replay its
stored filters through PropertyFilterView — the exact code path the site's
search uses, so an alert can never disagree with what the user sees — and
email the listings first seen since the previous check.

Cursor: ``last_run_at`` is when the search was last checked (set on every
run, sent or not); ``last_alert_sent_at`` is when an email last went out.
"Instant" has no real-time pipeline yet and is treated as daily.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import send_mail
from django.http import QueryDict
from django.test.client import RequestFactory
from django.utils import timezone

from mls.models import ListingFirstSeen, SavedSearch
from mls.services.newsletter_notifications import DEFAULT_INTERNAL_SITE_URL

logger = logging.getLogger(__name__)

MAX_LISTINGS_PER_EMAIL = 10
REPLAY_LIMIT = 100
# A day's run starts a little early so a job that drifts a few minutes does
# not skip a day.
DUE_AFTER = {
    SavedSearch.ALERT_DAILY: timedelta(hours=20),
    SavedSearch.ALERT_INSTANT: timedelta(hours=20),
    SavedSearch.ALERT_WEEKLY: timedelta(days=6, hours=20),
}
FIRST_RUN_LOOKBACK = {
    SavedSearch.ALERT_DAILY: timedelta(days=1),
    SavedSearch.ALERT_INSTANT: timedelta(days=1),
    SavedSearch.ALERT_WEEKLY: timedelta(days=7),
}
# Paging/ordering params in filters_json would fight the replay's own.
IGNORED_FILTER_KEYS = {"limit", "offset", "orderby", "semantic", "allow_fallback", "modified_since"}


def is_due(search: SavedSearch, now: datetime) -> bool:
    gap = DUE_AFTER.get(search.alert_cadence)
    if gap is None:
        return False
    return search.last_run_at is None or now - search.last_run_at >= gap


def check_window_start(search: SavedSearch, now: datetime) -> datetime:
    if search.last_run_at:
        return search.last_run_at
    lookback = FIRST_RUN_LOOKBACK.get(search.alert_cadence, timedelta(days=1))
    return max(search.created_at, now - lookback)


def replay_params(filters: dict, since: datetime) -> QueryDict:
    """filters_json → query params for PropertyFilterView, strict and newest-first."""
    params = QueryDict(mutable=True)
    for key, value in (filters or {}).items():
        if key in IGNORED_FILTER_KEYS or value in (None, ""):
            continue
        if isinstance(value, (list, tuple)):
            for item in value:
                if item not in (None, ""):
                    params.appendlist(key, str(item))
        else:
            params[key] = str(value)
    # Strict: the fallback pipeline answers "no match" with unrelated homes,
    # which in an alert would read as matches.
    params["allow_fallback"] = "false"
    params["modified_since"] = since.isoformat()
    params["orderby"] = "-modification_timestamp"
    params["limit"] = str(REPLAY_LIMIT)
    return params


def find_new_matches(search: SavedSearch, since: datetime) -> list[dict]:
    """Listings matching the search that first appeared at or after ``since``."""
    from mls.views_properties import PropertyFilterView

    request = RequestFactory().get("/api/mls/properties/filter/", data=replay_params(search.filters_json, since))
    request.user = search.user
    # Not a user search: keep it out of SearchEvent analytics.
    request._skip_search_event = True
    response = PropertyFilterView.as_view()(request)
    if response.status_code != 200:
        logger.warning("saved-search %s replay returned %s", search.pk, response.status_code)
        return []
    results = response.data.get("results") or []
    keys = [row.get("listing_key") for row in results if row.get("listing_key")]
    fresh = set(
        ListingFirstSeen.objects.filter(listing_key__in=keys, first_seen_at__gte=since).values_list(
            "listing_key", flat=True
        )
    )
    return [row for row in results if row.get("listing_key") in fresh]


def compose_alert(search: SavedSearch, matches: list[dict]) -> tuple[str, str]:
    site = DEFAULT_INTERNAL_SITE_URL.rstrip("/") + "/"
    count = len(matches)
    subject = f'{count} new home{"s" if count != 1 else ""} for "{search.name}"'
    lines = [
        f"Hi {getattr(search.user, 'full_name', '') or 'there'},",
        "",
        f'New listings matching your saved search "{search.name}":',
        "",
    ]
    for row in matches[:MAX_LISTINGS_PER_EMAIL]:
        price = row.get("list_price")
        try:
            price_text = f"${float(price):,.0f}" if price not in (None, "") else "Price on request"
        except (TypeError, ValueError):
            price_text = "Price on request"
        address = row.get("unparsed_address") or row.get("city") or row.get("listing_key")
        link = urljoin(site, f"property/{row.get('listing_key')}")
        lines.append(f"- {address} | {price_text} | {link}")
    if count > MAX_LISTINGS_PER_EMAIL:
        lines.append(f"...and {count - MAX_LISTINGS_PER_EMAIL} more.")
    lines += [
        "",
        f"See or change this search: {urljoin(site, 'watched?tab=saved-search')}",
        "To stop these emails, set the saved search's alerts to Off there.",
    ]
    return subject, "\n".join(lines)


def send_saved_search_alerts(*, dry_run: bool = False, now: datetime | None = None) -> dict:
    now = now or timezone.now()
    report = {"checked": 0, "sent": 0, "no_matches": 0, "failed": 0}
    searches = (
        SavedSearch.objects.exclude(alert_cadence=SavedSearch.ALERT_OFF)
        .select_related("user")
        .order_by("id")
    )
    for search in searches:
        if not is_due(search, now):
            continue
        email = (getattr(search.user, "email", "") or "").strip()
        if not email or not getattr(search.user, "is_active", True):
            continue
        report["checked"] += 1
        since = check_window_start(search, now)
        try:
            matches = find_new_matches(search, since)
            if matches and not dry_run:
                subject, body = compose_alert(search, matches)
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                search.last_alert_sent_at = now
                report["sent"] += 1
            elif not matches:
                report["no_matches"] += 1
        except Exception:  # one bad search must not stop the rest
            logger.exception("saved-search alert failed for search_id=%s", search.pk)
            report["failed"] += 1
            continue
        if not dry_run:
            search.last_run_at = now
            search.last_result_count = len(matches)
            search.save(update_fields=["last_run_at", "last_alert_sent_at", "last_result_count"])
    return report
