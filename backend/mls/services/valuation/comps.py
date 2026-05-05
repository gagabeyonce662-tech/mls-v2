"""
Comparable selection: sold-proxy comps first, then active listings as fallback.
"""
from __future__ import annotations

import math
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.db.models import Q

from mls.models import Property, PropertySoldProxy


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def _norm_subtype(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _subject_sqft(subject: Dict[str, Any]) -> Optional[float]:
    v = subject.get("living_area")
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _subject_beds(subject: Dict[str, Any]) -> Optional[int]:
    v = subject.get("bedrooms_total")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def select_comps(
    subject: Dict[str, Any],
    radius_km: float = 2.0,
    max_age_days: int = 180,
    k: int = 8,
) -> List[Dict[str, Any]]:
    """
    subject expects: latitude, longitude, property_sub_type, bedrooms_total, living_area
    Returns comps sorted by distance, each dict includes price, source, distance_km, and display fields.
    """
    lat = subject.get("latitude")
    lng = subject.get("longitude")
    if lat is None or lng is None:
        return []
    try:
        slat, slng = float(lat), float(lng)
    except (TypeError, ValueError):
        return []

    sub_sqft = _subject_sqft(subject)
    sub_beds = _subject_beds(subject)
    sub_type = _norm_subtype(subject.get("property_sub_type"))

    from django.utils import timezone
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(days=max_age_days)

    def build_sold_qs(radius: float, require_subtype: bool):
        qs = PropertySoldProxy.objects.filter(
            sold_at_proxy__gte=cutoff,
            latitude__isnull=False,
            longitude__isnull=False,
            last_list_price__isnull=False,
            last_list_price__gt=0,
        )
        if require_subtype and sub_type:
            qs = qs.filter(
                Q(property_sub_type__iexact=subject.get("property_sub_type"))
                | Q(property_sub_type__istartswith=sub_type[:20])
            )
        return qs

    def score_comp(row: PropertySoldProxy) -> tuple:
        clat = float(row.latitude)
        clng = float(row.longitude)
        d = haversine_km(slat, slng, clat, clng)
        bed = row.bedrooms_total
        sq = float(row.living_area) if row.living_area else None
        bed_pen = 0
        if sub_beds is not None and bed is not None:
            bed_pen = abs(bed - sub_beds)
        sq_pen = 0.0
        if sub_sqft and sq:
            sq_pen = abs(sq - sub_sqft) / max(sub_sqft, 1.0)
        return (d, bed_pen, sq_pen)

    comps: List[Dict[str, Any]] = []
    radius = radius_km
    for attempt in range(4):
        require_subtype = attempt < 2
        qs = build_sold_qs(radius, require_subtype=require_subtype)
        candidates: List[PropertySoldProxy] = []
        batch: List[Dict[str, Any]] = []
        for row in qs.iterator(chunk_size=500):
            if row.latitude is None or row.longitude is None:
                continue
            d = haversine_km(slat, slng, float(row.latitude), float(row.longitude))
            if d > radius:
                continue
            if sub_sqft and row.living_area:
                csq = float(row.living_area)
                if csq < sub_sqft * 0.75 or csq > sub_sqft * 1.25:
                    continue
            if sub_beds is not None and row.bedrooms_total is not None:
                if abs(row.bedrooms_total - sub_beds) > 1:
                    continue
            candidates.append(row)

        candidates.sort(key=score_comp)
        for row in candidates[:k]:
            clat = float(row.latitude)
            clng = float(row.longitude)
            lot_area = float(row.lot_size_area) if row.lot_size_area else None
            batch.append(
                {
                    "listing_key": row.listing_key,
                    "price": float(row.last_list_price),
                    "latitude": clat,
                    "longitude": clng,
                    "bedrooms_total": row.bedrooms_total,
                    "bathrooms_total_integer": row.bathrooms_total_integer,
                    "living_area": float(row.living_area) if row.living_area else None,
                    "parking_total": row.parking_total,
                    "tax_annual_amount": float(row.tax_annual_amount) if row.tax_annual_amount else None,
                    "lot_area": lot_area,
                    "property_sub_type": row.property_sub_type,
                    "unparsed_address": row.unparsed_address,
                    "city": row.city,
                    "distance_km": round(haversine_km(slat, slng, clat, clng), 3),
                    "source": "sold_proxy",
                }
            )
        comps = batch
        if len(comps) >= max(3, k // 2):
            break
        radius *= 1.75

    if len(comps) < 3:
        # Fallback: active listings with list_price in wider radius
        radius2 = radius_km * 2.5
        pqs = Property.objects.filter(
            standard_status__iexact="Active",
            list_price__isnull=False,
            list_price__gt=0,
            latitude__isnull=False,
            longitude__isnull=False,
        )
        if sub_type:
            pqs = pqs.filter(property_sub_type__icontains=sub_type[:30])
        cand2: List[Property] = []
        for row in pqs.iterator(chunk_size=300):
            d = haversine_km(slat, slng, float(row.latitude), float(row.longitude))
            if d > radius2:
                continue
            if sub_sqft and row.living_area:
                csq = float(row.living_area)
                if csq < sub_sqft * 0.75 or csq > sub_sqft * 1.25:
                    continue
            if sub_beds is not None and row.bedrooms_total is not None:
                if abs(row.bedrooms_total - sub_beds) > 1:
                    continue
            cand2.append((d, row))
        cand2.sort(key=lambda t: t[0])
        existing = {c["listing_key"] for c in comps}
        for d, row in cand2[: k - len(comps)]:
            if row.listing_key in existing:
                continue
            lot_area = float(row.lot_size_area) if row.lot_size_area else None
            comps.append(
                {
                    "listing_key": row.listing_key,
                    "price": float(row.list_price),
                    "latitude": float(row.latitude),
                    "longitude": float(row.longitude),
                    "bedrooms_total": row.bedrooms_total,
                    "bathrooms_total_integer": row.bathrooms_total_integer,
                    "living_area": float(row.living_area) if row.living_area else None,
                    "parking_total": row.parking_total,
                    "tax_annual_amount": float(row.tax_annual_amount) if row.tax_annual_amount else None,
                    "lot_area": lot_area,
                    "property_sub_type": row.property_sub_type,
                    "unparsed_address": row.unparsed_address,
                    "city": row.city,
                    "distance_km": round(d, 3),
                    "source": "active_listing",
                }
            )
            existing.add(row.listing_key)

    comps.sort(key=lambda c: c["distance_km"])
    return comps[:k]
