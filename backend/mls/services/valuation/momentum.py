"""
30-day vs prior 30-day momentum using PropertySoldProxy in the same FSA,
with fallback to PropertySnapshot list_price drift for listings in FSA.
"""
from __future__ import annotations

from statistics import median
from typing import Any, Dict, List, Optional

from django.utils import timezone
from datetime import timedelta

from mls.models import Property, PropertySnapshot, PropertySoldProxy


def _fsa_from_postal(postal: Optional[str]) -> str:
    if not postal:
        return ""
    s = "".join(c for c in str(postal).upper() if c.isalnum())
    return s[:3] if len(s) >= 3 else ""


def compute_trend(fsa: Optional[str], days: int = 30) -> Dict[str, Any]:
    fsa3 = _fsa_from_postal(fsa)
    now = timezone.now()
    recent_start = now - timedelta(days=days)
    prior_start = now - timedelta(days=days * 2)
    prior_end = recent_start

    pct_30d = 0.0
    applied = 0.0

    if len(fsa3) == 3:
        recent_sold = list(
            PropertySoldProxy.objects.filter(fsa=fsa3, sold_at_proxy__gte=recent_start, last_list_price__gt=0).values_list(
                "last_list_price", flat=True
            )
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
        # Snapshot-based: latest list_price per listing in each window
        keys = list(
            Property.objects.filter(postal_code__istartswith=fsa3).values_list("listing_key", flat=True)[:2000]
        )
        if keys:
            pct_30d = _snapshot_price_momentum(keys, recent_start, now, prior_start, prior_end)

    # Clamp applied multiplier to ±5%
    applied = max(-5.0, min(5.0, pct_30d)) / 100.0

    return {
        "pct_30d": round(pct_30d, 2),
        "applied": round(applied, 4),
    }


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
