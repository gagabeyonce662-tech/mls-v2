"""Rental-yield estimates for sale listings ("High return properties").

Method, returned with every result as ``calc_basis`` so the UI can disclose it:

1. **Rent** — median asking rent of active *rental* listings in the same base
   city with the same bedroom count. Rentals are rows with a monthly
   ``total_actual_rent`` and no ``list_price`` (how the DDF feed carries
   leases). At least ``MIN_COMPS`` comparables are required; with fewer, the
   bedroom match widens to ±1, and with fewer still no estimate is made.
2. **Gross yield** = annual rent ÷ list price.
3. **Cap rate** = (annual rent × (1 − vacancy) − property tax − condo fees −
   maintenance allowance) ÷ list price. Financing is excluded, as is standard
   for cap rate.

These are estimates from asking rents, not appraisals — the API labels them so.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

from .common import base_city, median, to_float

MIN_COMPS = 3
VACANCY_RATE = 0.04  # CMHC GTA purpose-built vacancy has run ~1.5–4%; use the high end.
MAINTENANCE_RATE = 0.01  # 1% of value per year, the common rule of thumb.
# Guard rails: a "yield" outside this band is almost always bad data
# (a commercial rent on a residential price, a monthly price typo…).
PLAUSIBLE_YIELD = (1.5, 15.0)

CALC_BASIS = {
    "rent": f"Median asking rent of ≥{MIN_COMPS} active rentals, same city and bedrooms (±1 if needed)",
    "vacancy_rate": VACANCY_RATE,
    "maintenance_rate": MAINTENANCE_RATE,
    "expenses": "Property tax and condo fees from the listing; maintenance at 1% of price",
    "note": "Estimates from asking rents; excludes financing. Not an appraisal.",
}


@dataclass(frozen=True)
class RentalComp:
    city: str
    bedrooms: int | None
    monthly_rent: float


@dataclass(frozen=True)
class InvestorMetrics:
    estimated_monthly_rent: float
    comps_used: int
    gross_yield_pct: float
    cap_rate_pct: float


def estimate_rent(
    comps: Sequence[RentalComp], city: str, bedrooms: int | None
) -> tuple[float, int] | None:
    """Median comparable rent and how many comps backed it, or None."""
    city_key = base_city(city).lower()
    local = [c for c in comps if base_city(c.city).lower() == city_key]
    if bedrooms is None:
        return None
    for spread in (0, 1):
        pool = [
            c.monthly_rent
            for c in local
            if c.bedrooms is not None and abs(c.bedrooms - bedrooms) <= spread
        ]
        if len(pool) >= MIN_COMPS:
            return round(median(pool) or 0, 2), len(pool)
    return None


def annual_condo_fees(fee: float | None, frequency: str | None) -> float:
    if not fee:
        return 0.0
    freq = (frequency or "").strip().lower()
    if freq in ("annually", "yearly", "annual"):
        return fee
    if freq in ("quarterly",):
        return fee * 4
    # Monthly is the overwhelming norm in Ontario, and the safe default: it
    # never makes a listing look better than it is.
    return fee * 12


def investor_metrics(
    *,
    price: float,
    monthly_rent: float,
    comps_used: int,
    annual_tax: float | None,
    condo_fee: float | None,
    condo_fee_frequency: str | None,
) -> InvestorMetrics | None:
    if price <= 0 or monthly_rent <= 0:
        return None
    annual_rent = monthly_rent * 12
    gross = annual_rent / price * 100
    if not (PLAUSIBLE_YIELD[0] <= gross <= PLAUSIBLE_YIELD[1]):
        return None
    expenses = (
        (annual_tax or 0.0)
        + annual_condo_fees(condo_fee, condo_fee_frequency)
        + price * MAINTENANCE_RATE
    )
    noi = annual_rent * (1 - VACANCY_RATE) - expenses
    return InvestorMetrics(
        estimated_monthly_rent=round(monthly_rent),
        comps_used=comps_used,
        gross_yield_pct=round(gross, 1),
        cap_rate_pct=round(noi / price * 100, 1),
    )


def rank_candidates(
    candidates: Iterable[dict], comps: Sequence[RentalComp], limit: int
) -> list[dict]:
    """Attach metrics to sale listings and return the best cap rates first.

    ``candidates`` are dicts with price / city / bedrooms / annual_tax /
    condo_fee / condo_fee_frequency plus whatever the caller wants passed
    through. Listings without enough comps are skipped, never guessed.
    """
    ranked: list[tuple[float, dict]] = []
    for row in candidates:
        price = to_float(row.get("price"))
        if not price:
            continue
        estimate = estimate_rent(comps, row.get("city") or "", row.get("bedrooms"))
        if not estimate:
            continue
        rent, used = estimate
        metrics = investor_metrics(
            price=price,
            monthly_rent=rent,
            comps_used=used,
            annual_tax=to_float(row.get("annual_tax")),
            condo_fee=to_float(row.get("condo_fee")),
            condo_fee_frequency=row.get("condo_fee_frequency"),
        )
        if metrics:
            ranked.append((metrics.cap_rate_pct, {**row, "metrics": metrics}))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return [row for _, row in ranked[:limit]]
