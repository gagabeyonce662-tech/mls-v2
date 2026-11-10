"""Refresh listing gallery URLs from AMPRE when DDF CDN links are dead.

TRREB photos are mirrored on ``trreb-image.ampre.ca``. CREA DDF often keeps
serving ``ddfcdn.realtor.ca`` paths that later 404, which makes every gallery
tile fall back to the house placeholder while ``photos_count`` stays correct.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Iterable
from urllib.request import Request, urlopen

from django.db import transaction

from mls.models import Media, Property
from mls.services.ampre_client import AmpreClientError, fetch_media_page

logger = logging.getLogger(__name__)

SIZE_SUFFIX_RE = re.compile(r"-(?:l|m|t|nw)$", re.I)
VARIANT_RANK = {"l": 0, "": 1, "m": 2, "nw": 3, "t": 4}
PHOTO_CATEGORIES = {"", "photo", "property photo"}
# Board MLS® numbers on AMPRE / TRREB (W12914842, E12899528, …).
TRREB_LISTING_ID_RE = re.compile(r"^[A-Z]\d{5,}$")


def _variant_of(media_key: str) -> tuple[str, str]:
    key = (media_key or "").strip()
    match = SIZE_SUFFIX_RE.search(key)
    if not match:
        return key, ""
    return key[: match.start()], match.group(0)[1:].lower()


def _is_photo_row(row: dict[str, Any]) -> bool:
    category = str(row.get("MediaCategory") or "").strip().lower()
    url = str(row.get("MediaURL") or "").strip().lower()
    if category in PHOTO_CATEGORIES:
        return bool(url)
    return url.endswith((".jpg", ".jpeg", ".png", ".webp"))


def dedupe_ampre_photos(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best: dict[str, tuple[int, dict[str, Any]]] = {}
    for row in rows:
        if not _is_photo_row(row):
            continue
        url = (row.get("MediaURL") or "").strip()
        key = (row.get("MediaKey") or "").strip()
        if not url or not key:
            continue
        base, variant = _variant_of(key)
        if variant in {"t", "nw"}:
            continue
        rank = VARIANT_RANK.get(variant, 99)
        previous = best.get(base)
        if previous is None or rank < previous[0]:
            best[base] = (rank, row)

    selected = [item[1] for item in best.values()]
    selected.sort(
        key=lambda row: (
            0 if row.get("PreferredPhotoYN") else 1,
            row.get("Order") if isinstance(row.get("Order"), int) else 999,
            row.get("MediaKey") or "",
        )
    )
    unique: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for row in selected:
        url = (row.get("MediaURL") or "").strip()
        if url in seen_urls:
            continue
        seen_urls.add(url)
        unique.append(row)
    return unique


def url_ok(url: str, timeout: float = 12) -> bool:
    try:
        request = Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(request, timeout=timeout) as response:
            response.read(32)
            return response.status == 200
    except Exception:
        return False


def replace_property_media(prop: Property, photos: list[dict[str, Any]]) -> int:
    with transaction.atomic():
        Media.objects.filter(property_id=prop.id).delete()
        rows: list[Media] = []
        for index, photo in enumerate(photos, start=1):
            order = photo.get("Order") if isinstance(photo.get("Order"), int) else index
            rows.append(
                Media(
                    property=prop,
                    media_url=photo["MediaURL"],
                    media_category=photo.get("MediaCategory") or "Photo",
                    is_preferred=bool(photo.get("PreferredPhotoYN")),
                    order=order,
                )
            )
        if rows and not any(row.is_preferred for row in rows):
            rows[0].is_preferred = True
        Media.objects.bulk_create(rows)
        Property.objects.filter(pk=prop.pk).update(photos_count=len(rows))
    return len(rows)


def fetch_ampre_photos_for_listing_id(listing_id: str) -> list[dict[str, Any]]:
    raw = fetch_media_page(
        filter_expression=f"ResourceRecordKey eq '{listing_id}'",
        select_fields=[
            "MediaURL",
            "MediaKey",
            "Order",
            "PreferredPhotoYN",
            "MediaCategory",
        ],
        orderby="Order",
        top=200,
        max_rows=500,
    )
    return dedupe_ampre_photos(raw)


def refresh_property_media_from_ampre(prop: Property) -> int:
    listing_id = (prop.listing_id or "").strip()
    if not listing_id:
        return 0
    photos = fetch_ampre_photos_for_listing_id(listing_id)
    if not photos:
        return 0
    if not url_ok(photos[0]["MediaURL"]):
        logger.warning(
            "AMPRE media for %s failed health check; leaving existing rows",
            listing_id,
        )
        return 0
    return replace_property_media(prop, photos)


def repair_dead_ddf_media(
    properties: Iterable[Property],
    *,
    only_if_dead: bool = True,
) -> int:
    """Replace gallery rows from AMPRE for TRREB listings with dead DDF URLs.

    Returns the number of properties whose media was rewritten.
    """
    repaired = 0
    for prop in properties:
        listing_id = (prop.listing_id or "").strip()
        if not TRREB_LISTING_ID_RE.match(listing_id):
            continue

        if only_if_dead:
            preferred = (
                prop.media.filter(is_preferred=True).order_by("order", "pk").first()
                or prop.media.order_by("order", "pk").first()
            )
            if preferred and preferred.media_url and url_ok(preferred.media_url):
                continue
            # Already on AMPRE and healthy — nothing to do.
            if preferred and "ampre.ca" in (preferred.media_url or ""):
                continue

        try:
            written = refresh_property_media_from_ampre(prop)
        except AmpreClientError as exc:
            logger.warning("AMPRE media refresh failed for %s: %s", listing_id, exc)
            continue
        if written:
            repaired += 1
            logger.info(
                "Refreshed %s media rows for %s from AMPRE",
                written,
                listing_id,
            )
    return repaired
