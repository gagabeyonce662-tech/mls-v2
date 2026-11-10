from datetime import timedelta

from django.db import transaction
from django.db.models import OuterRef, Subquery
from django.utils import timezone

from mls.models import Media, OpenHouse, Property
from mls.services.ddf.client import (
    fetch_all_open_houses,
    fetch_properties_by_listing_keys,
)
from mls.services.ddf.mapper import map_property_defaults
from mls.services.ddf.open_house_mapper import map_open_house_defaults
from mls.services.redis_cache import set_cached_open_houses


def decimal_to_number(value):
    if value is None:
        return None
    return float(value)


def build_compact_open_house_record(open_house, property_obj):
    return {
        "open_house": {
            "open_house_key": open_house.get("OpenHouseKey"),
            "date": open_house.get("OpenHouseDate"),
            "start_time": open_house.get("OpenHouseStartTime"),
            "end_time": open_house.get("OpenHouseEndTime"),
            "type": open_house.get("OpenHouseType"),
            "status": open_house.get("OpenHouseStatus"),
            "remarks": open_house.get("OpenHouseRemarks"),
            "livestream_url": open_house.get("LivestreamOpenHouseURL"),
        },
        "property": {
            "listing_key": property_obj.listing_key,
            "listing_id": property_obj.listing_id,
            "price": decimal_to_number(property_obj.list_price),
            "address": property_obj.unparsed_address,
            "city": property_obj.city,
            "province": property_obj.state_or_province,
            "postal_code": property_obj.postal_code,
            "property_type": property_obj.property_sub_type,
            "bedrooms": property_obj.bedrooms_total,
            "bathrooms": property_obj.bathrooms_total_integer,
            "latitude": decimal_to_number(property_obj.latitude),
            "longitude": decimal_to_number(property_obj.longitude),
            "image_url": getattr(property_obj, "open_house_image_url", None),
        },
    }


def persist_open_houses(open_houses, properties_by_key):
    """
    Replace the current DDF OpenHouse rows with the freshly fetched
    active/upcoming events.

    The Property table remains the parent/source of listing data.
    """
    open_house_objects = []
    seen_open_house_keys = set()
    skipped_missing_key = 0
    skipped_missing_property = 0

    for data in open_houses:
        open_house_key = data.get("OpenHouseKey")
        listing_key = data.get("ListingKey")
        if not open_house_key or not listing_key:
            skipped_missing_key += 1
            continue

        listing_key = str(listing_key).strip()
        property_obj = properties_by_key.get(listing_key)
        if property_obj is None:
            skipped_missing_property += 1
            continue

        if open_house_key in seen_open_house_keys:
            continue
        seen_open_house_keys.add(open_house_key)

        open_house_objects.append(
            OpenHouse(
                property=property_obj,
                open_house_key=open_house_key,
                **map_open_house_defaults(data),
            )
        )

    with transaction.atomic():
        OpenHouse.objects.filter(property__category_type=Property.DDF).delete()
        if open_house_objects:
            OpenHouse.objects.bulk_create(open_house_objects, batch_size=1000)

    return {
        "stored_count": len(open_house_objects),
        "skipped_missing_key": skipped_missing_key,
        "skipped_missing_property": skipped_missing_property,
    }


def _upsert_open_house_properties(raw_properties):
    """Insert or update Property rows for open-house listing keys."""
    if not raw_properties:
        return 0

    keys = [
        str(row.get("ListingKey")).strip()
        for row in raw_properties
        if row.get("ListingKey")
    ]
    existing = {
        prop.listing_key: prop
        for prop in Property.objects.filter(listing_key__in=keys)
    }

    to_create = []
    to_update = []
    update_fields = None

    for data in raw_properties:
        key = str(data.get("ListingKey") or "").strip()
        if not key:
            continue
        defaults = map_property_defaults(data)
        # Open-house parents must stay Active so they appear under the
        # open-house tab's has_open_house filter (scoped to live listings).
        if not defaults.get("standard_status"):
            defaults["standard_status"] = "Active"

        if key in existing:
            prop = existing[key]
            for field, value in defaults.items():
                setattr(prop, field, value)
            to_update.append(prop)
            if update_fields is None:
                update_fields = [
                    field.name
                    for field in Property._meta.fields
                    if field.name not in ("id", "listing_key")
                ]
        else:
            to_create.append(Property(listing_key=key, **defaults))

    created = 0
    if to_create:
        Property.objects.bulk_create(to_create, ignore_conflicts=True)
        created = len(to_create)
    if to_update and update_fields:
        Property.objects.bulk_update(to_update, update_fields, batch_size=500)

    return created + len(to_update)


def refresh_open_house_cache(
    headers,
    max_pages=0,
    days_ahead=14,
    progress_callback=None,
):
    """
    Sync upcoming Open Houses into Postgres and Redis.

    The listings status tab filters ``has_open_house`` against the OpenHouse
    table, so Redis alone is not enough. We pull upcoming events from DDF
    globally (not only for keys already cached), upsert any missing parent
    Property rows, then persist OpenHouse rows and refresh the Redis cache.
    """
    calendar_days = max(1, int(days_ahead or 1))
    today = timezone.localdate()
    end_date = today + timedelta(days=calendar_days - 1)

    filter_expression = (
        f"OpenHouseDate ge {today.isoformat()} "
        f"and OpenHouseDate le {end_date.isoformat()} "
        "and OpenHouseStatus eq 'Active'"
    )

    if progress_callback:
        progress_callback(
            f"Downloading Open Houses from {today.isoformat()} "
            f"through {end_date.isoformat()}..."
        )

    open_houses, page_count = fetch_all_open_houses(
        headers=headers,
        filter_expression=filter_expression,
        max_pages=max_pages,
        progress_callback=progress_callback,
    )

    open_house_listing_keys = sorted(
        {
            str(row.get("ListingKey")).strip()
            for row in open_houses
            if row.get("ListingKey")
        }
    )

    if progress_callback:
        progress_callback(
            f"Found {len(open_houses):,} Open House events "
            f"for {len(open_house_listing_keys):,} listing keys."
        )

    if not open_house_listing_keys:
        OpenHouse.objects.filter(property__category_type=Property.DDF).delete()
        cached = set_cached_open_houses([])
        return {
            "candidate_property_count": 0,
            "open_house_batches": 0,
            "open_house_pages": page_count,
            "open_house_count": 0,
            "matched_property_count": 0,
            "stored_count": 0,
            "properties_upserted": 0,
            "cached_count": 0,
            "skipped_missing_property": 0,
            "cached": cached,
        }

    existing_keys = set(
        Property.objects.filter(listing_key__in=open_house_listing_keys).values_list(
            "listing_key", flat=True
        )
    )
    missing_keys = [key for key in open_house_listing_keys if key not in existing_keys]

    properties_upserted = 0
    if missing_keys:
        if progress_callback:
            progress_callback(
                f"Fetching {len(missing_keys):,} missing parent listings "
                "for Open House events..."
            )
        raw_properties = fetch_properties_by_listing_keys(
            headers=headers,
            listing_keys=missing_keys,
            progress_callback=progress_callback,
        )
        properties_upserted = _upsert_open_house_properties(raw_properties)

    image_url_subquery = (
        Media.objects.filter(property_id=OuterRef("pk"))
        .order_by("-is_preferred", "order", "id")
        .values("media_url")[:1]
    )

    properties = (
        Property.objects.filter(listing_key__in=open_house_listing_keys)
        .annotate(open_house_image_url=Subquery(image_url_subquery))
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

    properties_by_key = {prop.listing_key: prop for prop in properties}
    persist_result = persist_open_houses(open_houses, properties_by_key)

    combined = []
    skipped_missing_property = 0
    for open_house in open_houses:
        listing_key = str(open_house.get("ListingKey") or "").strip()
        if not listing_key:
            skipped_missing_property += 1
            continue
        property_obj = properties_by_key.get(listing_key)
        if property_obj is None:
            skipped_missing_property += 1
            continue
        combined.append(build_compact_open_house_record(open_house, property_obj))

    combined.sort(
        key=lambda item: (
            item["open_house"]["date"] or "",
            item["open_house"]["start_time"] or "",
            item["property"]["city"] or "",
        )
    )
    cached = set_cached_open_houses(combined)

    if progress_callback:
        progress_callback(
            f"Stored {persist_result['stored_count']:,} Open House rows; "
            f"Redis cache has {len(combined):,} events."
        )

    return {
        "candidate_property_count": len(open_house_listing_keys),
        "open_house_batches": 1,
        "open_house_pages": page_count,
        "open_house_count": len(open_houses),
        "matched_property_count": len(properties_by_key),
        "stored_count": persist_result["stored_count"],
        "properties_upserted": properties_upserted,
        "cached_count": len(combined),
        "skipped_missing_property": skipped_missing_property,
        "cached": cached,
    }
