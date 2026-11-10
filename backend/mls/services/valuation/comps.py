"""
Comparable selection for hybrid CMA (WOWA-style).

Priority for pricing comps:
  1. AMPRE closed sales with real ClosePrice
  2. PropertySoldProxy last-ask (last resort)
Active listings are collected separately as a DOM / asking-price signal and
are not mixed into the hedonic point when enough real sold comps exist.
"""
from __future__ import annotations

import hashlib
import logging
import math
import re
from datetime import timedelta
from typing import Any, Dict, List, Optional, Tuple

from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone

from mls.models import Property, PropertySoldProxy
from mls.services.ampre_client import AmpreClientError, fetch_property_page

logger = logging.getLogger(__name__)

RESIDENTIAL_SOLD_CLAUSE = (
    "startswith(PropertyType,'Residential') "
    "and PropertySubType ne 'Parking Space' and PropertySubType ne 'Locker'"
)

# Keep this aligned with fields proven in recent-sales / sold-trends queries.
# Latitude/Longitude are omitted: AMPRE often 400s unknown $select fields, which
# previously wiped the entire sold-comp set and produced a $0 estimate.
AMPRE_SOLD_SELECT = [
    "ListingKey",
    "UnparsedAddress",
    "City",
    "CityRegion",
    "PropertySubType",
    "BedroomsTotal",
    "BathroomsTotalInteger",
    "ClosePrice",
    "CloseDate",
    "ListPrice",
    "OriginalListPrice",
    "OriginalEntryTimestamp",
    "LivingArea",
    "LivingAreaRange",
    "YearBuilt",
    "ApproximateAge",
    "ParkingTotal",
    "TaxAnnualAmount",
    "LotSizeArea",
]

# Progressive WOWA-style passes: tighten first, then widen when sparse.
# (sqft_tol, age_years_or_None, max_age_days, radius_km, require_subtype, min_comps)
WOWA_PASSES: List[Tuple[float, Optional[int], int, float, bool, int]] = [
    (0.10, 5, 365, 2.0, True, 5),
    (0.15, 10, 365, 5.0, True, 5),
    (0.25, None, 730, 10.0, False, 3),
]

AMPRE_CACHE_SECONDS = 60 * 60
AMPRE_MAX_ROWS = 800
PRICING_K = 8
ACTIVE_K = 5


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


def _subject_year(subject: Dict[str, Any]) -> Optional[int]:
    for key in ("year_built", "approximate_age"):
        v = subject.get(key)
        if v is None:
            continue
        try:
            n = int(v)
        except (TypeError, ValueError):
            continue
        # ApproximateAge sometimes arrives as an age-in-years rather than a year.
        if key == "approximate_age" and n < 300:
            return timezone.now().year - n
        if 1800 <= n <= 2100:
            return n
    return None


def _parse_living_area(row: Dict[str, Any]) -> Optional[float]:
    raw = row.get("LivingArea")
    if raw not in (None, ""):
        try:
            return float(raw)
        except (TypeError, ValueError):
            pass
    rng = (row.get("LivingAreaRange") or "").strip()
    if not rng:
        return None
    nums = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", rng)]
    if not nums:
        return None
    return sum(nums) / len(nums)


def _parse_year_built(row: Dict[str, Any]) -> Optional[int]:
    for key in ("YearBuilt", "ApproximateAge"):
        raw = row.get(key)
        if raw in (None, ""):
            continue
        try:
            n = int(float(raw))
        except (TypeError, ValueError):
            continue
        if key == "ApproximateAge" and n < 300:
            return timezone.now().year - n
        if 1800 <= n <= 2100:
            return n
    return None


def _parse_ampre_date(raw: Any) -> Optional[str]:
    if not raw:
        return None
    text = str(raw)
    # AMPRE often returns "2024-06-15T00:00:00Z" or "/Date(...)/"
    if text.startswith("/Date("):
        return None
    return text[:10]


def _days_on_market(close_date: Optional[str], entry_raw: Any) -> Optional[int]:
    if not close_date or not entry_raw:
        return None
    entry = _parse_ampre_date(entry_raw)
    if not entry:
        return None
    try:
        from datetime import date

        c = date.fromisoformat(close_date)
        e = date.fromisoformat(entry)
        dom = (c - e).days
        return dom if dom >= 0 else None
    except ValueError:
        return None


def _city_prefix(city: Optional[str]) -> str:
    """Normalize MLS city labels for AMPRE ``startswith(City, ...)``.

    Local rows sometimes store district-coded cities like ``Toronto C01``.
    AMPRE matches on the same pattern, so querying the bare municipality
    (``Toronto``) finds every district; querying ``Toronto C01`` finds almost none.
    """
    text = (city or "").strip()
    if not text:
        return ""
    m = re.match(r"^(.*?)\s+[CEWN]\d{2}\s*$", text, flags=re.IGNORECASE)
    if m and m.group(1).strip():
        return m.group(1).strip()
    return text


def _fetch_ampre_sold_rows(city: str, max_age_days: int, subtype: Optional[str]) -> List[Dict[str, Any]]:
    """Closed residential sales for a city window, cached 1h."""
    if not city:
        return []
    digest = hashlib.md5(
        f"{city.lower()}|{max_age_days}|{(subtype or '').lower()}".encode()
    ).hexdigest()
    cache_key = f"valuation-ampre-sold:v1:{digest}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    now = timezone.now()
    start = (now - timedelta(days=max_age_days)).date().isoformat()
    end = (now + timedelta(days=1)).date().isoformat()
    quoted = city.replace("'", "''")
    expression = (
        f"startswith(City,'{quoted}') "
        "and StandardStatus eq 'Closed' "
        "and TransactionType eq 'For Sale' "
        f"and {RESIDENTIAL_SOLD_CLAUSE} "
        f"and CloseDate ge {start} "
        f"and CloseDate lt {end}"
    )
    if subtype:
        st = subtype.replace("'", "''")
        expression += f" and startswith(PropertySubType,'{st}')"

    try:
        rows = fetch_property_page(
            filter_expression=expression,
            select_fields=AMPRE_SOLD_SELECT,
            orderby="CloseDate desc",
            top=1000,
            max_rows=AMPRE_MAX_ROWS,
        )
    except AmpreClientError as exc:
        logger.warning("AMPRE sold comps failed for %s: %s", city, exc)
        return []

    cache.set(cache_key, rows, AMPRE_CACHE_SECONDS)
    return rows


def _ampre_row_to_comp(
    row: Dict[str, Any],
    slat: float,
    slng: float,
) -> Optional[Dict[str, Any]]:
    close_price = row.get("ClosePrice")
    if not close_price:
        return None
    try:
        price = float(close_price)
    except (TypeError, ValueError):
        return None
    if price <= 0:
        return None

    # Lat/lng are ideal but not always returned by AMPRE. Keep the sold
    # ClosePrice anyway and treat unknown distance as "same city" (~4 km).
    clat: Optional[float] = None
    clng: Optional[float] = None
    distance_km = 4.0
    lat = row.get("Latitude")
    lng = row.get("Longitude")
    if lat is not None and lng is not None:
        try:
            clat = float(lat)
            clng = float(lng)
            distance_km = round(haversine_km(slat, slng, clat, clng), 3)
        except (TypeError, ValueError):
            clat = clng = None
            distance_km = 4.0

    close_date = _parse_ampre_date(row.get("CloseDate"))
    list_price = row.get("ListPrice") or row.get("OriginalListPrice")
    try:
        list_price_f = float(list_price) if list_price not in (None, "") else None
    except (TypeError, ValueError):
        list_price_f = None
    living = _parse_living_area(row)
    year_built = _parse_year_built(row)
    beds = row.get("BedroomsTotal")
    baths = row.get("BathroomsTotalInteger")
    parking = row.get("ParkingTotal")
    tax = row.get("TaxAnnualAmount")
    lot = row.get("LotSizeArea")
    try:
        beds_i = int(beds) if beds is not None else None
    except (TypeError, ValueError):
        beds_i = None
    try:
        baths_i = int(baths) if baths is not None else None
    except (TypeError, ValueError):
        baths_i = None
    try:
        parking_i = int(parking) if parking is not None else None
    except (TypeError, ValueError):
        parking_i = None
    try:
        tax_f = float(tax) if tax not in (None, "") else None
    except (TypeError, ValueError):
        tax_f = None
    try:
        lot_f = float(lot) if lot not in (None, "") else None
    except (TypeError, ValueError):
        lot_f = None

    return {
        "listing_key": row.get("ListingKey"),
        "price": price,
        "close_price": price,
        "list_price": list_price_f,
        "latitude": clat,
        "longitude": clng,
        "bedrooms_total": beds_i,
        "bathrooms_total_integer": baths_i,
        "living_area": living,
        "year_built": year_built,
        "parking_total": parking_i,
        "tax_annual_amount": tax_f,
        "lot_area": lot_f,
        "property_sub_type": (row.get("PropertySubType") or "").strip(),
        "unparsed_address": row.get("UnparsedAddress") or "",
        "city": row.get("City") or "",
        "city_region": row.get("CityRegion") or "",
        "distance_km": distance_km,
        "source": "sold",
        "event_date": close_date,
        "days_on_market": _days_on_market(close_date, row.get("OriginalEntryTimestamp")),
    }


def _passes_filters(
    comp: Dict[str, Any],
    *,
    sub_sqft: Optional[float],
    sub_beds: Optional[int],
    sub_year: Optional[int],
    sub_type: str,
    sqft_tol: float,
    age_years: Optional[int],
    radius_km: float,
    require_subtype: bool,
    max_age_days: int,
) -> bool:
    if comp["distance_km"] > radius_km:
        return False
    if require_subtype and sub_type:
        ctype = _norm_subtype(comp.get("property_sub_type"))
        if ctype and not (ctype == sub_type or ctype.startswith(sub_type[:20]) or sub_type.startswith(ctype[:20])):
            return False
    if sub_sqft and comp.get("living_area"):
        csq = float(comp["living_area"])
        if csq < sub_sqft * (1 - sqft_tol) or csq > sub_sqft * (1 + sqft_tol):
            return False
    if sub_beds is not None and comp.get("bedrooms_total") is not None:
        if abs(int(comp["bedrooms_total"]) - sub_beds) > 1:
            return False
    if age_years is not None and sub_year and comp.get("year_built"):
        if abs(int(comp["year_built"]) - sub_year) > age_years:
            return False
    if max_age_days and comp.get("event_date"):
        try:
            from datetime import date

            event = date.fromisoformat(str(comp["event_date"])[:10])
            if (timezone.now().date() - event).days > max_age_days:
                return False
        except ValueError:
            pass
    return True


def _score_comp(comp: Dict[str, Any], sub_sqft: Optional[float], sub_beds: Optional[int]) -> tuple:
    bed_pen = 0
    if sub_beds is not None and comp.get("bedrooms_total") is not None:
        bed_pen = abs(int(comp["bedrooms_total"]) - sub_beds)
    sq_pen = 0.0
    if sub_sqft and comp.get("living_area"):
        sq_pen = abs(float(comp["living_area"]) - sub_sqft) / max(sub_sqft, 1.0)
    return (comp["distance_km"], bed_pen, sq_pen)


def _select_ampre_sold(subject: Dict[str, Any], k: int = PRICING_K) -> List[Dict[str, Any]]:
    lat = subject.get("latitude")
    lng = subject.get("longitude")
    city = _city_prefix(subject.get("city"))
    if lat is None or lng is None or not city:
        return []
    try:
        slat, slng = float(lat), float(lng)
    except (TypeError, ValueError):
        return []

    sub_sqft = _subject_sqft(subject)
    sub_beds = _subject_beds(subject)
    sub_year = _subject_year(subject)
    sub_type = _norm_subtype(subject.get("property_sub_type"))
    subtype_prefix = (subject.get("property_sub_type") or "").strip() or None

    # Fetch the widest window once; filter per pass locally.
    raw = _fetch_ampre_sold_rows(city, max_age_days=730, subtype=None)
    if not raw and subtype_prefix:
        raw = _fetch_ampre_sold_rows(city, max_age_days=730, subtype=subtype_prefix[:30])
    candidates = []
    for row in raw:
        comp = _ampre_row_to_comp(row, slat, slng)
        if comp:
            candidates.append(comp)
    if not candidates:
        return []

    best: List[Dict[str, Any]] = []
    for sqft_tol, age_years, max_age_days, radius_km, require_subtype, min_comps in WOWA_PASSES:
        filtered = [
            c
            for c in candidates
            if _passes_filters(
                c,
                sub_sqft=sub_sqft,
                sub_beds=sub_beds,
                sub_year=sub_year,
                sub_type=sub_type,
                sqft_tol=sqft_tol,
                age_years=age_years,
                radius_km=radius_km,
                require_subtype=require_subtype,
                max_age_days=max_age_days,
            )
        ]
        filtered.sort(key=lambda c: _score_comp(c, sub_sqft, sub_beds))
        if len(filtered) >= len(best):
            best = filtered
        if len(filtered) >= min_comps:
            return filtered[:k]

    if not best:
        candidates.sort(key=lambda c: c["distance_km"])
        return candidates[:k]
    return best[:k]


def _select_sold_proxy(subject: Dict[str, Any], k: int = PRICING_K) -> List[Dict[str, Any]]:
    """Last-ask proxies — used only when AMPRE returns nothing."""
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
    cutoff = timezone.now() - timedelta(days=730)

    qs = PropertySoldProxy.objects.filter(
        sold_at_proxy__gte=cutoff,
        latitude__isnull=False,
        longitude__isnull=False,
        last_list_price__isnull=False,
        last_list_price__gt=0,
    )
    if sub_type:
        qs = qs.filter(
            Q(property_sub_type__iexact=subject.get("property_sub_type"))
            | Q(property_sub_type__istartswith=sub_type[:20])
        )

    comps: List[Dict[str, Any]] = []
    for radius in (2.0, 5.0, 10.0):
        batch: List[Dict[str, Any]] = []
        for row in qs.iterator(chunk_size=500):
            d = haversine_km(slat, slng, float(row.latitude), float(row.longitude))
            if d > radius:
                continue
            living = float(row.living_area) if row.living_area else None
            if sub_sqft and living:
                if living < sub_sqft * 0.75 or living > sub_sqft * 1.25:
                    continue
            if sub_beds is not None and row.bedrooms_total is not None:
                if abs(row.bedrooms_total - sub_beds) > 1:
                    continue
            batch.append(
                {
                    "listing_key": row.listing_key,
                    "price": float(row.last_list_price),
                    "close_price": None,
                    "list_price": float(row.last_list_price),
                    "latitude": float(row.latitude),
                    "longitude": float(row.longitude),
                    "bedrooms_total": row.bedrooms_total,
                    "bathrooms_total_integer": row.bathrooms_total_integer,
                    "living_area": living,
                    "year_built": getattr(row, "year_built", None),
                    "parking_total": row.parking_total,
                    "tax_annual_amount": float(row.tax_annual_amount) if row.tax_annual_amount else None,
                    "lot_area": float(row.lot_size_area) if row.lot_size_area else None,
                    "property_sub_type": row.property_sub_type,
                    "unparsed_address": row.unparsed_address,
                    "city": row.city,
                    "city_region": getattr(row, "city_region", "") or "",
                    "distance_km": round(d, 3),
                    "source": "sold_proxy",
                    "event_date": row.sold_at_proxy.date().isoformat() if row.sold_at_proxy else None,
                    "days_on_market": None,
                }
            )
        batch.sort(key=lambda c: _score_comp(c, sub_sqft, sub_beds))
        comps = batch[:k]
        if len(comps) >= 3:
            break
    return comps


def select_active_comps(subject: Dict[str, Any], k: int = ACTIVE_K) -> List[Dict[str, Any]]:
    """Active listings near the subject — DOM / asking-price ceiling signal."""
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
    radius = 5.0

    pqs = Property.objects.filter(
        standard_status__iexact="Active",
        list_price__isnull=False,
        list_price__gt=0,
        latitude__isnull=False,
        longitude__isnull=False,
    )
    if sub_type:
        pqs = pqs.filter(property_sub_type__icontains=sub_type[:30])

    cand: List[Tuple[float, Property]] = []
    for row in pqs.iterator(chunk_size=300):
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
        cand.append((d, row))
    cand.sort(key=lambda t: t[0])

    out: List[Dict[str, Any]] = []
    for d, row in cand[:k]:
        dom = None
        if row.original_entry_timestamp:
            dom = (timezone.now().date() - row.original_entry_timestamp.date()).days
            if dom < 0:
                dom = None
        out.append(
            {
                "listing_key": row.listing_key,
                "price": float(row.list_price),
                "close_price": None,
                "list_price": float(row.list_price),
                "latitude": float(row.latitude),
                "longitude": float(row.longitude),
                "bedrooms_total": row.bedrooms_total,
                "bathrooms_total_integer": row.bathrooms_total_integer,
                "living_area": float(row.living_area) if row.living_area else None,
                "year_built": row.year_built,
                "parking_total": row.parking_total,
                "tax_annual_amount": float(row.tax_annual_amount) if row.tax_annual_amount else None,
                "lot_area": float(row.lot_size_area) if row.lot_size_area else None,
                "property_sub_type": row.property_sub_type,
                "unparsed_address": row.unparsed_address,
                "city": row.city,
                "city_region": row.city_region or "",
                "distance_km": round(d, 3),
                "source": "active_listing",
                "event_date": (
                    row.original_entry_timestamp.date().isoformat()
                    if row.original_entry_timestamp
                    else None
                ),
                "days_on_market": dom,
            }
        )
    return out


def select_comps(
    subject: Dict[str, Any],
    radius_km: float = 2.0,
    max_age_days: int = 180,
    k: int = PRICING_K,
) -> List[Dict[str, Any]]:
    """Pricing comps: AMPRE ClosePrice first, sold_proxy, then active listings.

    ``radius_km`` / ``max_age_days`` are retained for call-site compatibility;
    WOWA progressive passes own the real thresholds.
    """
    del radius_km, max_age_days  # unused; kept for signature compatibility
    sold = _select_ampre_sold(subject, k=k)
    if len(sold) >= 3:
        return sold

    existing = {c.get("listing_key") for c in sold if c.get("listing_key")}
    for proxy in _select_sold_proxy(subject, k=k):
        key = proxy.get("listing_key")
        if key and key in existing:
            continue
        sold.append(proxy)
        if key:
            existing.add(key)
        if len(sold) >= k:
            break

    if len(sold) >= 3:
        sold.sort(key=lambda c: c.get("distance_km") or 99)
        return sold[:k]

    # Last resort: active asking prices so the wizard still returns a range.
    for active in select_active_comps(subject, k=k):
        key = active.get("listing_key")
        if key and key in existing:
            continue
        sold.append(active)
        if key:
            existing.add(key)
        if len(sold) >= max(3, k // 2):
            break

    sold.sort(key=lambda c: c.get("distance_km") or 99)
    return sold[:k]


def pricing_comps(
    comps: List[Dict[str, Any]],
    active_comps: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """Comps that should drive the hedonic point (prefer real sold)."""
    sold = [c for c in comps if c.get("source") == "sold"]
    if len(sold) >= 3:
        return sold
    priced = [c for c in comps if (c.get("price") or 0) > 0]
    if len(priced) >= 3:
        return priced
    # Fold in active listings when sold/proxy data is still too thin.
    extras = active_comps or []
    existing = {c.get("listing_key") for c in priced if c.get("listing_key")}
    for row in extras:
        key = row.get("listing_key")
        if key and key in existing:
            continue
        if (row.get("price") or 0) > 0:
            priced.append(row)
    return priced
