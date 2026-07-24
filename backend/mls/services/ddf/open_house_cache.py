from mls.services.ddf.client import (
    fetch_all_open_houses,
    fetch_properties_by_listing_keys,
)
from mls.services.redis_cache import set_cached_open_houses


def refresh_open_house_cache(
    headers,
    max_pages=0,
    progress_callback=None,
):
    """
    Fetch current Open Houses and their corresponding Property records,
    combine them, and cache the result in Redis.
    """

    open_houses, page_count = fetch_all_open_houses(
        headers=headers,
        max_pages=max_pages,
        progress_callback=progress_callback,
    )

    listing_keys = {
        row.get("ListingKey")
        for row in open_houses
        if row.get("ListingKey")
    }

    properties = fetch_properties_by_listing_keys(
        headers=headers,
        listing_keys=listing_keys,
        progress_callback=progress_callback,
    )

    properties_by_key = {
        row.get("ListingKey"): row
        for row in properties
        if row.get("ListingKey")
    }

    combined = []

    skipped_missing_property = 0

    for open_house in open_houses:
        listing_key = open_house.get("ListingKey")

        property_data = properties_by_key.get(listing_key)

        if property_data is None:
            skipped_missing_property += 1
            continue

        combined.append(
            {
                "open_house": open_house,
                "property": property_data,
            }
        )

    cached = set_cached_open_houses(combined)

    return {
        "open_house_pages": page_count,
        "open_house_count": len(open_houses),
        "property_count": len(properties),
        "cached_count": len(combined),
        "skipped_missing_property": skipped_missing_property,
        "cached": cached,
    }