"""Thin OData client for the AMPRE (TRREB) feed used for sold data.

The AMPRE feed carries closed/sold listings with ``CloseDate`` and
``ClosePrice`` fields that DDF does not expose. It is queried directly
(no local mirror) and each query is short-cached to avoid hammering
the upstream on repeated dashboard views.
"""
from __future__ import annotations

import logging
from typing import Any, Iterable
from urllib.parse import quote

import requests
from django.conf import settings


logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 30
MAX_PAGES_SAFETY = 50

# "$" stays literal so the OData system options read as $filter/$top/$select.
_SAFE_KEY_CHARS = "$"
# OData expression punctuation is left as-is; only spaces and the like are
# escaped. Single quotes in particular must survive, since string literals in
# a filter are quoted ('Toronto') and callers already double any embedded ones.
_SAFE_VALUE_CHARS = "$,()'"


class AmpreClientError(RuntimeError):
    """Raised when the AMPRE API returns an unrecoverable error."""


def _headers() -> dict[str, str]:
    token = getattr(settings, "AMPRE_ODATA_BEARER_TOKEN", "") or ""
    if not token:
        raise AmpreClientError("AMPRE_ODATA_BEARER_TOKEN is not configured.")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def _base_url() -> str:
    return getattr(settings, "AMPRE_ODATA_BASE_URL", "https://query.ampre.ca/odata").rstrip("/")


def fetch_property_page(
    filter_expression: str | None = None,
    select_fields: Iterable[str] | None = None,
    orderby: str | None = None,
    top: int = 500,
    max_rows: int | None = None,
) -> list[dict[str, Any]]:
    """Fetch AMPRE Property rows and return the combined ``value`` arrays.

    ``top`` is the page size, capped at 1000 by AMPRE. ``max_rows`` is the
    total the caller wants across pages; it defaults to ``top``, so a plain
    ``top=5`` probe costs exactly one request. Pagination follows
    ``@odata.nextLink`` until the budget is met or ``MAX_PAGES_SAFETY`` pages.
    """
    requested_top = min(int(top or 500), 1000)
    row_budget = max(int(max_rows), 1) if max_rows else requested_top
    params: dict[str, Any] = {"$top": requested_top}
    if filter_expression:
        params["$filter"] = filter_expression
    if select_fields:
        params["$select"] = ",".join(select_fields)
    if orderby:
        params["$orderby"] = orderby

    # AMPRE's OData parser does not decode "+" as a space, which is how
    # requests encodes spaces when it builds a query string from `params`.
    # "City+eq+'Toronto'" therefore reaches the server as one meaningless
    # token and comes back as HTTP 400 "The types 'Edm.Boolean' and
    # 'Edm.String' are not compatible" -- an error about our syntax, not
    # about the data, which made it look like the upstream was down.
    # Encoding the query ourselves with quote() emits %20 instead.
    query = "&".join(
        quote(str(key), safe=_SAFE_KEY_CHARS)
        + "="
        + quote(str(value), safe=_SAFE_VALUE_CHARS)
        for key, value in params.items()
    )
    # The first URL carries the query above; every @odata.nextLink is already
    # a fully formed absolute URL, so no request here passes `params`.
    url = f"{_base_url()}/Property?{query}"
    all_rows: list[dict[str, Any]] = []
    pages = 0

    while url and pages < MAX_PAGES_SAFETY:
        try:
            response = requests.get(
                url,
                headers=_headers(),
                timeout=DEFAULT_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("AMPRE Property fetch failed: %s", exc)
            raise AmpreClientError(str(exc)) from exc

        data = response.json() or {}
        all_rows.extend(data.get("value") or [])
        url = data.get("@odata.nextLink")
        pages += 1

        # Stop at the caller's budget. AMPRE returns a nextLink on every page,
        # so without this the loop always ran to MAX_PAGES_SAFETY: a top=3
        # probe pulled 50 pages, and the GTA scope took long enough to time
        # the request out. This was invisible while every query 400'd.
        if len(all_rows) >= row_budget:
            del all_rows[row_budget:]
            break

    return all_rows
