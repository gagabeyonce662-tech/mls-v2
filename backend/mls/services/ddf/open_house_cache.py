from datetime import timedelta

from django.db.models import OuterRef, Subquery
from django.utils import timezone

from mls.models import Media, Property
from mls.services.ddf.client import (
    fetch_open_houses_by_listing_keys,
)
from mls.services.redis_cache import (
    set_cached_open_houses,
)


def decimal_to_number(value):
    if value is None:
        return None

    return float(value)


def build_compact_open_house_record(
    open_house,
    property_obj,
):
    return {
        "open_house": {
            "open_house_key": open_house.get(
                "OpenHouseKey"
            ),
            "date": open_house.get(
                "OpenHouseDate"
            ),
            "start_time": open_house.get(
                "OpenHouseStartTime"
            ),
            "end_time": open_house.get(
                "OpenHouseEndTime"
            ),
            "type": open_house.get(
                "OpenHouseType"
            ),
            "status": open_house.get(
                "OpenHouseStatus"
            ),
            "remarks": open_house.get(
                "OpenHouseRemarks"
            ),
            "livestream_url": open_house.get(
                "LivestreamOpenHouseURL"
            ),
        },
        "property": {
            "listing_key": property_obj.listing_key,
            "listing_id": property_obj.listing_id,
            "price": decimal_to_number(
                property_obj.list_price
            ),
            "address": property_obj.unparsed_address,
            "city": property_obj.city,
            "province": property_obj.state_or_province,
            "postal_code": property_obj.postal_code,
            "property_type": property_obj.property_sub_type,
            "bedrooms": property_obj.bedrooms_total,
            "bathrooms": (
                property_obj.bathrooms_total_integer
            ),
            "latitude": decimal_to_number(
                property_obj.latitude
            ),
            "longitude": decimal_to_number(
                property_obj.longitude
            ),
            "image_url": (
                property_obj.open_house_image_url
            ),
        },
    }


def refresh_open_house_cache(
    headers,
    max_pages=0,
    days_ahead=7,
    progress_callback=None,
):
    """
    Cache upcoming Open Houses for DDF properties already carried
    by our Ontario property catalogue.

    We intentionally start with our local listing universe rather
    than scanning every OpenHouse available through CREA.
    """
    calendar_days = max(
        1,
        int(days_ahead or 1),
    )

    today = timezone.localdate()

    end_date = today + timedelta(
        days=calendar_days - 1
    )

    candidate_listing_keys = list(
        Property.objects.filter(
            category_type=Property.DDF,
            state_or_province__iexact="Ontario",
        )
        .exclude(
            listing_key__isnull=True,
        )
        .exclude(
            listing_key="",
        )
        .values_list(
            "listing_key",
            flat=True,
        )
    )

    if progress_callback:
        progress_callback(
            f"Checking {len(candidate_listing_keys):,} "
            f"local Ontario DDF properties for Open Houses "
            f"from {today.isoformat()} through "
            f"{end_date.isoformat()}."
        )

    if not candidate_listing_keys:
        cached = set_cached_open_houses([])

        return {
            "candidate_property_count": 0,
            "open_house_batches": 0,
            "open_house_pages": 0,
            "open_house_count": 0,
            "matched_property_count": 0,
            "cached_count": 0,
            "skipped_missing_property": 0,
            "cached": cached,
        }

    filter_expression = (
        f"OpenHouseDate ge {today.isoformat()} "
        f"and OpenHouseDate le {end_date.isoformat()} "
        "and OpenHouseStatus eq 'Active' "
        "and OpenHouseType eq 'Open House'"
    )

    open_houses, page_count, batch_count = (
        fetch_open_houses_by_listing_keys(
            headers=headers,
            listing_keys=candidate_listing_keys,
            filter_expression=filter_expression,
            progress_callback=progress_callback,
            chunk_size=100,
            max_batches=max_pages,
        )
    )

    open_house_listing_keys = {
        str(row.get("ListingKey")).strip()
        for row in open_houses
        if row.get("ListingKey")
    }

    if progress_callback:
        progress_callback(
            f"Found {len(open_houses):,} Open House events "
            f"for {len(open_house_listing_keys):,} "
            f"local properties."
        )

    if not open_house_listing_keys:
        cached = set_cached_open_houses([])

        return {
            "candidate_property_count": (
                len(candidate_listing_keys)
            ),
            "open_house_batches": batch_count,
            "open_house_pages": page_count,
            "open_house_count": 0,
            "matched_property_count": 0,
            "cached_count": 0,
            "skipped_missing_property": 0,
            "cached": cached,
        }

    image_url_subquery = (
        Media.objects.filter(
            property_id=OuterRef("pk"),
        )
        .order_by(
            "-is_preferred",
            "order",
            "id",
        )
        .values(
            "media_url",
        )[:1]
    )

    properties = (
        Property.objects.filter(
            category_type=Property.DDF,
            listing_key__in=open_house_listing_keys,
        )
        .annotate(
            open_house_image_url=Subquery(
                image_url_subquery
            )
        )
        .only(
            "id",
            "listing_key",
            "listing_id",
            "list_price",
            "unparsed_address",
            "city",
            "state_or_province",
            "postal_code",
            "property_sub_type",
            "bedrooms_total",
            "bathrooms_total_integer",
            "latitude",
            "longitude",
        )
    )

    properties_by_key = {
        property_obj.listing_key: property_obj
        for property_obj in properties
    }

    combined = []
    skipped_missing_property = 0

    for open_house in open_houses:
        listing_key = open_house.get(
            "ListingKey"
        )

        if not listing_key:
            skipped_missing_property += 1
            continue

        listing_key = str(
            listing_key
        ).strip()

        property_obj = properties_by_key.get(
            listing_key
        )

        if property_obj is None:
            skipped_missing_property += 1
            continue

        combined.append(
            build_compact_open_house_record(
                open_house,
                property_obj,
            )
        )

    combined.sort(
        key=lambda item: (
            item["open_house"]["date"] or "",
            item["open_house"]["start_time"] or "",
            item["property"]["city"] or "",
        )
    )

    cached = set_cached_open_houses(
        combined
    )

    if progress_callback:
        progress_callback(
            f"Redis cache updated with "
            f"{len(combined):,} Open House events."
        )

    return {
        "candidate_property_count": (
            len(candidate_listing_keys)
        ),
        "open_house_batches": batch_count,
        "open_house_pages": page_count,
        "open_house_count": len(open_houses),
        "matched_property_count": len(
            properties_by_key
        ),
        "cached_count": len(combined),
        "skipped_missing_property": (
            skipped_missing_property
        ),
        "cached": cached,
    }