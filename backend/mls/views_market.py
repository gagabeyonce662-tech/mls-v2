"""API endpoints added for the mls-v3 frontend gap list (G2, G3, G4, G13).

* GET /api/properties/facets/      - faceted counts for the current filter set
* GET /api/market/sold-trends/     - monthly sold aggregates via AMPRE OData
* GET /api/catalog-stats/bulk/     - per-city active-catalog aggregates
* GET /api/stats/platform/         - platform-wide social-proof figures
"""
from __future__ import annotations

import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

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
            qs = qs.filter(city__in=cities)
    if params.get("has_lease") in ("true", "1", "True"):
        qs = qs.filter(Q(lease_amount__gt=0) | Q(total_actual_rent__gt=0))
    try:
        if params.get("price_min"):
            qs = qs.filter(list_price__gte=int(params.get("price_min")))
        if params.get("price_max"):
            qs = qs.filter(list_price__lte=int(params.get("price_max")))
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
            OpenApiParameter("price_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("price_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("beds_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("baths_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("property_sub_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sqft_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sqft_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("year_built_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
        ],
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="PropertyFacetsResponse",
                    fields={
                        "status": serializers.DictField(child=serializers.IntegerField()),
                        "property_sub_type": serializers.DictField(child=serializers.IntegerField()),
                        "price_buckets": serializers.ListField(child=serializers.DictField()),
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

        return Response(
            {
                "status": status_counts,
                "property_sub_type": sub_type_counts,
                "price_buckets": price_buckets,
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


def _month_key(dt: datetime) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


def _parse_ampre_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return None


class MarketSoldTrendsAPIView(APIView):
    """GET /api/market/sold-trends/ - monthly sold aggregates for a city.

    Data is pulled from the AMPRE (TRREB) OData feed rather than the local
    Property table because DDF does not carry close/sold prices.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Monthly sold trends for a city",
        description=(
            "Returns median close price, average days on market, sale-to-list "
            "ratio, and units sold per month for the requested window. "
            "Backed by the AMPRE OData Property feed (Sold statuses only)."
        ),
        parameters=[
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("window", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Window in months, e.g. '12m'. Capped at 36."),
        ],
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="MarketSoldTrendsResponse",
                    fields={
                        "city": serializers.CharField(),
                        "window_months": serializers.IntegerField(),
                        "months": serializers.ListField(child=serializers.DictField()),
                    },
                )
            ),
            400: OpenApiResponse(description="city query parameter is required."),
            502: OpenApiResponse(description="AMPRE upstream returned an error."),
        },
        auth=[],
    )
    def get(self, request):
        city = (request.query_params.get("city") or "").strip()
        if not city:
            return Response(
                {"error": "city query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        window_months = _parse_window_months(request.query_params.get("window"), default=12)
        cache_key = f"sold-trends:{city.lower()}:{window_months}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        now = timezone.now()
        window_start = (now - timedelta(days=window_months * 31)).date().isoformat()
        safe_city = city.replace("'", "''")
        filter_expression = (
            f"City eq '{safe_city}' "
            f"and StandardStatus eq 'Closed' "
            f"and CloseDate ge {window_start}"
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

        try:
            rows = fetch_property_page(
                filter_expression=filter_expression,
                select_fields=select_fields,
                orderby="CloseDate desc",
                top=1000,
            )
        except AmpreClientError as exc:
            return Response(
                {"error": "AMPRE upstream error.", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        buckets: dict[str, dict[str, list[float]]] = defaultdict(
            lambda: {"prices": [], "dom": [], "ratios": [], "count": []}
        )
        for row in rows:
            close_price = row.get("ClosePrice")
            close_date_raw = row.get("CloseDate")
            list_price = row.get("ListPrice") or row.get("OriginalListPrice")
            entry_ts_raw = row.get("OriginalEntryTimestamp")
            close_dt = _parse_ampre_datetime(close_date_raw)
            if not close_dt or close_price in (None, 0):
                continue
            month = _month_key(close_dt)
            bucket = buckets[month]
            try:
                bucket["prices"].append(float(close_price))
            except (TypeError, ValueError):
                continue
            entry_dt = _parse_ampre_datetime(entry_ts_raw)
            if entry_dt:
                dom = (close_dt.date() - entry_dt.date()).days
                if dom >= 0:
                    bucket["dom"].append(float(dom))
            if list_price:
                try:
                    lp = float(list_price)
                    if lp > 0:
                        bucket["ratios"].append(float(close_price) / lp)
                except (TypeError, ValueError):
                    pass
            bucket["count"].append(1.0)

        months_out: list[dict[str, Any]] = []
        for month in sorted(buckets.keys()):
            b = buckets[month]
            months_out.append(
                {
                    "month": month,
                    "median_sold_price": _median(b["prices"]),
                    "avg_days_on_market": (
                        round(sum(b["dom"]) / len(b["dom"]), 1) if b["dom"] else None
                    ),
                    "sale_to_list_ratio": (
                        round(sum(b["ratios"]) / len(b["ratios"]), 4)
                        if b["ratios"]
                        else None
                    ),
                    "units_sold": int(sum(b["count"])),
                }
            )

        payload = {
            "city": city,
            "window_months": window_months,
            "months": months_out,
        }
        cache.set(cache_key, payload, 60 * 30)
        return Response(payload)


class CatalogStatsBulkAPIView(APIView):
    """GET /api/catalog-stats/bulk/ - per-city active-catalog aggregates.

    Accepts a comma-separated ``cities`` list or ``scope=gta`` for the
    Greater Toronto Area headline figure. Runs one aggregate query per city
    over the local ``Property`` table; no upstream calls.
    """

    GTA_CITIES = [
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

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Per-city active catalog stats in one request",
        description=(
            "Returns active_count and median_list_price per city. Use "
            "?cities=Toronto,Vaughan,... or ?scope=gta for the GTA headline."
        ),
        parameters=[
            OpenApiParameter("cities", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Comma-separated list of city names."),
            OpenApiParameter("scope", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Set to 'gta' to aggregate the Greater Toronto Area."),
        ],
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="CatalogStatsBulkResponse",
                fields={
                    "results": serializers.ListField(child=serializers.DictField()),
                },
            )),
            400: OpenApiResponse(description="Provide either cities or scope=gta."),
        },
        auth=[],
    )
    def get(self, request):
        scope = (request.query_params.get("scope") or "").strip().lower()
        raw_cities = (request.query_params.get("cities") or "").strip()
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
        if not cities:
            return Response({"results": []})

        cache_key = f"catalog-stats-bulk:{scope or 'cities'}:{'|'.join(sorted(c.lower() for c in cities))}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        results: list[dict[str, Any]] = []
        for city in cities:
            city_qs = Property.objects.filter(
                standard_status__iexact="Active",
                city__iexact=city,
                list_price__isnull=False,
            ).exclude(list_price__lte=0)
            prices = [float(p) for p in city_qs.values_list("list_price", flat=True) if p]
            results.append(
                {
                    "city": city,
                    "active_count": len(prices),
                    "median_list_price": _median(prices),
                }
            )

        if scope == "gta":
            total_active = sum(row["active_count"] for row in results)
            all_prices: list[float] = []
            for row in results:
                # We need real prices back to compute the aggregate median.
                # Re-query per city would double-count; instead just aggregate
                # the recorded per-city medians as a stable, cheap proxy.
                if row["median_list_price"] is not None:
                    all_prices.append(float(row["median_list_price"]))
            payload = {
                "scope": "gta",
                "results": results,
                "aggregate": {
                    "active_count": total_active,
                    "median_of_city_medians": _median(all_prices),
                },
            }
        else:
            payload = {"scope": "cities", "results": results}

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
