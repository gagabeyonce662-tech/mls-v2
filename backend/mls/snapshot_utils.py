"""Record catalog sync snapshots for listing price/status history (not sold data)."""

import logging

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
