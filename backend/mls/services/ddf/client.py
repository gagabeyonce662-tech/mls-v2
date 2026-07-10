import time

import requests


DDF_PROPERTIES_URL = "https://ddfapi.realtor.ca/odata/v1/Property"


def fetch_all_properties(
    headers,
    filter_expression=None,
    max_pages=0,
):
    """
    Download property pages from the DDF API.

    Returns:
        A tuple containing:
        - all downloaded property dictionaries
        - the number of pages downloaded
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

    while url and (
        page_limit == 0 or page_count < page_limit
    ):
        response = requests.get(
            url,
            headers=headers,
            params=params if page_count == 0 else None,
            timeout=30,
        )
        response.raise_for_status()

        response_data = response.json()
        page_properties = response_data.get("value", []) or []

        all_properties.extend(page_properties)
        page_count += 1

        url = response_data.get("@odata.nextLink")

        # The nextLink already contains its own query parameters.
        params = None

        time.sleep(0.2)

    return all_properties, page_count