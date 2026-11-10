"""Daily listing newsletter generation and delivery."""

from __future__ import annotations

import logging
import os
from datetime import date, datetime, time, timedelta
from statistics import median
from urllib.parse import urljoin

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify

from mls.models import (
    CommunityListing,
    ListingFirstSeen,
    NewsletterDelivery,
    Property,
    PropertySnapshot,
    UserAlertPreference,
    UserFavorite,
    UserFollowedArea,
    UserHistory,
    UserPropertyInteraction,
    UserToured,
)

logger = logging.getLogger(__name__)

DEFAULT_MAX_PER_SECTION = max(1, int(os.environ.get("NEWSLETTER_MAX_PER_SECTION", "5")))
DEFAULT_INTERNAL_SITE_URL = os.environ.get("NEWSLETTER_SITE_URL", "https://estate-4u.com").strip()


def _normalize_slug(value: str) -> str:
    return slugify((value or "").strip())


def _property_card(prop: Property) -> dict:
    return {
        "listing_key": prop.listing_key,
        "city": prop.city or "",
        "address": prop.unparsed_address or "",
        "price": float(prop.list_price) if prop.list_price is not None else None,
        "property_sub_type": prop.property_sub_type or "",
        "status": prop.standard_status or "",
        "modified_at": prop.modification_timestamp,
        "lease_amount": float(prop.lease_amount) if prop.lease_amount is not None else None,
    }


def _internal_listing_url(prop: Property) -> str:
    """
    Build an internal listing URL and never fall back to external MLS links.
    """
    key = (prop.listing_key or "").strip()
    if not key:
        return ""

    base = (
        getattr(settings, "FRONTEND_BASE_URL", "")
        or getattr(settings, "PUBLIC_FRONTEND_URL", "")
        or os.environ.get("NEWSLETTER_SITE_URL", DEFAULT_INTERNAL_SITE_URL).strip()
    ).strip()
    if not base:
        base = "https://estate-4u.com"
    base = base.rstrip("/") + "/"

    is_rental = False
    if prop.lease_amount is not None:
        try:
            is_rental = float(prop.lease_amount) > 0
        except (TypeError, ValueError):
            is_rental = False
    if not is_rental:
        status = (prop.standard_status or "").strip().lower()
        is_rental = "lease" in status or "rent" in status

    path = f"listing/rental/{key}" if is_rental else f"listing/{key}"
    return urljoin(base, path)


def _date_window(digest_date: date | None) -> tuple[datetime, datetime, date]:
    tz = timezone.get_current_timezone()
    target_date = digest_date or timezone.localdate()
    start_local = timezone.make_aware(datetime.combine(target_date, time.min), tz)
    end_local = start_local + timedelta(days=1)
    return start_local, end_local, target_date


def _fetch_new_active_properties(start_dt: datetime, end_dt: datetime) -> list[Property]:
    new_keys = list(
        ListingFirstSeen.objects.filter(first_seen_at__gte=start_dt, first_seen_at__lt=end_dt)
        .values_list("listing_key", flat=True)
    )
    if not new_keys:
        return []

    props = list(
        Property.objects.filter(listing_key__in=new_keys)
        .filter(Q(standard_status__iexact="active") | Q(standard_status__iexact="a"))
        .order_by("-modification_timestamp")
    )
    return props


def _user_seed_listing_keys(user_id: int) -> set[str]:
    keys = set(UserFavorite.objects.filter(user_id=user_id).values_list("property_key", flat=True)[:150])
    keys.update(UserHistory.objects.filter(user_id=user_id).values_list("property_key", flat=True)[:150])
    keys.update(UserToured.objects.filter(user_id=user_id).values_list("property_key", flat=True)[:150])
    keys.update(UserPropertyInteraction.objects.filter(user_id=user_id).values_list("listing_key", flat=True)[:250])
    return {str(k).strip() for k in keys if k}


def _select_watched_property(user_id: int, new_props: list[Property], limit: int) -> list[Property]:
    seed_keys = _user_seed_listing_keys(user_id)
    if not seed_keys:
        return []

    seed_props = list(Property.objects.filter(listing_key__in=seed_keys)[:300])
    cities = {_normalize_slug(p.city) for p in seed_props if p.city}
    ptypes = {(p.property_sub_type or "").strip().lower() for p in seed_props if p.property_sub_type}
    prices = [float(p.list_price) for p in seed_props if p.list_price is not None]
    pivot_price = median(prices) if prices else None

    rows = []
    for prop in new_props:
        if not prop.listing_key or prop.listing_key in seed_keys:
            continue
        score = 0.0
        if _normalize_slug(prop.city or "") in cities:
            score += 2.0
        if (prop.property_sub_type or "").strip().lower() in ptypes:
            score += 1.0
        if pivot_price and prop.list_price is not None:
            delta = abs(float(prop.list_price) - pivot_price) / max(pivot_price, 1.0)
            if delta <= 0.10:
                score += 1.0
            elif delta <= 0.25:
                score += 0.5
        if score > 0:
            rows.append((score, prop))

    rows.sort(key=lambda row: (row[0], row[1].modification_timestamp or timezone.now()), reverse=True)
    return [row[1] for row in rows[:limit]]


def _select_watched_community(user_id: int, new_props: list[Property], limit: int) -> list[Property]:
    areas = UserFollowedArea.objects.filter(user_id=user_id, area_kind__in=["community", "neighborhood"])
    slugs = set()
    for area in areas:
        if area.area_key:
            slugs.add(_normalize_slug(area.area_key))
        meta_slug = (area.metadata_json or {}).get("community_slug")
        if isinstance(meta_slug, str) and meta_slug.strip():
            slugs.add(_normalize_slug(meta_slug))

    if not slugs:
        return []

    new_keys = [p.listing_key for p in new_props if p.listing_key]
    matched_keys = set(
        CommunityListing.objects.filter(
            is_published=True,
            community_slug__in=slugs,
            property__listing_key__in=new_keys,
        ).values_list("property__listing_key", flat=True)
    )
    if not matched_keys:
        return []

    return [p for p in new_props if p.listing_key in matched_keys][:limit]


def _area_tokens_for_row(area: UserFollowedArea) -> set[str]:
    out = set()
    for raw in [area.area_key, area.area_label]:
        token = _normalize_slug(raw or "")
        if token:
            out.add(token)
    meta = area.metadata_json or {}
    for key in ("city", "region", "community", "community_slug"):
        raw = meta.get(key)
        if isinstance(raw, str):
            token = _normalize_slug(raw)
            if token:
                out.add(token)
    cities = meta.get("cities")
    if isinstance(cities, list):
        for item in cities:
            if isinstance(item, str):
                token = _normalize_slug(item)
                if token:
                    out.add(token)
    return out


def _select_watched_area(user_id: int, new_props: list[Property], limit: int) -> list[Property]:
    area_rows = list(UserFollowedArea.objects.filter(user_id=user_id).exclude(area_kind="community")[:120])
    if not area_rows:
        return []

    area_tokens = set()
    for row in area_rows:
        area_tokens.update(_area_tokens_for_row(row))

    if not area_tokens:
        return []

    matched = []
    for prop in new_props:
        prop_tokens = {
            _normalize_slug(prop.city or ""),
            _normalize_slug(prop.city_region or ""),
            _normalize_slug(prop.subdivision_name or ""),
        }
        prop_tokens.discard("")
        if prop_tokens & area_tokens:
            matched.append(prop)
        if len(matched) >= limit:
            break
    return matched


def _select_recommend(user_id: int, new_props: list[Property], limit: int) -> list[Property]:
    seed_keys = _user_seed_listing_keys(user_id)
    seed_props = list(Property.objects.filter(listing_key__in=seed_keys)[:200])
    cities = {_normalize_slug(p.city) for p in seed_props if p.city}

    rows = []
    for prop in new_props:
        if not prop.listing_key or prop.listing_key in seed_keys:
            continue
        score = 0.0
        if _normalize_slug(prop.city or "") in cities:
            score += 1.0
        if prop.modification_timestamp:
            age_days = (timezone.now() - prop.modification_timestamp).days
            score += max(0.0, 1.0 - (age_days / 14.0))
        rows.append((score, prop))

    rows.sort(key=lambda row: (row[0], row[1].modification_timestamp or timezone.now()), reverse=True)
    return [row[1] for row in rows[:limit]]


def _build_sections(prefs: UserAlertPreference, user_id: int, new_props: list[Property], limit: int) -> dict[str, list[Property]]:
    sections: dict[str, list[Property]] = {}
    seen = set()

    def add(name: str, props: list[Property]):
        unique = []
        for prop in props:
            if not prop.listing_key or prop.listing_key in seen:
                continue
            seen.add(prop.listing_key)
            unique.append(prop)
        if unique:
            sections[name] = unique

    if prefs.email_recommend:
        add("recommend", _select_recommend(user_id, new_props, limit))
    if prefs.email_watched_property:
        add("watched_property", _select_watched_property(user_id, new_props, limit))
    if prefs.email_watched_community:
        add("watched_community", _select_watched_community(user_id, new_props, limit))
    if prefs.email_watched_area:
        add("watched_area", _select_watched_area(user_id, new_props, limit))

    return sections


def _collect_saved_home_changes(
    prefs: UserAlertPreference, user_id: int, start_dt: datetime, end_dt: datetime, limit: int
) -> dict[str, list[dict]]:
    """Price and status changes on the user's saved homes during the digest day.

    A change is the newest snapshot inside the window compared with the one
    before it (which may be older than the window). Same comparison the
    in-app alert preview uses, so the email and the Watched page agree.
    """
    changes: dict[str, list[dict]] = {}
    if not (prefs.price_changes or prefs.status_updates):
        return changes
    favorite_keys = list(
        UserFavorite.objects.filter(user_id=user_id).values_list("property_key", flat=True)[:500]
    )
    if not favorite_keys:
        return changes

    price_rows: list[dict] = []
    status_rows: list[dict] = []
    for listing_key in favorite_keys:
        latest = (
            PropertySnapshot.objects.filter(
                listing_key=listing_key, created_at__gte=start_dt, created_at__lt=end_dt
            )
            .order_by("-created_at")
            .first()
        )
        if latest is None:
            continue
        previous = (
            PropertySnapshot.objects.filter(listing_key=listing_key, created_at__lt=latest.created_at)
            .order_by("-created_at")
            .first()
        )
        if previous is None:
            continue
        old_price = float(previous.list_price) if previous.list_price is not None else None
        new_price = float(latest.list_price) if latest.list_price is not None else None
        old_status = (previous.standard_status or "").strip()
        new_status = (latest.standard_status or "").strip()
        if prefs.price_changes and old_price is not None and new_price is not None and old_price != new_price:
            price_rows.append({"listing_key": listing_key, "old": old_price, "new": new_price})
        if prefs.status_updates and old_status and new_status and old_status.lower() != new_status.lower():
            status_rows.append({"listing_key": listing_key, "old": old_status, "new": new_status})

    props = {
        p.listing_key: p
        for p in Property.objects.filter(
            listing_key__in=[r["listing_key"] for r in price_rows + status_rows]
        )
    }
    for name, rows in (("price_changes", price_rows), ("status_updates", status_rows)):
        rows = rows[:limit]
        for row in rows:
            row["property"] = props.get(row["listing_key"])
        if rows:
            changes[name] = rows
    return changes


def _change_line(row: dict, kind: str) -> str:
    prop = row.get("property")
    if prop is not None:
        card = _property_card(prop)
        label = card["address"] or card["city"] or row["listing_key"]
        link = _internal_listing_url(prop)
    else:
        label, link = row["listing_key"], ""
    if kind == "price_changes":
        what = f"${row['old']:,.0f} -> ${row['new']:,.0f}"
    else:
        what = f"{row['old']} -> {row['new']}"
    return f"- {label} | {what}" + (f" | {link}" if link else "")


def _compose_email(
    user_display_name: str,
    sections: dict[str, list[Property]],
    digest_date: date,
    changes: dict[str, list[dict]] | None = None,
) -> tuple[str, str]:
    subject = f"Your home updates - {digest_date.isoformat()}"
    lines = [
        f"Hi {user_display_name or 'there'},",
        "",
        "Here are today\'s listing updates based on your watch settings:",
        "",
    ]

    label_map = {
        "recommend": "Recommended",
        "watched_property": "Watched Property",
        "watched_community": "Watched Community",
        "watched_area": "Watched Area",
    }

    for key in ("recommend", "watched_property", "watched_community", "watched_area"):
        props = sections.get(key, [])
        if not props:
            continue
        lines.append(f"{label_map[key]} ({len(props)}):")
        for prop in props:
            card = _property_card(prop)
            price = f"${card['price']:,.0f}" if card["price"] is not None else "Price on request"
            address = card["address"] or card["city"] or card["listing_key"]
            link = _internal_listing_url(prop)
            if link:
                lines.append(f"- {address} | {price} | {card['status']} | {link}")
            else:
                lines.append(f"- {address} | {price} | {card['status']} | key={card['listing_key']}")
        lines.append("")

    change_labels = {
        "price_changes": "Price changes on your saved homes",
        "status_updates": "Status changes on your saved homes",
    }
    for key, label in change_labels.items():
        rows = (changes or {}).get(key, [])
        if not rows:
            continue
        lines.append(f"{label} ({len(rows)}):")
        lines.extend(_change_line(row, key) for row in rows)
        lines.append("")

    lines.append("Manage alerts in your Watched > Notifications settings.")
    return subject, "\n".join(lines)


def send_daily_listing_newsletters(
    *,
    digest_date: date | None = None,
    dry_run: bool = False,
    user_limit: int | None = None,
    max_per_section: int = DEFAULT_MAX_PER_SECTION,
) -> dict:
    start_dt, end_dt, target_date = _date_window(digest_date)
    new_props = _fetch_new_active_properties(start_dt, end_dt)

    prefs_qs = (
        UserAlertPreference.objects.filter(email_enabled=True)
        .filter(
            Q(email_recommend=True)
            | Q(email_watched_property=True)
            | Q(email_watched_community=True)
            | Q(email_watched_area=True)
            | Q(price_changes=True)
            | Q(status_updates=True)
        )
        .select_related("user")
        .order_by("user_id")
    )
    if user_limit and user_limit > 0:
        prefs_qs = prefs_qs[:user_limit]

    sent = 0
    skipped = 0
    failed = 0

    for prefs in prefs_qs:
        user = prefs.user
        email = (getattr(user, "email", "") or "").strip()
        if not email:
            skipped += 1
            continue

        existing = NewsletterDelivery.objects.filter(user=user, digest_date=target_date).first()
        if existing and existing.status == NewsletterDelivery.STATUS_SENT and not dry_run:
            skipped += 1
            continue

        sections = _build_sections(prefs, user.id, new_props, max_per_section)
        changes = _collect_saved_home_changes(prefs, user.id, start_dt, end_dt, max_per_section)
        section_counts = {k: len(v) for k, v in sections.items()}
        section_counts.update({k: len(v) for k, v in changes.items()})
        total_listings = sum(section_counts.values())

        if total_listings == 0:
            if existing:
                existing.status = NewsletterDelivery.STATUS_SKIPPED
                existing.listing_count = 0
                existing.section_counts = section_counts
                existing.error = "No applicable listings"
                existing.save(update_fields=["status", "listing_count", "section_counts", "error", "updated_at"])
            else:
                NewsletterDelivery.objects.create(
                    user=user,
                    digest_date=target_date,
                    status=NewsletterDelivery.STATUS_SKIPPED,
                    listing_count=0,
                    section_counts=section_counts,
                    error="No applicable listings",
                )
            skipped += 1
            continue

        try:
            if not dry_run:
                subject, body = _compose_email(
                    getattr(user, "full_name", "") or "", sections, target_date, changes
                )
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

            status_value = NewsletterDelivery.STATUS_SENT if not dry_run else NewsletterDelivery.STATUS_SKIPPED
            if existing:
                existing.status = status_value
                existing.listing_count = total_listings
                existing.section_counts = section_counts
                existing.error = ""
                existing.sent_at = timezone.now() if not dry_run else None
                existing.save(
                    update_fields=["status", "listing_count", "section_counts", "error", "sent_at", "updated_at"]
                )
            else:
                NewsletterDelivery.objects.create(
                    user=user,
                    digest_date=target_date,
                    status=status_value,
                    listing_count=total_listings,
                    section_counts=section_counts,
                    sent_at=timezone.now() if not dry_run else None,
                )
            if dry_run:
                skipped += 1
            else:
                sent += 1
                if getattr(prefs, "push_watched_property", False):
                    try:
                        from mls.services.web_push import send_push_to_user

                        send_push_to_user(
                            user,
                            {
                                "title": "HomeAtlas listing updates",
                                "body": f"{total_listings} update{'s' if total_listings != 1 else ''} on homes you watch.",
                                "url": "/watched",
                            },
                        )
                    except Exception:
                        logger.exception("web push failed for user_id=%s", user.id)
        except Exception as exc:  # pragma: no cover - defensive
            failed += 1
            logger.exception("daily newsletter send failed for user_id=%s", user.id)
            err = str(exc)
            if existing:
                existing.status = NewsletterDelivery.STATUS_FAILED
                existing.error = err
                existing.save(update_fields=["status", "error", "updated_at"])
            else:
                NewsletterDelivery.objects.create(
                    user=user,
                    digest_date=target_date,
                    status=NewsletterDelivery.STATUS_FAILED,
                    error=err,
                )

    return {
        "digest_date": target_date.isoformat(),
        "new_properties": len(new_props),
        "sent": sent,
        "skipped": skipped,
        "failed": failed,
        "dry_run": dry_run,
    }
