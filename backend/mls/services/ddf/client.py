import time

import requests


DDF_PROPERTIES_URL = "https://ddfapi.realtor.ca/odata/v1/Property"


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

        response = requests.get(
            url,
            headers=headers,
            params=params if page_count == 0 else None,
            timeout=30,
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
