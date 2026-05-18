"""Record catalog sync snapshots for listing price/status history (not sold data)."""

import logging
from collections.abc import Iterable

logger = logging.getLogger(__name__)


def record_property_snapshot(property_instance) -> None:
    """
    Append a PropertySnapshot when list price, status, or board modification time
    differs from the latest stored snapshot for this listing_key.
    """
    from mls.models import PropertySnapshot  # local import avoids circular models↔helpers

    try:
        key = property_instance.listing_key
        if not key:
            return
        last = (
            PropertySnapshot.objects.filter(listing_key=key)
            .order_by("-created_at")
            .first()
        )
        lp = property_instance.list_price
        st = (property_instance.standard_status or "").strip()
        mt = property_instance.modification_timestamp
        if last:
            same_price = last.list_price == lp
            same_status = (last.standard_status or "") == st
            same_mt = last.source_modification_timestamp == mt
            if same_price and same_status and same_mt:
                return
        PropertySnapshot.objects.create(
            listing_key=key,
            list_price=lp,
            standard_status=st,
            source_modification_timestamp=mt,
        )
    except Exception as e:
        logger.warning("record_property_snapshot failed: %s", e)


def record_listing_first_seen(listing_key: str, source_modification_timestamp=None) -> None:
    """Insert listing first-seen marker if it does not yet exist."""
    from mls.models import ListingFirstSeen

    try:
        if not listing_key:
            return
        ListingFirstSeen.objects.get_or_create(
            listing_key=listing_key,
            defaults={
                "first_source_modification_timestamp": source_modification_timestamp,
            },
        )
    except Exception as e:
        logger.warning("record_listing_first_seen failed for %s: %s", listing_key, e)


def bulk_record_listing_first_seen(rows: Iterable[tuple[str, object]]) -> None:
    """
    Bulk insert listing first-seen rows.

    Each row is `(listing_key, source_modification_timestamp)`.
    Existing listing keys are ignored.
    """
    from mls.models import ListingFirstSeen

    try:
        to_create = []
        seen = set()
        for listing_key, source_ts in rows:
            key = (listing_key or "").strip()
            if not key or key in seen:
                continue
            seen.add(key)
            to_create.append(
                ListingFirstSeen(
                    listing_key=key,
                    first_source_modification_timestamp=source_ts,
                )
            )
        if not to_create:
            return
        ListingFirstSeen.objects.bulk_create(to_create, ignore_conflicts=True)
    except Exception as e:
        logger.warning("bulk_record_listing_first_seen failed: %s", e)
