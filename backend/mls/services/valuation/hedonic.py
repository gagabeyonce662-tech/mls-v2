"""
Hedonic-style estimate from comps: median $/sqft baseline + feature deltas,
optional ridge on log-price when enough comps.
"""
from __future__ import annotations

import math
from statistics import median
from typing import Any, Dict, List, Optional, Tuple

import numpy as np


def _f(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        return float(x)
    except (TypeError, ValueError):
        return default


def _i(x: Any, default: int = 0) -> int:
    try:
        if x is None:
            return default
        return int(x)
    except (TypeError, ValueError):
        return default


def _ridge_log_price(comps: List[Dict[str, Any]], subject: Dict[str, Any]) -> Optional[float]:
    """Returns point estimate in dollars, or None if ill-conditioned."""
    if len(comps) < 6:
        return None
    y = []
    X = []
    for c in comps:
        p = c.get("price") or 0
        sq = c.get("living_area") or 0
        if p <= 0 or sq <= 0:
            continue
        beds = _i(c.get("bedrooms_total"), 0)
        baths = _i(c.get("bathrooms_total_integer"), 0)
        y.append(math.log(p))
        X.append([1.0, math.log(sq), beds, baths])
    if len(y) < 6:
        return None
    Xn = np.array(X, dtype=float)
    yn = np.array(y, dtype=float)
    lam = 0.5
    try:
        XtX = Xn.T @ Xn + lam * np.eye(Xn.shape[1])
        beta = np.linalg.solve(XtX, Xn.T @ yn)
    except np.linalg.LinAlgError:
        return None
    ssq = max(_f(subject.get("living_area"), 0), 1.0)
    sbed = _i(subject.get("bedrooms_total"), 0)
    sbath = _i(subject.get("bathrooms_total"), 0)
    x_sub = np.array([1.0, math.log(ssq), float(sbed), float(sbath)])
    pred = float(x_sub @ beta)
    if pred <= 0 or pred > 25:  # log scale guard
        return None
    return math.exp(pred)


def apply_hedonic(subject: Dict[str, Any], comps: List[Dict[str, Any]]) -> Dict[str, Any]:
    breakdown: List[Dict[str, Any]] = []
    if not comps:
        return {
            "point": 0.0,
            "low": 0.0,
            "high": 0.0,
            "quick_sale_low": 0.0,
            "quick_sale_high": 0.0,
            "breakdown": [],
            "confidence": "none",
        }

    sqft_sub = _f(subject.get("living_area"), 0)
    pps_list = []
    for c in comps:
        p = c.get("price") or 0
        sq = c.get("living_area") or 0
        if p > 0 and sq > 0:
            pps_list.append(p / sq)
    pps = median(pps_list) if pps_list else median(c["price"] for c in comps if c.get("price"))

    if sqft_sub > 0 and pps_list:
        baseline = pps * sqft_sub
        areas = [float(c["living_area"]) for c in comps if c.get("living_area")]
        if areas:
            med_a = median(areas)
            breakdown.append(
                {"feature": "living_area", "delta": round((sqft_sub - med_a) * pps, 2)}
            )
    else:
        baseline = median(c["price"] for c in comps if c.get("price"))

    med_beds = median(_i(c.get("bedrooms_total"), 0) for c in comps)
    med_baths = median(_i(c.get("bathrooms_total_integer"), 0) for c in comps)
    park_vals = [_i(c.get("parking_total"), 0) for c in comps if c.get("parking_total") is not None]
    med_park = median(park_vals) if park_vals else 0

    bed_delta = (_i(subject.get("bedrooms_total"), 0) - med_beds) * (baseline * 0.025 if baseline else 0)
    breakdown.append({"feature": "bedrooms_total", "delta": round(bed_delta, 2)})

    bath_delta = (_i(subject.get("bathrooms_total"), 0) - med_baths) * (baseline * 0.02 if baseline else 0)
    breakdown.append({"feature": "bathrooms_total", "delta": round(bath_delta, 2)})

    partial = _i(subject.get("bedrooms_partial"), 0)
    if partial:
        pdelta = partial * (baseline * 0.015 if baseline else 0)
        breakdown.append({"feature": "bedrooms_partial", "delta": round(pdelta, 2)})
    else:
        pdelta = 0

    park_delta = (_i(subject.get("parking_total"), 0) - med_park) * (baseline * 0.012 if baseline else 0)
    breakdown.append({"feature": "parking_total", "delta": round(park_delta, 2)})

    # Lot frontage x depth premium (rough)
    lf = _f(subject.get("lot_frontage"), 0)
    ld = _f(subject.get("lot_depth"), 0)
    lot_delta = 0.0
    if lf > 0 and ld > 0:
        lot_area = lf * ld
        comp_lot_areas = []
        for c in comps:
            la = c.get("lot_area")
            if la:
                comp_lot_areas.append(float(la))
        if comp_lot_areas:
            med_lot = median(comp_lot_areas)
            if med_lot > 0:
                lot_delta = (lot_area - med_lot) * 35.0  # $/sqft lot rough
                breakdown.append({"feature": "lot_size", "delta": round(lot_delta, 2)})

    # Tax sanity: higher tax vs median -> small negative
    tax_sub = _f(subject.get("tax_annual_amount"), 0)
    taxes = [_f(c.get("tax_annual_amount"), 0) for c in comps if c.get("tax_annual_amount")]
    tax_delta = 0.0
    if tax_sub > 0 and taxes:
        mt = median(taxes)
        if mt > 0:
            tax_delta = (mt - tax_sub) * 0.15  # lower tax -> slight positive
            breakdown.append({"feature": "tax_annual_amount", "delta": round(tax_delta, 2)})

    point = baseline + bed_delta + bath_delta + pdelta + park_delta + lot_delta + tax_delta

    ridge_point = _ridge_log_price(comps, subject)
    if ridge_point and ridge_point > 0:
        point = 0.5 * point + 0.5 * ridge_point

    if point <= 0:
        point = median(c["price"] for c in comps if c.get("price"))

    low = point * 0.92
    high = point * 1.08
    quick_sale_low = point * 0.89
    quick_sale_high = point * 0.94

    conf = "high" if len(comps) >= 6 else ("medium" if len(comps) >= 3 else "low")

    return {
        "point": round(point, 2),
        "low": round(low, 2),
        "high": round(high, 2),
        "quick_sale_low": round(quick_sale_low, 2),
        "quick_sale_high": round(quick_sale_high, 2),
        "breakdown": breakdown,
        "confidence": conf,
    }
