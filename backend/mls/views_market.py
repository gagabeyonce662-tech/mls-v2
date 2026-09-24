"""API endpoints added for the mls-v3 frontend gap list (G2, G3, G4, G13).

* GET /api/properties/facets/      - faceted counts for the current filter set
* GET /api/market/sold-trends/     - monthly sold aggregates via AMPRE OData
* GET /api/catalog-stats/bulk/     - per-city active-catalog aggregates
* GET /api/stats/platform/         - platform-wide social-proof figures
"""
from __future__ import annotations

import hashlib
import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Iterable

from django.core.cache import cache
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Property, PropertyInquiry
from .services.ampre_client import AmpreClientError, fetch_property_page
from .services.query_helpers import (
    STATUS_GROUPS,
    _apply_location_filters,
    cities_match_q,
    city_match_q,
    price_field_for,
    _apply_open_house_filters,
)


logger = logging.getLogger(__name__)


PRICE_BUCKETS: list[tuple[int, int | None]] = [
    (0, 500_000),
    (500_000, 750_000),
    (750_000, 1_000_000),
    (1_000_000, 1_500_000),
    (1_500_000, 2_000_000),
    (2_000_000, 3_000_000),
    (3_000_000, None),
]


def _apply_facet_filters(qs, params) -> Any:
    """Reuse the filter surface of PropertyFilterView so facets match results.

    Only the filters that are meaningful at aggregate time are applied here.
    Text ``search``/``polygon`` are intentionally left out - they are handled
    downstream in PropertyFilterView and would make facet counts diverge from
    the paginated result.
    """
    if params.get("status"):
        qs = qs.filter(standard_status=params.get("status", "").strip())
    if params.get("city"):
        cities = [c.strip() for c in params.get("city", "").split(",") if c.strip()]
        if cities:
            qs = qs.filter(cities_match_q(cities))
    if params.get("has_lease") in ("true", "1", "True"):
        qs = qs.filter(Q(lease_amount__gt=0) | Q(total_actual_rent__gt=0))
    # Buy / Rent split - the same rules as PropertyFilterView, so each status
    # tab's count matches the listings it links to.
    transaction_type = params.get("transaction_type")
    if transaction_type == "rent":
        qs = qs.filter(Q(lease_amount__gt=0) | Q(total_actual_rent__gt=0))
    elif transaction_type == "sale":
        qs = qs.filter(lease_amount__isnull=True, total_actual_rent__isnull=True)
    qs, price_field = price_field_for(qs, params)
    try:
        if params.get("price_min"):
            qs = qs.filter(**{f"{price_field}__gte": int(params.get("price_min"))})
        if params.get("price_max"):
            qs = qs.filter(**{f"{price_field}__lte": int(params.get("price_max"))})
        if params.get("beds_min"):
            qs = qs.filter(bedrooms_total__gte=int(params.get("beds_min")))
        if params.get("baths_min"):
            qs = qs.filter(bathrooms_total_integer__gte=int(params.get("baths_min")))
        if params.get("sqft_min"):
            qs = qs.filter(building_area_total__gte=int(params.get("sqft_min")))
        if params.get("sqft_max"):
            qs = qs.filter(building_area_total__lte=int(params.get("sqft_max")))
        if params.get("year_built_min"):
            qs = qs.filter(year_built__gte=int(params.get("year_built_min")))
    except (TypeError, ValueError):
        return None
    sub_types: list[str] = []
    for raw in params.getlist("property_sub_type") if hasattr(params, "getlist") else [params.get("property_sub_type", "")]:
        for value in str(raw or "").split(","):
            cleaned = value.strip()
            if cleaned and cleaned not in sub_types:
                sub_types.append(cleaned)
    if sub_types:
        qs = qs.filter(property_sub_type__in=sub_types)
    # postal_code (CSV of FSAs / full codes) uses the same helper as the filter
    # view, so a postal-scoped listings page gets postal-scoped tab counts.
    if params.get("postal_code"):
        qs = _apply_location_filters(qs, {"postal_code": params.get("postal_code")})
    return qs


class PropertyFacetsAPIView(APIView):
    """GET /api/properties/facets/ - counts per status, sub-type, price bucket."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Faceted counts for the current property filter set",
        description=(
            "Accepts the same filters as GET /api/properties/filter/ and returns "
            "counts per standard_status, per property_sub_type, and per price bucket. "
            "Powers the status tabs and refinement chips on the listings page."
        ),
        parameters=[
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("has_lease", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("transaction_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="'sale' or 'rent'; 'rent' also moves price filters to lease_amount."),
            OpenApiParameter("price_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("price_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("beds_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("baths_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("property_sub_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sqft_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sqft_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("year_built_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("postal_code", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="CSV of FSAs (L7A) and/or full codes (L7A3K9)."),
        ],
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="PropertyFacetsResponse",
                    fields={
                        "status": serializers.DictField(child=serializers.IntegerField()),
                        "status_group": serializers.DictField(
                            child=serializers.IntegerField(),
                            help_text="Counts for 'active', 'sold' and 'de-listed'; always all three keys.",
                        ),
                        "property_sub_type": serializers.DictField(child=serializers.IntegerField()),
                        "price_buckets": serializers.ListField(child=serializers.DictField()),
                        "open_house": serializers.IntegerField(),
                    },
                )
            ),
            400: OpenApiResponse(description="Invalid filter parameter."),
        },
        auth=[],
    )
    def get(self, request):
        qs = Property.objects.all()
        qs = _apply_facet_filters(qs, request.GET)
        if qs is None:
            return Response(
                {"error": "One of the numeric filters is not an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_counts = {
            (row["standard_status"] or "Unknown"): row["count"]
            for row in qs.values("standard_status").annotate(count=Count("id")).order_by()
        }
        # Fixed status tabs (For Sale / Sold / De-listed): every group is always
        # present, zero included, and rows whose status belongs to no group
        # (test data, "Unknown") are counted nowhere.
        status_group_counts = {group: 0 for group in STATUS_GROUPS}
        for raw_status, count in status_counts.items():
            normalized = raw_status.strip().lower()
            for group, statuses in STATUS_GROUPS.items():
                if normalized in statuses:
                    status_group_counts[group] += count
                    break
        sub_type_counts = {
            (row["property_sub_type"] or "Unknown"): row["count"]
            for row in qs.exclude(property_sub_type__isnull=True)
            .exclude(property_sub_type__exact="")
            .values("property_sub_type")
            .annotate(count=Count("id"))
            .order_by("-count")[:40]
        }

        price_buckets: list[dict[str, Any]] = []
        for lo, hi in PRICE_BUCKETS:
            bucket_qs = qs.filter(list_price__gte=lo)
            if hi is not None:
                bucket_qs = bucket_qs.filter(list_price__lt=hi)
            price_buckets.append(
                {
                    "min": lo,
                    "max": hi,
                    "count": bucket_qs.count(),
                }
            )

        # Listings with an upcoming open house (today onwards) under the same
        # filters — powers the "Open house" status tab. Reuses the exact helper
        # PropertyFilterView applies for has_open_house=1, so the tab count and
        # the result it links to cannot disagree. distinct() is applied inside
        # the helper because the open_houses join duplicates rows.
        open_house_count = _apply_open_house_filters(qs, {"has_open_house": "1"}).count()

        return Response(
            {
                "status": status_counts,
                "status_group": status_group_counts,
                "property_sub_type": sub_type_counts,
                "price_buckets": price_buckets,
                "open_house": open_house_count,
            }
        )


def _parse_window_months(value: str | None, default: int = 12) -> int:
    if not value:
        return default
    try:
        cleaned = int(str(value).strip().lower().replace("m", ""))
    except ValueError:
        return default
    return max(1, min(cleaned, 36))


def _median(values: list[float]) -> float | None:
    if not values:
        return None
    return float(statistics.median(values))


# A close price below a third or above triple the list price is a data error
# (usually a $1 placeholder list price), not a real sale-to-list outcome.
RATIO_SANITY_MIN = 0.3
RATIO_SANITY_MAX = 3.0


def _month_key(dt: datetime) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


def _parse_ampre_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return None


GTA_CITIES: list[str] = [
    "Toronto",
    "Mississauga",
    "Brampton",
    "Vaughan",
    "Markham",
    "Richmond Hill",
    "Oakville",
    "Burlington",
    "Ajax",
    "Pickering",
    "Whitby",
    "Oshawa",
    "Milton",
]


def _sold_bucket() -> dict[str, list[float]]:
    return {"prices": [], "dom": [], "ratios": [], "count": []}


def _summarise_sold_bucket(b: dict[str, list[float]]) -> dict[str, Any]:
    over_asking = 0
    if b["ratios"]:
        over_asking = sum(1 for r in b["ratios"] if r > 1.0)
    return {
        "median_sold_price": _median(b["prices"]),
        "avg_sold_price": round(sum(b["prices"]) / len(b["prices"]), 2) if b["prices"] else None,
        "avg_days_on_market": (
            round(sum(b["dom"]) / len(b["dom"]), 1) if b["dom"] else None
        ),
        "sale_to_list_ratio": (
            round(sum(b["ratios"]) / len(b["ratios"]), 4) if b["ratios"] else None
        ),
        "over_asking_share": (
            round(over_asking / len(b["ratios"]), 4) if b["ratios"] else None
        ),
        "units_sold": int(sum(b["count"])),
    }


def _bucket_sold_rows(
    rows: Iterable[dict[str, Any]],
    requested_cities: Iterable[str] | None = None,
) -> tuple[dict[str, dict], dict[str, list[float]]]:
    """Group sold rows by (city, month) and return (per_city_month, per_city_total).

    Rows are folded back onto the city that was asked for. AMPRE splits Toronto
    across district-coded names ("Toronto C01", "Toronto W05"), which would
    otherwise become dozens of one-district series instead of the single
    "Toronto" line the chart asks for.
    """
    # Longest first, so "Richmond Hill" wins over a hypothetical "Richmond".
    wanted = sorted(
        ((c or "").strip() for c in (requested_cities or []) if (c or "").strip()),
        key=len,
        reverse=True,
    )

    def canonical(raw_city: str) -> str:
        lowered = raw_city.lower()
        for candidate in wanted:
            if lowered.startswith(candidate.lower()):
                return candidate
        return raw_city

    per_city_month: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
        lambda: defaultdict(_sold_bucket)
    )
    per_city_total: dict[str, dict[str, list[float]]] = defaultdict(_sold_bucket)
    for row in rows:
        close_price = row.get("ClosePrice")
        close_date_raw = row.get("CloseDate")
        list_price = row.get("ListPrice") or row.get("OriginalListPrice")
        entry_ts_raw = row.get("OriginalEntryTimestamp")
        city = canonical((row.get("City") or "").strip())
        close_dt = _parse_ampre_datetime(close_date_raw)
        if not close_dt or close_price in (None, 0) or not city:
            continue
        try:
            price = float(close_price)
        except (TypeError, ValueError):
            continue
        month = _month_key(close_dt)
        for bucket in (per_city_month[city][month], per_city_total[city]):
            bucket["prices"].append(price)
            bucket["count"].append(1.0)
            entry_dt = _parse_ampre_datetime(entry_ts_raw)
            if entry_dt:
                dom = (close_dt.date() - entry_dt.date()).days
                if dom >= 0:
                    bucket["dom"].append(float(dom))
            if list_price:
                try:
                    lp = float(list_price)
                    if lp > 0:
                        ratio = price / lp
                        # Placeholder list prices ($1) produce ratios in the
                        # hundreds of thousands. Three such rows out of 24,279
                        # moved the Toronto sale-to-list average from 0.99 to
                        # 55.85, so anything outside a plausible band is junk
                        # data rather than a real sale-to-list outcome.
                        if RATIO_SANITY_MIN <= ratio <= RATIO_SANITY_MAX:
                            bucket["ratios"].append(ratio)
                except (TypeError, ValueError):
                    pass
    return per_city_month, per_city_total


def _fetch_sold_rows(cities: list[str], window_months: int) -> list[dict[str, Any]]:
    """Pull closed listings for the given cities in one AMPRE request."""
    now = timezone.now()
    window_start = (now - timedelta(days=window_months * 31)).date().isoformat()
    # Upper bound as well as lower. A handful of TRREB records carry corrupt
    # CloseDates ("5199-12-31", "3549-10-01" - the year mirrors the rent),
    # and because the query sorts by CloseDate desc those junk rows sat at the
    # top and consumed the 1000-row budget, pushing out the real recent sales:
    # the 12-month window came back starting 14 months in the future.
    window_end = (now + timedelta(days=1)).date().isoformat()
    # OData ``in`` is not supported by AMPRE; build a clause per city.
    #
    # ``startswith`` rather than ``eq``: AMPRE stores Toronto as district-coded
    # names ("Toronto C01", "Toronto C08", "Toronto W05", ...) and never as a
    # bare "Toronto", so an exact match found none of its ~29,000 closed sales
    # and the chart came back empty for the single biggest market. Ordinary
    # cities ("Mississauga") are unaffected, since they match their own prefix.
    city_clause = " or ".join(
        f"startswith(City,'{c.replace(chr(39), chr(39)*2)}')" for c in cities
    )
    # TransactionType keeps leases out of the sold figures. A closed lease has
    # a ClosePrice too, but it is a monthly rent: more than half the Toronto
    # rows came back "For Lease", which pulled the median sold price down to
    # around $2,000 and made sale-to-list ratios meaningless.
    filter_expression = (
        f"({city_clause}) "
        f"and StandardStatus eq 'Closed' "
        f"and TransactionType eq 'For Sale' "
        f"and CloseDate ge {window_start} "
        f"and CloseDate le {window_end}"
    )
    select_fields = [
        "ListingKey",
        "City",
        "StandardStatus",
        "ClosePrice",
        "ListPrice",
        "OriginalListPrice",
        "CloseDate",
        "OriginalEntryTimestamp",
    ]
    # AMPRE caps a page at 1000, so a 12-month multi-city window needs several.
    # `max_rows` is the real budget: with only 1000 the newest month alone
    # exhausted it and the chart showed a single bar.
    return fetch_property_page(
        filter_expression=filter_expression,
        select_fields=select_fields,
        orderby="CloseDate desc",
        top=1000,
        max_rows=25000,
    )


class MarketSoldTrendsAPIView(APIView):
    """GET /api/market/sold-trends/ - monthly sold aggregates.

    Data is pulled from the AMPRE (TRREB) OData feed rather than the local
    Property table because DDF does not carry close/sold prices.

    Supports a single city (?city=), a CSV of cities (?cities=), or the GTA
    scope (?scope=gta). The response returns one series per city and, when
    multiple cities are queried, an ``aggregate`` block used by the GTA-wide
    sold KPI strip.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Monthly sold trends for one or more cities",
        description=(
            "Returns median close price, avg sold price, over-asking share, "
            "avg days on market, sale-to-list ratio, and units sold per month "
            "for each city in the requested window. Backed by the AMPRE OData "
            "Property feed (Sold statuses only)."
        ),
        parameters=[
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Single city (backward-compatible)."),
            OpenApiParameter("cities", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Comma-separated list of city names (GAP-07)."),
            OpenApiParameter("scope", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Set to 'gta' for the GTA-wide summary (GAP-08)."),
            OpenApiParameter("window", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Window in months, e.g. '12m'. Capped at 36."),
        ],
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="MarketSoldTrendsResponse",
                    fields={
                        "scope": serializers.CharField(),
                        "window_months": serializers.IntegerField(),
                        "series": serializers.ListField(child=serializers.DictField()),
                        "aggregate": serializers.DictField(required=False),
                    },
                )
            ),
            400: OpenApiResponse(description="Provide city, cities, or scope=gta."),
            502: OpenApiResponse(description="AMPRE upstream returned an error."),
        },
        auth=[],
    )
    def get(self, request):
        scope = (request.query_params.get("scope") or "").strip().lower()
        raw_cities_multi = (request.query_params.get("cities") or "").strip()
        raw_city_single = (request.query_params.get("city") or "").strip()

        if scope == "gta":
            cities = list(GTA_CITIES)
        elif raw_cities_multi:
            cities = [c.strip() for c in raw_cities_multi.split(",") if c.strip()]
        elif raw_city_single:
            cities = [raw_city_single]
        else:
            return Response(
                {"error": "Provide city, cities=<csv>, or scope=gta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Cap so a malicious ?cities=a,b,c...x50 cannot blow up the OData query.
        cities = cities[:20]
        if not cities:
            return Response({"scope": scope or "cities", "series": []})

        window_months = _parse_window_months(request.query_params.get("window"), default=12)
        scope_label = scope or ("cities" if len(cities) > 1 else "city")
        cities_digest = hashlib.md5(
            "|".join(sorted(c.lower() for c in cities)).encode()
        ).hexdigest()
        cache_key = f"sold-trends:v2:{scope_label}:{cities_digest}:{window_months}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            rows = _fetch_sold_rows(cities, window_months)
        except AmpreClientError as exc:
            return Response(
                {"error": "AMPRE upstream error.", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        per_city_month, per_city_total = _bucket_sold_rows(rows, cities)
        canonical_by_norm = {c.lower(): c for c in cities}

        series: list[dict[str, Any]] = []
        for city_key in sorted(
            set(list(per_city_month.keys()) + list(canonical_by_norm.values()))
        ):
            display = canonical_by_norm.get(city_key.lower(), city_key)
            monthly = per_city_month.get(city_key, {})
            months_out = [
                {"month": m, **_summarise_sold_bucket(monthly[m])}
                for m in sorted(monthly.keys())
            ]
            series.append(
                {
                    "city": display,
                    "window_months": window_months,
                    "months": months_out,
                    "totals": _summarise_sold_bucket(
                        per_city_total.get(city_key, _sold_bucket())
                    ),
                }
            )

        payload: dict[str, Any] = {
            "scope": scope_label,
            "window_months": window_months,
            "series": series,
        }

        # GAP-08: GTA-wide (or multi-city) headline strip.
        if len(cities) > 1 or scope == "gta":
            aggregate_bucket = _sold_bucket()
            for b in per_city_total.values():
                for k in aggregate_bucket:
                    aggregate_bucket[k].extend(b[k])
            payload["aggregate"] = _summarise_sold_bucket(aggregate_bucket)

        # Preserve the legacy single-city top-level fields so existing
        # callers do not break when they used ?city= without opting in.
        if len(cities) == 1 and scope != "gta":
            single = series[0] if series else {"city": cities[0], "months": [], "totals": _summarise_sold_bucket(_sold_bucket())}
            payload["city"] = single["city"]
            payload["months"] = single["months"]

        cache.set(cache_key, payload, 60 * 30)
        return Response(payload)


class CatalogStatsBulkAPIView(APIView):
    """GET /api/catalog-stats/bulk/ - per-city active-catalog aggregates.

    Accepts a comma-separated ``cities`` list or ``scope=gta`` for the
    Greater Toronto Area headline figure. Active-catalog aggregates come
    from the local ``Property`` table; the ``sold_count_90d`` /
    ``median_sold_price_90d`` columns (GAP-06) come from AMPRE in a single
    bulk query and are attached per-city. ``include=sold`` (default true)
    can be flipped off if the caller does not need sold data.
    """

    GTA_CITIES = GTA_CITIES

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Per-city active catalog stats + 90-day sold summary",
        description=(
            "Returns active_count, median_list_price, mean_list_price, median_price_per_sqft (GAP-27), "
            "sold_count_90d, median_sold_price_90d and avg_sold_price_90d (GAP-06) per city. "
            "Use ?cities=Toronto,Vaughan,... or ?scope=gta for the GTA headline. "
            "Sold data is optional (?include_sold=false skips the AMPRE call)."
        ),
        parameters=[
            OpenApiParameter("cities", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("scope", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("include_sold", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False, description="Set to false to skip the AMPRE sold aggregate."),
        ],
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="CatalogStatsBulkResponse",
                fields={
                    "scope": serializers.CharField(),
                    "results": serializers.ListField(child=serializers.DictField()),
                    "aggregate": serializers.DictField(required=False),
                },
            )),
            400: OpenApiResponse(description="Provide either cities or scope=gta."),
        },
        auth=[],
    )
    def get(self, request):
        scope = (request.query_params.get("scope") or "").strip().lower()
        raw_cities = (request.query_params.get("cities") or "").strip()
        include_sold = (request.query_params.get("include_sold") or "true").strip().lower() != "false"

        cities: list[str]
        if scope == "gta":
            cities = list(self.GTA_CITIES)
        elif raw_cities:
            cities = [c.strip() for c in raw_cities.split(",") if c.strip()]
        else:
            return Response(
                {"error": "Provide cities=<csv> or scope=gta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cities = cities[:20]
        if not cities:
            return Response({"scope": scope or "cities", "results": []})

        # md5 keeps the key memcached-safe (no spaces) regardless of city names.
        cities_digest = hashlib.md5(
            "|".join(sorted(c.lower() for c in cities)).encode()
        ).hexdigest()
        cache_key = (
            f"catalog-stats-bulk:v4:{scope or 'cities'}:{int(include_sold)}:{cities_digest}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        results: list[dict[str, Any]] = []
        for city in cities:
            city_qs = Property.objects.filter(
                city_match_q(city),
                standard_status__iexact="Active",
                list_price__isnull=False,
            ).exclude(list_price__lte=0)
            prices: list[float] = []
            ppsf: list[float] = []
            for lp, la in city_qs.values_list("list_price", "living_area"):
                try:
                    price = float(lp)
                except (TypeError, ValueError):
                    continue
                if price <= 0:
                    continue
                prices.append(price)
                if la:
                    try:
                        area = float(la)
                        if area > 0:
                            ppsf.append(price / area)
                    except (TypeError, ValueError):
                        pass
            results.append(
                {
                    "city": city,
                    "active_count": len(prices),
                    "median_list_price": _median(prices),
                    # Communities cards label this "Avg. Price".
                    "mean_list_price": round(sum(prices) / len(prices), 2) if prices else None,
                    # GAP-27: heatmap tile shows $/sqft.
                    "median_price_per_sqft": _median(ppsf),
                    # Populated below when include_sold is true.
                    "sold_count_90d": None,
                    "median_sold_price_90d": None,
                    "avg_sold_price_90d": None,
                }
            )

        sold_error: str | None = None
        if include_sold:
            try:
                sold_rows = _fetch_sold_rows(cities, window_months=3)
            except AmpreClientError as exc:
                sold_error = str(exc)
                sold_rows = []
            # Pass the requested cities so AMPRE's district-coded Toronto rows
            # fold back onto "Toronto" and the lookup below can find them.
            _, per_city_total = _bucket_sold_rows(sold_rows, cities)
            norm_totals = {k.lower(): v for k, v in per_city_total.items()}
            for row in results:
                bucket = norm_totals.get(row["city"].lower())
                if bucket:
                    row["sold_count_90d"] = int(sum(bucket["count"]))
                    row["median_sold_price_90d"] = _median(bucket["prices"])
                    row["avg_sold_price_90d"] = (
                        round(sum(bucket["prices"]) / len(bucket["prices"]), 2)
                        if bucket["prices"]
                        else None
                    )
                else:
                    row["sold_count_90d"] = 0

        if scope == "gta" or len(cities) > 1:
            total_active = sum(row["active_count"] for row in results)
            median_of_city_medians = _median(
                [float(row["median_list_price"]) for row in results if row["median_list_price"] is not None]
            )
            total_sold_90d = sum((row.get("sold_count_90d") or 0) for row in results) if include_sold else None
            median_of_city_sold_medians = (
                _median(
                    [float(row["median_sold_price_90d"]) for row in results if row.get("median_sold_price_90d") is not None]
                ) if include_sold else None
            )
            payload = {
                "scope": scope or "cities",
                "results": results,
                "aggregate": {
                    "active_count": total_active,
                    "median_of_city_medians": median_of_city_medians,
                    "sold_count_90d": total_sold_90d,
                    "median_of_city_sold_medians_90d": median_of_city_sold_medians,
                },
            }
        else:
            payload = {"scope": "cities", "results": results}

        if sold_error:
            payload["sold_error"] = sold_error

        cache.set(cache_key, payload, 60 * 15)
        return Response(payload)


class PlatformStatsAPIView(APIView):
    """GET /api/stats/platform/ - headline social-proof figures."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Platform-wide headline figures",
        description=(
            "Returns registered_users, active_listings, and inquiries_last_30d. "
            "Powers the homepage marquee and hero social-proof panel."
        ),
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="PlatformStatsResponse",
                fields={
                    "registered_users": serializers.IntegerField(),
                    "active_listings": serializers.IntegerField(),
                    "inquiries_last_30d": serializers.IntegerField(),
                    "generated_at": serializers.DateTimeField(),
                },
            )),
        },
        auth=[],
    )
    def get(self, request):
        cache_key = "platform-stats:v1"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        registered_users = User.objects.count()
        active_listings = Property.objects.filter(standard_status__iexact="Active").count()
        since = timezone.now() - timedelta(days=30)
        inquiries_last_30d = PropertyInquiry.objects.filter(created_at__gte=since).count()

        payload = {
            "registered_users": registered_users,
            "active_listings": active_listings,
            "inquiries_last_30d": inquiries_last_30d,
            "generated_at": timezone.now().isoformat(),
        }
        cache.set(cache_key, payload, 60 * 10)
        return Response(payload)
