import hashlib
import json
import re
from datetime import timedelta
from difflib import get_close_matches

from django.db.models import Q, FloatField, Value
from django.db.models.functions import Cast, Replace, Upper
from django.utils import timezone


MAP_FILTER_KEYS = {
    "price_min",
    "price_max",
    "bedrooms",
    "bathrooms",
    "city",
    "province",
    "postal_code",
    "property_type",
    "status",
    "keywords",
    "search",
    "has_lease",
    "has_photos",
    "status_group",
    "modified_within_days",
    "parking_min",
    "community_slug",
}

SEARCH_TEXT_FIELDS = [
    "unparsed_address",
    "public_remarks",
    "city",
    "postal_code",
    "listing_id",
    "listing_key",
    "street_name",
    "street_number",
    "unit_number",
    "subdivision_name",
    "directions",
    "property_sub_type",
    "common_interest",
    "list_aor",
    "zoning",
    "zoning_description",
    "parcel_number",
    "anchors_co_tenants",
    "water_body_name",
]


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _normalize_postal(value: str) -> str:
    return re.sub(r"\s+", "", (value or "").strip().upper())


def _split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_status_group_q(raw_value: str | None):
    groups = {item.strip().lower() for item in _split_csv(raw_value or "")}
    if not groups:
        return None

    group_to_statuses = {
        "active": {"active", "a"},
        "sold": {"sold", "closed", "leased"},
        "de-listed": {
            "delisted",
            "de-listed",
            "expired",
            "terminated",
            "suspended",
            "cancelled",
            "canceled",
            "withdrawn",
        },
    }
    q = Q()
    for group in groups:
        statuses = group_to_statuses.get(group)
        if not statuses:
            continue
        for status_value in statuses:
            q |= Q(standard_status__iexact=status_value)
    return q


def _build_search_q(search_term: str) -> Q:
    search_q = Q()
    for field in SEARCH_TEXT_FIELDS:
        search_q |= Q(**{f"{field}__icontains": search_term})
    compact = _normalize_postal(search_term)
    if len(compact) >= 3:
        search_q |= Q(postal_code__iexact=compact)
        search_q |= Q(postal_code__iexact=f"{compact[:3]} {compact[3:]}")
    return search_q


def _candidate_cities(base_qs, hint: str, limit: int = 8) -> list[str]:
    normalized_hint = _normalize_text(hint)
    if not normalized_hint:
        return []
    all_cities = [
        row["city"]
        for row in base_qs.exclude(city__isnull=True)
        .exclude(city__exact="")
        .values("city")
        .distinct()[:600]
        if row.get("city")
    ]
    if not all_cities:
        return []
    norm_to_city: dict[str, str] = {}
    for city in all_cities:
        key = _normalize_text(city)
        if key and key not in norm_to_city:
            norm_to_city[key] = city
    fuzzy_hits = get_close_matches(normalized_hint, list(norm_to_city.keys()), n=limit, cutoff=0.5)
    contains_hits = [
        key
        for key in norm_to_city.keys()
        if normalized_hint in key or key in normalized_hint
    ][:limit]
    ordered_keys: list[str] = []
    for key in contains_hits + fuzzy_hits:
        if key not in ordered_keys:
            ordered_keys.append(key)
    return [norm_to_city[key] for key in ordered_keys][:limit]


def _apply_location_filters(qs, params, *, relaxed_city: bool = False, city_candidates: list[str] | None = None):
    if params.get("city"):
        cities = _split_csv(params.get("city", ""))
        if cities:
            city_q = Q()
            for city in cities:
                if relaxed_city:
                    city_q |= Q(city__icontains=city)
                else:
                    city_q |= Q(city__iexact=city)
            qs = qs.filter(city_q)
    if city_candidates:
        qs = qs.filter(city__in=city_candidates)
    if params.get("province"):
        provinces = [p.upper() for p in _split_csv(params.get("province", ""))]
        if provinces:
            qs = qs.filter(state_or_province__in=provinces)
    if params.get("postal_code"):
        codes = [_normalize_postal(c) for c in _split_csv(params.get("postal_code", ""))]
        if codes:
            qs = qs.annotate(
                postal_compact=Upper(Replace("postal_code", Value(" "), Value("")))
            ).filter(postal_compact__in=codes)
    return qs


def _apply_common_filters(
    qs,
    params,
    *,
    include_search: bool = True,
    include_location: bool = True,
    relaxed_city: bool = False,
    city_candidates: list[str] | None = None,
):
    if include_search and params.get("search"):
        search_term = params.get("search", "").strip()
        if search_term:
            qs = qs.filter(_build_search_q(search_term))
    if params.get("price_min"):
        qs = qs.filter(list_price__gte=float(params.get("price_min")))
    if params.get("price_max"):
        qs = qs.filter(list_price__lte=float(params.get("price_max")))
    if params.get("bedrooms"):
        qs = qs.filter(bedrooms_total__gte=int(params.get("bedrooms")))
    if params.get("bathrooms"):
        qs = qs.filter(bathrooms_total_integer__gte=int(params.get("bathrooms")))
    if params.get("property_type"):
        types = _split_csv(params.get("property_type", ""))
        if types:
            qs = qs.filter(property_sub_type__in=types)
    if include_location:
        qs = _apply_location_filters(
            qs,
            params,
            relaxed_city=relaxed_city,
            city_candidates=city_candidates,
        )
    if all(k in params for k in ["latitude_min", "latitude_max", "longitude_min", "longitude_max"]):
        qs = qs.annotate(
            lat_float=Cast("latitude", FloatField()),
            lng_float=Cast("longitude", FloatField()),
        ).filter(
            lat_float__gte=float(params.get("latitude_min")),
            lat_float__lte=float(params.get("latitude_max")),
            lng_float__gte=float(params.get("longitude_min")),
            lng_float__lte=float(params.get("longitude_max")),
        )
    if params.get("building_area_min"):
        qs = qs.filter(building_area_total__gte=float(params.get("building_area_min")))
    if params.get("lot_size_min"):
        qs = qs.filter(lot_size_area__gte=float(params.get("lot_size_min")))
    if params.get("year_built_min"):
        qs = qs.filter(year_built__gte=int(params.get("year_built_min")))
    if params.get("keywords"):
        kw_q = Q()
        for kw in _split_csv(params.get("keywords", "")):
            kw_q |= Q(public_remarks__icontains=kw)
        qs = qs.filter(kw_q)
    if params.get("has_photos") in ("true", "1", "True"):
        qs = qs.filter(photos_count__gt=0)
    if params.get("new_listings_days"):
        days = int(params.get("new_listings_days"))
        cutoff = timezone.now() - timedelta(days=days)
        qs = qs.filter(modification_timestamp__gte=cutoff)
    if params.get("standard_status"):
        qs = qs.filter(standard_status=params.get("standard_status"))
    status_group_q = _build_status_group_q(params.get("status_group"))
    if status_group_q is not None:
        qs = qs.filter(status_group_q)
    if params.get("modified_within_days"):
        days = int(params.get("modified_within_days"))
        qs = qs.filter(modification_timestamp__gte=timezone.now() - timedelta(days=days))
    if params.get("parking_min"):
        qs = qs.filter(parking_total__gte=int(params.get("parking_min")))
    if params.get("community_slug"):
        qs = qs.filter(
            community_listings__community_slug__in=_split_csv(params.get("community_slug", ""))
        )
    return qs


def _apply_fallback_pipeline(base_qs, params, order_by: tuple[str, ...]):
    strict = _apply_common_filters(
        base_qs, params, include_search=True, include_location=True, relaxed_city=False
    )
    strict = strict.order_by(*order_by)
    if strict.exists():
        return strict, {
            "fallback_applied": False,
            "fallback_stage": None,
            "suggested_locations": [],
        }

    relaxed = _apply_common_filters(
        base_qs, params, include_search=True, include_location=True, relaxed_city=True
    )
    relaxed = relaxed.order_by(*order_by)
    if relaxed.exists():
        return relaxed, {
            "fallback_applied": True,
            "fallback_stage": "relaxed_location",
            "suggested_locations": [],
        }

    location_hint = params.get("search") or params.get("city") or params.get("postal_code") or ""
    suggestions = _candidate_cities(base_qs, location_hint)
    if suggestions:
        nearby = _apply_common_filters(
            base_qs,
            params,
            include_search=False,
            include_location=False,
            city_candidates=suggestions,
        ).order_by(*order_by)
        if nearby.exists():
            return nearby, {
                "fallback_applied": True,
                "fallback_stage": "nearby_suggestions",
                "suggested_locations": suggestions,
            }

    safety = base_qs.order_by(*order_by)
    return safety, {
        "fallback_applied": True,
        "fallback_stage": "safety_net",
        "suggested_locations": suggestions,
    }


def _parse_bbox(params):
    lat_min = params.get("latitude_min", params.get("lat_min"))
    lat_max = params.get("latitude_max", params.get("lat_max"))
    lng_min = params.get("longitude_min", params.get("lng_min"))
    lng_max = params.get("longitude_max", params.get("lng_max"))

    if None in (lat_min, lat_max, lng_min, lng_max):
        raise ValueError(
            "Bounding box params are required: latitude_min, latitude_max, longitude_min, longitude_max"
        )

    return {
        "latitude_min": float(lat_min),
        "latitude_max": float(lat_max),
        "longitude_min": float(lng_min),
        "longitude_max": float(lng_max),
    }


def _has_map_filters(params):
    return any(
        params.get(k) not in (None, "", "null", "undefined")
        for k in MAP_FILTER_KEYS
    )


def _build_map_aggregate_cache_key(params) -> str:
    key_payload = {
        "lat_min": params.get("latitude_min", params.get("lat_min")),
        "lat_max": params.get("latitude_max", params.get("lat_max")),
        "lng_min": params.get("longitude_min", params.get("lng_min")),
        "lng_max": params.get("longitude_max", params.get("lng_max")),
        "zoom": params.get("zoom", ""),
        "filters": {
            key: params.get(key)
            for key in sorted(MAP_FILTER_KEYS)
            if params.get(key) not in (None, "", "null", "undefined")
        },
    }
    digest = hashlib.md5(
        json.dumps(key_payload, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()
    return f"map-aggregates:{digest}"


def _build_property_filter_cache_key(request) -> str:
    """Stable cache key for GET /properties/filter/ (map + search share this view)."""
    items: list[tuple[str, str]] = []
    for key in sorted(request.GET.keys()):
        for value in request.GET.getlist(key):
            items.append((key, value))
    digest = hashlib.md5(
        json.dumps(items, default=str).encode("utf-8")
    ).hexdigest()
    return f"property-filter:{digest}"


def _build_query_params_cache_key(prefix: str, params) -> str:
    items: list[tuple[str, str]] = []
    for key in sorted(params.keys()):
        for value in params.getlist(key):
            items.append((key, value))
    digest = hashlib.md5(
        json.dumps(items, default=str).encode("utf-8")
    ).hexdigest()
    return f"{prefix}:{digest}"


def _apply_map_filters_to_queryset(qs, params):
    if params.get("price_min"):
        qs = qs.filter(list_price__gte=float(params.get("price_min")))
    if params.get("price_max"):
        qs = qs.filter(list_price__lte=float(params.get("price_max")))
    if params.get("bedrooms"):
        qs = qs.filter(bedrooms_total__gte=int(params.get("bedrooms")))
    if params.get("bathrooms"):
        qs = qs.filter(bathrooms_total_integer__gte=int(params.get("bathrooms")))
    if params.get("city"):
        cities = [c.strip() for c in params.get("city", "").split(",") if c.strip()]
        if cities:
            qs = qs.filter(city__in=cities)
    if params.get("province"):
        provinces = [
            p.strip().upper()
            for p in params.get("province", "").split(",")
            if p.strip()
        ]
        if provinces:
            qs = qs.filter(state_or_province__in=provinces)
    if params.get("postal_code"):
        codes = [
            c.strip().upper()
            for c in params.get("postal_code", "").split(",")
            if c.strip()
        ]
        if codes:
            qs = qs.filter(postal_code__in=codes)
    if params.get("property_type"):
        types = [
            t.strip() for t in params.get("property_type", "").split(",") if t.strip()
        ]
        if types:
            qs = qs.filter(property_sub_type__in=types)
    if params.get("status"):
        qs = qs.filter(standard_status=params.get("status").strip())
    status_group_q = _build_status_group_q(params.get("status_group"))
    if status_group_q is not None:
        qs = qs.filter(status_group_q)
    if params.get("has_lease") in ("true", "1", "True"):
        qs = qs.filter(lease_amount__gt=0)
    if params.get("has_photos") in ("true", "1", "True"):
        qs = qs.filter(photos_count__gt=0)
    if params.get("keywords"):
        keywords = [
            kw.strip() for kw in params.get("keywords", "").split(",") if kw.strip()
        ]
        if keywords:
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)
    if params.get("search"):
        search_term = params.get("search", "").strip()
        if search_term:
            search_q = Q()
            for field in SEARCH_TEXT_FIELDS:
                search_q |= Q(**{f"{field}__icontains": search_term})
            if len(search_term) >= 3:
                search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))
            search_q |= Q(public_remarks__icontains=search_term)
            qs = qs.filter(search_q)
    if params.get("modified_within_days"):
        days = int(params.get("modified_within_days"))
        qs = qs.filter(modification_timestamp__gte=timezone.now() - timedelta(days=days))
    if params.get("parking_min"):
        qs = qs.filter(parking_total__gte=int(params.get("parking_min")))
    if params.get("community_slug"):
        slugs = _split_csv(params.get("community_slug", ""))
        if slugs:
            qs = qs.filter(community_listings__community_slug__in=slugs)
    return qs
