"""AMPRE (TRREB) queries used by the homepage feeds.

The DDF feed that ``mls.Property`` is synced from carries active listings
only, with no price history or sold data. AMPRE has both, so deals, repeat-sale
losses and the market snapshot read from it. ``mls.services.ampre_client``
does the HTTP and paging; this module only builds the OData queries.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Iterable

from django.utils import timezone

from mls.services.ampre_client import fetch_property_page
from mls.views_market import GTA_CITIES


def city_clause(cities: Iterable[str]) -> str:
    """OData OR of ``startswith(City, …)`` — AMPRE has no ``in``, and codes
    Toronto by district ("Toronto C08"), so exact matches miss it."""
    return " or ".join(
        f"startswith(City,'{c.replace(chr(39), chr(39) * 2)}')" for c in cities
    )


# Homes only. AMPRE mixes in commercial, business sales, parking spaces and
# lockers — a "deal" on a parking spot or a 37% cut on a restaurant business
# is not what a homebuyer's section means.
RESIDENTIAL_CLAUSE = (
    "startswith(PropertyType,'Residential') "
    "and PropertySubType ne 'Parking Space' and PropertySubType ne 'Locker'"
)


def _dates(days_back: int) -> tuple[str, str]:
    today = timezone.now().date()
    # Upper bound too: some TRREB rows carry corrupt future CloseDates
    # (e.g. 2925-11-28) that would otherwise sort to the top.
    return (today - timedelta(days=days_back)).isoformat(), (today + timedelta(days=1)).isoformat()


def fetch_price_drops(cities: Iterable[str] = GTA_CITIES, days: int = 30, max_rows: int = 500) -> list[dict[str, Any]]:
    """Active for-sale listings whose price was cut in the last ``days``."""
    start, _ = _dates(days)
    return fetch_property_page(
        filter_expression=(
            f"({city_clause(cities)}) "
            "and StandardStatus eq 'Active' and TransactionType eq 'For Sale' "
            f"and {RESIDENTIAL_CLAUSE} "
            "and ListPrice lt OriginalListPrice "
            f"and PriceChangeTimestamp ge {start}T00:00:00Z"
        ),
        select_fields=[
            "ListingKey", "UnparsedAddress", "City", "PropertySubType",
            "BedroomsTotal", "BathroomsTotalInteger", "ListPrice",
            "OriginalListPrice", "PriceChangeTimestamp",
        ],
        orderby="PriceChangeTimestamp desc",
        top=min(max_rows, 1000),
        max_rows=max_rows,
    )


def fetch_closed_sales(city: str, days: int, max_rows: int = 40000) -> list[dict[str, Any]]:
    """Closed residential for-sale transactions in one city over ``days``
    (leases excluded: a closed lease has a ClosePrice too, but it's a monthly
    rent)."""
    start, end = _dates(days)
    return fetch_property_page(
        filter_expression=(
            f"({city_clause([city])}) "
            "and StandardStatus eq 'Closed' and TransactionType eq 'For Sale' "
            f"and {RESIDENTIAL_CLAUSE} "
            f"and CloseDate ge {start} and CloseDate le {end}"
        ),
        select_fields=[
            "ListingKey", "UnparsedAddress", "City", "PropertySubType",
            "BedroomsTotal", "BathroomsTotalInteger", "ClosePrice", "CloseDate",
            # For days-on-market and sale-to-list in the market snapshot.
            "ListPrice", "OriginalListPrice", "OriginalEntryTimestamp",
        ],
        # Newest first, so a capped fetch drops the oldest sales, not the latest.
        orderby="CloseDate desc",
        top=1000,
        max_rows=max_rows,
    )


def parse_date(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None
