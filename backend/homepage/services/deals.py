"""GTA market deals: the steepest recent price cuts.

A "deal" here is factual, not an opinion: an active listing whose current
asking price is below its original asking price. We rank by the size of the
cut and show both prices, so the claim is checkable.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Iterable

from .ampre import parse_date
from .common import base_city, to_float

# A cut under 2% is rounding / relisting noise; over 40% is almost always a
# data error (a monthly price corrected to a sale price, etc.).
MIN_DROP_PCT = 2.0
MAX_DROP_PCT = 40.0


@dataclass(frozen=True)
class Deal:
    mls_number: str
    address: str
    city: str
    property_sub_type: str
    bedrooms: int | None
    bathrooms: int | None
    list_price: float
    original_price: float
    drop_amount: float
    drop_pct: float
    changed_on: str | None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def rank_price_drops(rows: Iterable[dict[str, Any]], limit: int) -> list[Deal]:
    deals: list[Deal] = []
    seen: set[str] = set()
    for row in rows:
        key = row.get("ListingKey")
        price = to_float(row.get("ListPrice"))
        original = to_float(row.get("OriginalListPrice"))
        if not key or key in seen or not price or not original or price >= original:
            continue
        drop = original - price
        pct = drop / original * 100
        if not (MIN_DROP_PCT <= pct <= MAX_DROP_PCT):
            continue
        seen.add(key)
        changed = parse_date(row.get("PriceChangeTimestamp"))
        deals.append(
            Deal(
                mls_number=key,
                address=(row.get("UnparsedAddress") or "").split(",")[0].strip(),
                city=base_city(row.get("City")),
                property_sub_type=row.get("PropertySubType") or "",
                bedrooms=row.get("BedroomsTotal"),
                bathrooms=row.get("BathroomsTotalInteger"),
                list_price=price,
                original_price=original,
                drop_amount=round(drop),
                drop_pct=round(pct, 1),
                changed_on=changed.isoformat() if changed else None,
            )
        )
    deals.sort(key=lambda d: d.drop_pct, reverse=True)
    return deals[:limit]
