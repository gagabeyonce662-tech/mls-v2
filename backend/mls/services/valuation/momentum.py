"""
Market momentum for hybrid CMA.

Prefers city-level median ClosePrice trends from AMPRE sold-trends. Falls back
to FSA sold-proxy / snapshot momentum when sold trends are unavailable.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from statistics import median
from typing import Any, Dict, List, Optional

from django.utils import timezone

from mls.models import Property, PropertySnapshot, PropertySoldProxy

logger = logging.getLogger(__name__)

# Applied multiplier clamp for the estimate (±8%).
APPLIED_CLAMP_PCT = 8.0
PRIOR_SALE_ANCHOR_WEIGHT = 0.15


def _fsa_from_postal(postal: Optional[str]) -> str:
    if not postal:
        return ""
    s = "".join(c for c in str(postal).upper() if c.isalnum())
    return s[:3] if len(s) >= 3 else ""


def _pct_change(newer: Optional[float], older: Optional[float]) -> float:
    if newer is None or older is None or older <= 0:
        return 0.0
    return (newer - older) / older


def _median_from_months(months: List[Dict[str, Any]], start_idx: int, end_idx: int) -> Optional[float]:
    """Median of median_sold_price across months[start_idx:end_idx] (inclusive end exclusive)."""
    if start_idx < 0:
        start_idx = 0
    slice_ = months[start_idx:end_idx]
    prices = [
        float(m["median_sold_price"])
        for m in slice_
        if m.get("median_sold_price") not in (None, 0, 0.0)
    ]
    if len(prices) < 1:
        return None
    return median(prices)


def _sold_trend_from_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    months = list(payload.get("months") or [])
    # Prefer the first series entry when multi-city shape is returned.
    if not months and payload.get("series"):
        first = payload["series"][0] if payload["series"] else {}
        months = list(first.get("months") or [])
    months = sorted(months, key=lambda m: m.get("month") or "")
    series = [
        {
            "month": m.get("month"),
            "median_sold_price": m.get("median_sold_price"),
            "units_sold": m.get("units_sold"),
        }
        for m in months
        if m.get("month")
    ]

    n = len(months)
    pct_30d = 0.0
    pct_90d = 0.0
    pct_12m = 0.0
    if n >= 2:
        recent_1 = _median_from_months(months, n - 1, n)
        prior_1 = _median_from_months(months, n - 2, n - 1)
        pct_30d = _pct_change(recent_1, prior_1) * 100.0
    if n >= 6:
        recent_3 = _median_from_months(months, n - 3, n)
        prior_3 = _median_from_months(months, n - 6, n - 3)
        pct_90d = _pct_change(recent_3, prior_3) * 100.0
    elif n >= 4:
        recent_3 = _median_from_months(months, n - 3, n)
        prior_3 = _median_from_months(months, max(0, n - 6), n - 3)
        pct_90d = _pct_change(recent_3, prior_3) * 100.0
    if n >= 12:
        recent_half = _median_from_months(months, n - 3, n)
        year_ago = _median_from_months(months, n - 12, n - 9)
        pct_12m = _pct_change(recent_half, year_ago) * 100.0
    elif n >= 6:
        recent_half = _median_from_months(months, n - 2, n)
        older = _median_from_months(months, 0, 2)
        pct_12m = _pct_change(recent_half, older) * 100.0

    # Prefer 90d for the applied multiplier; fall back to 30d then 12m.
    applied_pct = pct_90d if pct_90d != 0.0 else (pct_30d if pct_30d != 0.0 else pct_12m)
    applied = max(-APPLIED_CLAMP_PCT, min(APPLIED_CLAMP_PCT, applied_pct)) / 100.0

    # Store as fractions (0.012 = 1.2%). Frontend multiplies by 100 for display.
    return {
        "pct_30d": round(pct_30d / 100.0, 4),
        "pct_90d": round(pct_90d / 100.0, 4),
        "pct_12m": round(pct_12m / 100.0, 4),
        "applied": round(applied, 4),
        "source": "sold_close_price",
        "series": series,
    }


def _proxy_trend(fsa: Optional[str], days: int = 30) -> Dict[str, Any]:
    """Legacy FSA last-ask / snapshot momentum (fractional pct_30d like before)."""
    fsa3 = _fsa_from_postal(fsa)
    now = timezone.now()
    recent_start = now - timedelta(days=days)
    prior_start = now - timedelta(days=days * 2)
    prior_end = recent_start
    pct_30d = 0.0

    if len(fsa3) == 3:
        recent_sold = list(
            PropertySoldProxy.objects.filter(
                fsa=fsa3, sold_at_proxy__gte=recent_start, last_list_price__gt=0
            ).values_list("last_list_price", flat=True)
        )
        prior_sold = list(
            PropertySoldProxy.objects.filter(
                fsa=fsa3,
                sold_at_proxy__gte=prior_start,
                sold_at_proxy__lt=prior_end,
                last_list_price__gt=0,
            ).values_list("last_list_price", flat=True)
        )
        if len(recent_sold) >= 2 and len(prior_sold) >= 2:
            mr = median(float(x) for x in recent_sold)
            mp = median(float(x) for x in prior_sold)
            if mp > 0:
                pct_30d = (mr - mp) / mp * 100.0

    if pct_30d == 0.0 and len(fsa3) == 3:
        keys = list(
            Property.objects.filter(postal_code__istartswith=fsa3).values_list("listing_key", flat=True)[:2000]
        )
        if keys:
            pct_30d = _snapshot_price_momentum(keys, recent_start, now, prior_start, prior_end)

    applied = max(-APPLIED_CLAMP_PCT, min(APPLIED_CLAMP_PCT, pct_30d)) / 100.0
    return {
        "pct_30d": round(pct_30d / 100.0, 4),
        "pct_90d": 0.0,
        "pct_12m": 0.0,
        "applied": round(applied, 4),
        "source": "sold_proxy_fsa",
        "series": [],
    }


def compute_trend(
    fsa: Optional[str] = None,
    days: int = 30,
    *,
    city: Optional[str] = None,
    community: Optional[str] = None,
) -> Dict[str, Any]:
    """Sold-close-price trend when city is known; else FSA proxy momentum.

    ``pct_30d`` / ``pct_90d`` / ``pct_12m`` are fractional (0.012 = 1.2%) when
    ``source`` is ``sold_close_price``. The proxy fallback keeps the legacy
    percent-number shape for ``pct_30d`` only.
    """
    del days  # signature compatibility
    city_name = (city or "").strip()
    if city_name:
        try:
            from mls.views_market import get_sold_trends

            payload = get_sold_trends(
                [city_name],
                window_months=12,
                scope="",
                property_sub_types=None,
                community=(community or "").strip() or None,
            )
            trend = _sold_trend_from_payload(payload)
            # Normalize sold path pct_30d to fractional for a consistent frontend
            # mapper: frontend currently does Number(pct_30d) * 100. Proxy path
            # historically returned percent numbers — sold path now returns
            # fractions so * 100 yields the display percent.
            if trend.get("series"):
                return trend
        except Exception as exc:  # noqa: BLE001 - never fail valuation on trends
            logger.warning("sold-trend momentum unavailable for %s: %s", city_name, exc)

    return _proxy_trend(fsa)


def prior_sale_anchor(
    subject: Dict[str, Any],
    trend: Dict[str, Any],
) -> Optional[float]:
    """WOWA-style prior sale × neighbourhood growth, or None if inputs missing."""
    prior_price = subject.get("last_sold_price") or subject.get("close_price")
    prior_date = subject.get("last_sold_date") or subject.get("close_date")
    if not prior_price or not prior_date:
        return None
    try:
        price = float(prior_price)
    except (TypeError, ValueError):
        return None
    if price <= 0:
        return None

    try:
        from datetime import date

        sold_on = date.fromisoformat(str(prior_date)[:10])
    except ValueError:
        return None

    years = max(0.0, (timezone.now().date() - sold_on).days / 365.25)
    if years <= 0:
        return round(price, 2)

    # Prefer 12m sold growth annualized; else applied 90d annualized.
    pct_12m = float(trend.get("pct_12m") or 0.0)
    # sold path stores fractions; proxy path pct_12m is 0.
    if abs(pct_12m) > 1.5:
        # Defensive: if someone stored percent numbers, scale down.
        pct_12m = pct_12m / 100.0
    if pct_12m == 0.0:
        applied = float(trend.get("applied") or 0.0)
        # applied is ~90d; annualize roughly ×4
        pct_12m = applied * 4.0

    growth = (1.0 + pct_12m) ** years - 1.0
    # Clamp cumulative growth to a sane band.
    growth = max(-0.5, min(2.0, growth))
    return round(price * (1.0 + growth), 2)


def blend_with_prior_anchor(cma_point: float, anchor: Optional[float], weight: float = PRIOR_SALE_ANCHOR_WEIGHT) -> float:
    if not anchor or cma_point <= 0 or weight <= 0:
        return cma_point
    return (1.0 - weight) * cma_point + weight * anchor


def _median_latest_prices(listing_keys: List[str], start, end) -> Optional[float]:
    if not listing_keys:
        return None
    prices: List[float] = []
    for lk in listing_keys:
        snap = (
            PropertySnapshot.objects.filter(listing_key=lk, created_at__gte=start, created_at__lt=end)
            .order_by("-created_at")
            .first()
        )
        if snap and snap.list_price and snap.list_price > 0:
            prices.append(float(snap.list_price))
    if len(prices) < 2:
        return None
    return median(prices)


def _snapshot_price_momentum(
    listing_keys: List[str],
    recent_start,
    now,
    prior_start,
    prior_end,
) -> float:
    mr = _median_latest_prices(listing_keys, recent_start, now)
    mp = _median_latest_prices(listing_keys, prior_start, prior_end)
    if mr is None or mp is None or mp <= 0:
        return 0.0
    return (mr - mp) / mp * 100.0
