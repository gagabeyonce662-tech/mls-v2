"""GTA market snapshot: this month's sold market against last month's.

"Month" is a rolling 30 days, so the figure moves daily instead of jumping on
the 1st. Aggregation reuses the sold-trends helpers in ``mls.views_market``
(same median / DOM / sale-to-list maths as the Market Trends page); the input
differs deliberately — residential sales only, see ``ampre.RESIDENTIAL_CLAUSE``.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Iterable

from mls.views_market import _bucket_sold_rows, _summarise_sold_bucket

from .ampre import parse_date
from .common import pct

WINDOW_DAYS = 30


def _summarise(rows: list[dict[str, Any]]) -> dict[str, Any]:
    # Bucketing into one synthetic city gives a single GTA-wide summary.
    _, totals = _bucket_sold_rows(
        ({**row, "City": "GTA"} for row in rows), requested_cities=["GTA"]
    )
    bucket = totals.get("GTA")
    return _summarise_sold_bucket(bucket) if bucket else _summarise_sold_bucket(
        {"prices": [], "dom": [], "ratios": [], "count": []}
    )


def build_snapshot(rows: Iterable[dict[str, Any]], today: date, active_listings: int) -> dict[str, Any]:
    current_start = today - timedelta(days=WINDOW_DAYS)
    previous_start = current_start - timedelta(days=WINDOW_DAYS)
    current, previous = [], []
    for row in rows:
        closed = parse_date(row.get("CloseDate"))
        if not closed or closed > today:
            continue
        if closed > current_start:
            current.append(row)
        elif closed > previous_start:
            previous.append(row)

    now, before = _summarise(current), _summarise(previous)
    median_now, median_before = now["median_sold_price"], before["median_sold_price"]
    return {
        "window_days": WINDOW_DAYS,
        "median_sold_price": median_now,
        "median_sold_price_change_pct": (
            pct(median_now - median_before, median_before)
            if median_now is not None and median_before
            else None
        ),
        "avg_days_on_market": now["avg_days_on_market"],
        "sale_to_list_ratio": now["sale_to_list_ratio"],
        "over_asking_share": now["over_asking_share"],
        "units_sold": now["units_sold"],
        "units_sold_change_pct": pct(now["units_sold"] - before["units_sold"], before["units_sold"]),
        "active_listings": active_listings,
    }
