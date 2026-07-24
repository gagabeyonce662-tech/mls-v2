import time

import requests


DDF_PROPERTIES_URL = "https://ddfapi.realtor.ca/odata/v1/Property"
DDF_OPEN_HOUSES_URL = "https://ddfapi.realtor.ca/odata/v1/OpenHouse"
REQUEST_TIMEOUT_SECONDS = 30
MAX_REQUEST_ATTEMPTS = 5
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


def get_page_with_retries(url, headers, params, progress_callback=None):
    """Fetch one DDF page, retrying temporary API and network failures."""
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
                # A 400-class validation error will never succeed on retry.
                raise
            last_error = error
        except requests.exceptions.RequestException as error:
            last_error = error

        if attempt == MAX_REQUEST_ATTEMPTS:
            raise last_error

        delay_seconds = 2 ** (attempt - 1)
        if progress_callback:
            progress_callback(
                f"DDF request failed ({last_error}). Retrying in "
                f"{delay_seconds}s (attempt {attempt + 1}/"
                f"{MAX_REQUEST_ATTEMPTS})..."
            )
        time.sleep(delay_seconds)


def fetch_all_properties(
    headers,
    filter_expression=None,
    max_pages=0,
    progress_callback=None,
):
    """
    Download property pages from the DDF API.

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

    all_properties = []
    url = DDF_PROPERTIES_URL
    page_count = 0
    page_limit = max(0, int(max_pages or 0))
    download_started_at = time.monotonic()

    while url and (
        page_limit == 0 or page_count < page_limit
    ):
        next_page_number = page_count + 1
        total_elapsed = (
            time.monotonic() - download_started_at
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
            time.monotonic() - page_started_at
        )

        if progress_callback:
            progress_callback(
                f"Received HTTP {response.status_code} "
                f"for page {next_page_number:,} "
                f"after {request_elapsed:.1f}s"
            )

        response.raise_for_status()

        response_data = response.json()
        page_properties = (
            response_data.get("value", []) or []
        )

        all_properties.extend(page_properties)
        page_count += 1

        next_url = response_data.get("@odata.nextLink")

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


def fetch_all_open_houses(
    headers,
    filter_expression=None,
    max_pages=0,
    progress_callback=None,
):
    """
    Download OpenHouse pages from the DDF API.

    Returns:
        tuple[list[dict], int]:
        - downloaded OpenHouse records
        - number of downloaded pages
    """
    params = {
        "$top": 100,
        "$orderby": "OpenHouseDate asc",
    }

    if filter_expression:
        params["$filter"] = filter_expression

    all_open_houses = []
    url = DDF_OPEN_HOUSES_URL
    page_count = 0
    page_limit = max(0, int(max_pages or 0))

    while url and (
        page_limit == 0 or page_count < page_limit
    ):
        response = get_page_with_retries(
            url,
            headers=headers,
            params=params if page_count == 0 else None,
            progress_callback=progress_callback,
        )

        response_data = response.json()

        page_open_houses = (
            response_data.get("value", []) or []
        )

        all_open_houses.extend(page_open_houses)
        page_count += 1

        if progress_callback:
            progress_callback(
                f"Completed OpenHouse page {page_count:,}: "
                f"{len(page_open_houses):,} events | "
                f"{len(all_open_houses):,} total"
            )

        url = response_data.get("@odata.nextLink")
        params = None

        if url:
            time.sleep(0.2)

    return all_open_houses, page_count