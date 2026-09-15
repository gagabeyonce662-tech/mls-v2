"""Thin OData client for the AMPRE (TRREB) feed used for sold data.

The AMPRE feed carries closed/sold listings with ``CloseDate`` and
``ClosePrice`` fields that DDF does not expose. It is queried directly
(no local mirror) and each query is short-cached to avoid hammering
the upstream on repeated dashboard views.
"""
from __future__ import annotations

import logging
from typing import Any, Iterable

import requests
from django.conf import settings


logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 30
MAX_PAGES_SAFETY = 50


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
) -> list[dict[str, Any]]:
    """Fetch a single AMPRE Property page and return the ``value`` array.

    ``top`` is capped at 1000 by AMPRE, and this function follows
    ``@odata.nextLink`` up to ``MAX_PAGES_SAFETY`` pages.
    """
    params: dict[str, Any] = {"$top": min(int(top or 500), 1000)}
    if filter_expression:
        params["$filter"] = filter_expression
    if select_fields:
        params["$select"] = ",".join(select_fields)
    if orderby:
        params["$orderby"] = orderby

    url = f"{_base_url()}/Property"
    all_rows: list[dict[str, Any]] = []
    pages = 0
    next_params: dict[str, Any] | None = params

    while url and pages < MAX_PAGES_SAFETY:
        try:
            response = requests.get(
                url,
                headers=_headers(),
                params=next_params,
                timeout=DEFAULT_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("AMPRE Property fetch failed: %s", exc)
            raise AmpreClientError(str(exc)) from exc

        data = response.json() or {}
        all_rows.extend(data.get("value") or [])
        url = data.get("@odata.nextLink")
        next_params = None
        pages += 1

    return all_rows
