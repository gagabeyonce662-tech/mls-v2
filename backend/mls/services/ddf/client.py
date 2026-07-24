import time

import requests


DDF_PROPERTIES_URL = "https://ddfapi.realtor.ca/odata/v1/Property"
DDF_OPEN_HOUSES_URL = "https://ddfapi.realtor.ca/odata/v1/OpenHouse"

REQUEST_TIMEOUT_SECONDS = 30
MAX_REQUEST_ATTEMPTS = 5

RETRYABLE_STATUS_CODES = {
    408,
    429,
    500,
    502,
    503,
    504,
}


def get_page_with_retries(
    url,
    headers,
    params,
    progress_callback=None,
):
    """
    Fetch one DDF API page.

    Temporary API/network failures are retried with exponential backoff.
    Permanent HTTP errors are raised immediately.
    """
    last_error = None

    for attempt in range(1, MAX_REQUEST_ATTEMPTS + 1):
        try:
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )

            if response.status_code not in RETRYABLE_STATUS_CODES:
                response.raise_for_status()
                return response

            last_error = requests.exceptions.HTTPError(
                f"DDF API returned HTTP {response.status_code}",
                response=response,
            )

            response.close()

        except requests.exceptions.HTTPError as error:
            response = error.response

            if (
                response is not None
                and response.status_code not in RETRYABLE_STATUS_CODES
            ):
                # Permanent validation/auth/etc. errors should not be retried.
                raise

            last_error = error

        except requests.exceptions.RequestException as error:
            last_error = error

        if attempt == MAX_REQUEST_ATTEMPTS:
            raise last_error

        delay_seconds = 2 ** (attempt - 1)

        if progress_callback:
            progress_callback(
                f"DDF request failed ({last_error}). "
                f"Retrying in {delay_seconds}s "
                f"(attempt {attempt + 1}/{MAX_REQUEST_ATTEMPTS})..."
            )

        time.sleep(delay_seconds)


def fetch_all_properties(
    headers,
    filter_expression=None,
    max_pages=0,
    progress_callback=None,
    select_fields=None,
):
    """
    Download Property pages from the DDF API.

    Args:
        headers:
            HTTP request headers containing the DDF authorization token.

        filter_expression:
            Optional OData $filter expression.

        max_pages:
            Maximum number of pages to download.
            0 means no explicit page limit.

        progress_callback:
            Optional callable used to report progress.

        select_fields:
            Optional iterable of DDF Property fields to request using $select.

    Returns:
        tuple[list[dict], int]:
            - downloaded property records
            - number of downloaded pages
    """
    params = {
        "$top": 100,
        "$orderby": "ModificationTimestamp desc",
    }

    if filter_expression:
        params["$filter"] = filter_expression

    if select_fields:
        params["$select"] = ",".join(select_fields)

    all_properties = []
    url = DDF_PROPERTIES_URL
    page_count = 0

    page_limit = max(
        0,
        int(max_pages or 0),
    )

    download_started_at = time.monotonic()

    while url and (
        page_limit == 0
        or page_count < page_limit
    ):
        next_page_number = page_count + 1

        total_elapsed = (
            time.monotonic()
            - download_started_at
        )

        if progress_callback:
            progress_callback(
                f"Requesting DDF page {next_page_number:,}... "
                f"{len(all_properties):,} listings downloaded | "
                f"elapsed {total_elapsed:.1f}s"
            )

        page_started_at = time.monotonic()

        response = get_page_with_retries(
            url,
            headers=headers,
            params=params if page_count == 0 else None,
            progress_callback=progress_callback,
        )

        request_elapsed = (
            time.monotonic()
            - page_started_at
        )

        if progress_callback:
            progress_callback(
                f"Received HTTP {response.status_code} "
                f"for page {next_page_number:,} "
                f"after {request_elapsed:.1f}s"
            )

        response_data = response.json()

        page_properties = (
            response_data.get("value", [])
            or []
        )

        all_properties.extend(page_properties)

        page_count += 1

        next_url = response_data.get(
            "@odata.nextLink"
        )

        if progress_callback:
            progress_callback(
                f"Completed DDF page {page_count:,}: "
                f"{len(page_properties):,} listings | "
                f"{len(all_properties):,} total | "
                f"more pages: "
                f"{'yes' if next_url else 'no'}"
            )

        url = next_url
        params = None

        if url:
            time.sleep(0.2)

    if (
        progress_callback
        and page_limit
        and page_count >= page_limit
        and url
    ):
        progress_callback(
            f"Stopped after reaching "
            f"--max-pages={page_limit}."
        )

    return all_properties, page_count


def fetch_properties_by_listing_keys(
    headers,
    listing_keys,
    progress_callback=None,
):
    """
    Fetch compact DDF Property records for specific ListingKey values.

    Listing keys are requested in small batches to avoid excessively
    large OData filter expressions.

    Only the fields needed by the Open House cache are downloaded.
    """
    cleaned_keys = [
        str(key).strip()
        for key in listing_keys
        if key is not None
        and str(key).strip()
    ]

    if not cleaned_keys:
        return []

    select_fields = [
        "ListingKey",
        "ListingId",
        "ListPrice",
        "UnparsedAddress",
        "City",
        "StateOrProvince",
        "PostalCode",
        "PropertySubType",
        "BedroomsTotal",
        "BathroomsTotalInteger",
        "Latitude",
        "Longitude",
        "Media",
    ]

    properties = []

    chunk_size = 20

    chunk_count = (
        len(cleaned_keys)
        + chunk_size
        - 1
    ) // chunk_size

    for index in range(
        0,
        len(cleaned_keys),
        chunk_size,
    ):
        chunk = cleaned_keys[
            index:index + chunk_size
        ]

        chunk_number = (
            index // chunk_size
        ) + 1

        if progress_callback:
            progress_callback(
                f"Fetching Open House properties "
                f"batch {chunk_number}/{chunk_count} "
                f"({len(chunk)} listing keys)..."
            )

        quoted_keys = ", ".join(
            f"'{key}'"
            for key in chunk
        )

        filter_expression = (
            f"ListingKey in ({quoted_keys})"
        )

        chunk_properties, _ = fetch_all_properties(
            headers=headers,
            filter_expression=filter_expression,
            max_pages=1,
            progress_callback=progress_callback,
            select_fields=select_fields,
        )

        properties.extend(
            chunk_properties
        )

        if progress_callback:
            progress_callback(
                f"Completed Open House property batch "
                f"{chunk_number}/{chunk_count}: "
                f"{len(chunk_properties)} properties returned."
            )

    return properties


def fetch_all_open_houses(
    headers,
    filter_expression=None,
    max_pages=0,
    progress_callback=None,
):
    """
    Download OpenHouse pages from the DDF API.

    Only fields required by the Open House cache are requested.
    """
    select_fields = [
        "OpenHouseKey",
        "ListingKey",
        "OpenHouseDate",
        "OpenHouseStartTime",
        "OpenHouseEndTime",
        "OpenHouseRemarks",
        "OpenHouseType",
        "OpenHouseStatus",
        "LivestreamOpenHouseURL",
    ]

    params = {
        "$top": 100,
        "$orderby": "OpenHouseDate asc",
        "$select": ",".join(select_fields),
    }

    if filter_expression:
        params["$filter"] = filter_expression

    all_open_houses = []
    url = DDF_OPEN_HOUSES_URL
    page_count = 0

    page_limit = max(
        0,
        int(max_pages or 0),
    )

    download_started_at = time.monotonic()

    while url and (
        page_limit == 0
        or page_count < page_limit
    ):
        next_page_number = page_count + 1

        total_elapsed = (
            time.monotonic()
            - download_started_at
        )

        if progress_callback:
            progress_callback(
                f"Requesting OpenHouse page "
                f"{next_page_number:,}... "
                f"{len(all_open_houses):,} events downloaded | "
                f"elapsed {total_elapsed:.1f}s"
            )

        page_started_at = time.monotonic()

        response = get_page_with_retries(
            url,
            headers=headers,
            params=params if page_count == 0 else None,
            progress_callback=progress_callback,
        )

        request_elapsed = (
            time.monotonic()
            - page_started_at
        )

        response_data = response.json()

        page_open_houses = (
            response_data.get("value", [])
            or []
        )

        all_open_houses.extend(
            page_open_houses
        )

        page_count += 1

        next_url = response_data.get(
            "@odata.nextLink"
        )

        if progress_callback:
            progress_callback(
                f"Completed OpenHouse page "
                f"{page_count:,}: "
                f"{len(page_open_houses):,} events | "
                f"{len(all_open_houses):,} total | "
                f"{request_elapsed:.1f}s | "
                f"more pages: "
                f"{'yes' if next_url else 'no'}"
            )

        url = next_url
        params = None

        if url:
            time.sleep(0.2)

    if (
        progress_callback
        and page_limit
        and page_count >= page_limit
        and url
    ):
        progress_callback(
            f"Stopped OpenHouse download after "
            f"reaching max_pages={page_limit}."
        )

    return all_open_houses, page_count

def fetch_open_houses_by_listing_keys(
    headers,
    listing_keys,
    filter_expression=None,
    progress_callback=None,
    chunk_size=100,
    max_batches=0,
):
    """
    Fetch OpenHouse records only for ListingKeys we already care about.

    This avoids scanning the complete DDF OpenHouse dataset.
    """
    cleaned_keys = sorted(
        {
            str(key).strip()
            for key in listing_keys
            if key is not None
            and str(key).strip()
        }
    )

    if not cleaned_keys:
        return [], 0, 0

    chunk_size = max(
        1,
        int(chunk_size),
    )

    batch_limit = max(
        0,
        int(max_batches or 0),
    )

    batch_count = (
        len(cleaned_keys)
        + chunk_size
        - 1
    ) // chunk_size

    all_open_houses = []
    total_pages = 0
    completed_batches = 0

    for index in range(
        0,
        len(cleaned_keys),
        chunk_size,
    ):
        batch_number = (
            index // chunk_size
        ) + 1

        if (
            batch_limit
            and batch_number > batch_limit
        ):
            break

        chunk = cleaned_keys[
            index:index + chunk_size
        ]

        quoted_keys = ", ".join(
            f"'{key.replace(chr(39), chr(39) * 2)}'"
            for key in chunk
        )

        listing_filter = (
            f"ListingKey in ({quoted_keys})"
        )

        if filter_expression:
            combined_filter = (
                f"({filter_expression}) "
                f"and ({listing_filter})"
            )
        else:
            combined_filter = listing_filter

        if progress_callback:
            progress_callback(
                f"Fetching Open Houses for property batch "
                f"{batch_number}/{batch_count} "
                f"({len(chunk)} listing keys)..."
            )

        rows, pages = fetch_all_open_houses(
            headers=headers,
            filter_expression=combined_filter,
            progress_callback=progress_callback,
        )

        all_open_houses.extend(rows)
        total_pages += pages
        completed_batches += 1

        if progress_callback:
            progress_callback(
                f"Property batch {batch_number}/{batch_count}: "
                f"{len(rows)} Open House events found."
            )

    return (
        all_open_houses,
        total_pages,
        completed_batches,
    )