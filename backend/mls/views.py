import requests
import hashlib
import os
import json
import logging
import time
from io import BytesIO
import pandas as pd
from datetime import timedelta
import h3

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, FloatField, Count
from django.db.models.functions import Cast, Substr, Lower
from django.core.paginator import Paginator
from django.core.cache import cache
from django.utils import timezone

# Local imports
from .models import AccessToken
from .helpers import get_access_token, fetch_properties_by_property_data
from mls.models import MapAggregateCell, Property, UserFavorite, UserHistory
from .serializers import (
    PropertySerializer,
    PropertyDetailSerializer,
    UserFeedbackSerializer,
    WatchedMutationSerializer,
    UserFavoriteSerializer,
    UserHistorySerializer,
)
from mls.services.map_aggregates import get_resolution_for_zoom
from mls.services.ai_listing_summary import (
    AISummaryGenerationError,
    generate_listing_summary,
    is_summary_complete,
)

logger = logging.getLogger(__name__)
# Shared TTL for map bbox responses (aggregates + property filter). Override via env; default 15m fits ~24h listing refresh cadence.
MAP_VIEW_CACHE_TTL_SECONDS = int(
    os.environ.get("MAP_VIEW_CACHE_TTL_SECONDS", "900")
)
LISTING_CACHE_TTL_SECONDS = int(
    os.environ.get("LISTING_CACHE_TTL_SECONDS", "86400")
)
NEAREST_SCHOOL_CACHE_TTL_SECONDS = int(
    os.environ.get("NEAREST_SCHOOL_CACHE_TTL_SECONDS", "86400")
)
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
            text_fields = [
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
            for field in text_fields:
                search_q |= Q(**{f"{field}__icontains": search_term})
            if len(search_term) >= 3:
                search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))
            search_q |= Q(public_remarks__icontains=search_term)
            qs = qs.filter(search_q)
    return qs

class FetchProperties(APIView):
    """
    API view to fetch properties from the REALTOR.ca API
    """

    def get(self, request):
        access_token = get_access_token()

        if not access_token:
            return Response({'error': 'Failed to authenticate'}, status=status.HTTP_401_UNAUTHORIZED)
        url = 'https://ddfapi.realtor.ca/odata/v1/Property'
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {
            '$top': 100,  
            '$orderby': 'ListPrice desc'
        }
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                properties = response.json().get('value', [])
                print("Total Properties:", len(properties)) 
                return Response(properties, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Failed to fetch data' , "res":response.json()}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FeedbackAPIView(APIView):
    """
    POST /api/mls/feedback/
    Create user feedback submissions.
    """

    def post(self, request):
        serializer = UserFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        feedback = serializer.save()
        return Response(
            {
                "id": feedback.id,
                "message": "Feedback submitted successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class WatchedOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = UserFavorite.objects.filter(user=request.user).order_by("-created_at")
        history = UserHistory.objects.filter(user=request.user).order_by("-viewed_at")
        return Response(
            {
                "favorites": UserFavoriteSerializer(favorites, many=True).data,
                "history": UserHistorySerializer(history, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class WatchedFavoriteToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WatchedMutationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_key = serializer.validated_data["property_key"]
        snapshot = serializer.validated_data.get("property_snapshot_json", {}) or {}

        favorite, created = UserFavorite.objects.get_or_create(
            user=request.user,
            property_key=property_key,
            defaults={"property_snapshot_json": snapshot},
        )

        if created:
            return Response({"is_favorite": True}, status=status.HTTP_200_OK)

        favorite.delete()
        return Response({"is_favorite": False}, status=status.HTTP_200_OK)


class WatchedHistoryAddAPIView(APIView):
    permission_classes = [IsAuthenticated]
    HISTORY_CAP = 50

    def post(self, request):
        serializer = WatchedMutationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_key = serializer.validated_data["property_key"]
        snapshot = serializer.validated_data.get("property_snapshot_json", {}) or {}

        UserHistory.objects.update_or_create(
            user=request.user,
            property_key=property_key,
            defaults={
                "property_snapshot_json": snapshot,
                "viewed_at": timezone.now(),
            },
        )

        stale_ids = list(
            UserHistory.objects.filter(user=request.user)
            .order_by("-viewed_at")
            .values_list("id", flat=True)[self.HISTORY_CAP :]
        )
        if stale_ids:
            UserHistory.objects.filter(id__in=stale_ids).delete()

        return Response({"added": True}, status=status.HTTP_200_OK)


class WatchedClearFavoritesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = UserFavorite.objects.filter(user=request.user).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class WatchedClearHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = UserHistory.objects.filter(user=request.user).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class DDFAPIClient:
    def make_api_call(self, endpoint, params=None):
        """
        Makes an API call to the DDF® Web API
        """
        DDF_API_URL = 'https://ddfapi.realtor.ca/odata/v1'
        access_token = get_access_token()
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(f'{DDF_API_URL}/{endpoint}', headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error {response.status_code}: {response.text}")


class PropertyFilterView(APIView):
    """
    GET /api/properties/
    
    Full-featured property search using your local Property model (PostgreSQL)
    No DDF API calls → No 400/500 errors → Super fast
    """

    def get(self, request):
        filter_cache_key = _build_property_filter_cache_key(request)
        cached_payload = cache.get(filter_cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.GET.get('limit', 6)), 100)
        offset = int(request.GET.get('offset', 0))

        # Start with all properties
        qs = Property.objects.all()

        # === PRICE ===
        if request.GET.get('price_min'):
            qs = qs.filter(list_price__gte=float(request.GET['price_min']))
        if request.GET.get('price_max'):
            qs = qs.filter(list_price__lte=float(request.GET['price_max']))

        # === BEDS / BATHS ===
        if request.GET.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(request.GET['bedrooms']))
        if request.GET.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(request.GET['bathrooms']))

        # === CITY / PROVINCE / POSTAL CODE (multiple) ===
        if request.GET.get('city'):
            cities = [c.strip() for c in request.GET['city'].split(',') if c.strip()]
            qs = qs.filter(city__in=cities)

        if request.GET.get('province'):
            provs = [p.strip().upper() for p in request.GET['province'].split(',') if p.strip()]
            qs = qs.filter(state_or_province__in=provs)

        if request.GET.get('postal_code'):
            codes = [c.strip().upper() for c in request.GET['postal_code'].split(',') if c.strip()]
            qs = qs.filter(postal_code__in=codes)

        # === PROPERTY TYPE ===
        if request.GET.get('property_type'):
            types = [t.strip() for t in request.GET['property_type'].split(',') if t.strip()]
            qs = qs.filter(property_sub_type__in=types)

        # === STATUS ===
        if request.GET.get('status'):
            qs = qs.filter(standard_status=request.GET['status'].strip())

        # === LEASE AMOUNT (commercial) ===
        if request.GET.get('has_lease') in ('true', '1'):
            qs = qs.filter(lease_amount__gt=0)

        # === MAP BOUNDING BOX ===
        if all(k in request.GET for k in ['lat_min', 'lat_max', 'lng_min', 'lng_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(request.GET['lat_min']),
                lat_float__lte=float(request.GET['lat_max']),
                lng_float__gte=float(request.GET['lng_min']),
                lng_float__lte=float(request.GET['lng_max']),
            )

        # === SOLD IN LAST N DAYS ===
        if request.GET.get('sold_days'):
            days = int(request.GET['sold_days'])
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(status_change_timestamp__gte=cutoff)

        # === MODIFIED SINCE ===
        if request.GET.get('modified_since'):
            qs = qs.filter(modification_timestamp__gte=request.GET['modified_since'])

        # === HAS PHOTOS ===
        if request.GET.get('has_photos') in ('true', '1'):
            qs = qs.filter(photos_count__gt=0)

        # === UNIVERSAL SEARCH (address, remarks, listing ID, etc.) ===
        if request.GET.get('search'):
            search_term = request.GET['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                qs = qs.filter(search_q)
        if request.GET.get('keywords'):
            keywords = [k.strip().lower() for k in request.GET['keywords'].split(',') if k.strip()]
            if keywords:
                kw_q = Q()
                for kw in keywords:
                    kw_q |= Q(public_remarks__icontains=kw)
                qs = qs.filter(kw_q)

        # === ORDERING ===
        order_by = request.GET.get('orderby', '-modification_timestamp')
        qs = qs.order_by(order_by)

        # === PAGINATION ===
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
        }
        cache.set(filter_cache_key, payload, MAP_VIEW_CACHE_TTL_SECONDS)
        return Response(payload)


class PropertyTypesAPIView(APIView):
    """
    GET /api/mls/properties/property-types/
    Returns available property_sub_type values with counts.
    Optional query params:
      - province (comma-separated province codes, e.g. ON,QC)
      - listing_type: all | exclusive | lease | precon
    """

    def get(self, request):
        params = request.query_params
        cache_key = _build_query_params_cache_key("property-types", params)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        listing_type = str(params.get("listing_type", "all")).strip().lower()

        qs = Property.objects.all()

        if params.get("province"):
            provinces = [
                p.strip().upper()
                for p in params.get("province", "").split(",")
                if p.strip()
            ]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if listing_type == "lease":
            qs = qs.filter(lease_amount__gt=0).exclude(lease_amount__isnull=True)
        elif listing_type == "precon":
            qs = qs.filter(category_type=Property.PRE_CONN)
        elif listing_type == "exclusive":
            qs = qs.annotate(intro=Lower(Substr("public_remarks", 1, 400))).filter(
                Q(intro__contains="exclusive") | Q(category_type=Property.EXCLUSIVE)
            )

        type_rows = (
            qs.exclude(property_sub_type__isnull=True)
            .exclude(property_sub_type__exact="")
            .values("property_sub_type")
            .annotate(count=Count("id"))
            .order_by("-count", "property_sub_type")
        )

        results = [
            {
                "value": row["property_sub_type"],
                "label": row["property_sub_type"],
                "count": row["count"],
            }
            for row in type_rows
        ]

        payload = {"results": results}
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload, status=status.HTTP_200_OK)


class MapAggregatesAPIView(APIView):
    """
    GET /api/mls/properties/map-aggregates/
    Returns H3 aggregate cells for low/mid zoom map views.
    """

    def get(self, request):
        started_at = time.perf_counter()
        try:
            bbox = _parse_bbox(request.query_params)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if bbox["latitude_min"] >= bbox["latitude_max"] or bbox["longitude_min"] >= bbox["longitude_max"]:
            return Response(
                {"error": "Invalid bounding box ranges"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            zoom = int(request.query_params.get("zoom", "10"))
        except ValueError:
            return Response(
                {"error": "zoom must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = _build_map_aggregate_cache_key(request.query_params)
        cached_payload = cache.get(cache_key)
        if cached_payload:
            cached_payload["meta"] = {
                **cached_payload.get("meta", {}),
                "cached": True,
            }
            return Response(cached_payload)

        resolution = get_resolution_for_zoom(zoom)
        if resolution is None:
            return Response(
                {
                    "mode": "listings",
                    "resolution": None,
                    "results": [],
                    "message": "Zoom level should use listing markers endpoint.",
                    "meta": {
                        "cached": False,
                        "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
                    },
                },
                status=status.HTTP_200_OK,
            )

        has_map_filters = _has_map_filters(request.query_params)
        if has_map_filters:
            filtered_qs = Property.objects.filter(
                latitude__isnull=False,
                longitude__isnull=False,
            ).exclude(standard_status__iexact="Sold")
            filtered_qs = _apply_map_filters_to_queryset(filtered_qs, request.query_params)
            filtered_qs = filtered_qs.annotate(
                lat_float=Cast("latitude", FloatField()),
                lng_float=Cast("longitude", FloatField()),
            ).filter(
                lat_float__gte=bbox["latitude_min"],
                lat_float__lte=bbox["latitude_max"],
                lng_float__gte=bbox["longitude_min"],
                lng_float__lte=bbox["longitude_max"],
            )
            cell_buckets: dict[str, dict] = {}

            def _bucket() -> dict:
                return {"count": 0, "sum_lat": 0.0, "sum_lng": 0.0}

            for lat, lng in filtered_qs.values_list("lat_float", "lng_float").iterator(
                chunk_size=5000
            ):
                if lat is None or lng is None:
                    continue
                flat, flng = float(lat), float(lng)
                index = h3.latlng_to_cell(flat, flng, resolution)
                bucket = cell_buckets.setdefault(index, _bucket())
                bucket["count"] += 1
                bucket["sum_lat"] += flat
                bucket["sum_lng"] += flng

            results = []
            for h3_index, bucket in sorted(
                cell_buckets.items(),
                key=lambda item: item[1]["count"],
                reverse=True,
            ):
                property_count = bucket["count"]
                center_lat = bucket["sum_lat"] / property_count
                center_lng = bucket["sum_lng"] / property_count
                results.append(
                    {
                        "h3_index": h3_index,
                        "resolution": resolution,
                        "center_lat": float(center_lat),
                        "center_lng": float(center_lng),
                        "property_count": property_count,
                        "updated_at": timezone.now(),
                    }
                )
        else:
            cells = (
                MapAggregateCell.objects.filter(
                    resolution=resolution,
                    center_lat__gte=bbox["latitude_min"],
                    center_lat__lte=bbox["latitude_max"],
                    center_lng__gte=bbox["longitude_min"],
                    center_lng__lte=bbox["longitude_max"],
                )
                .order_by("-property_count")
            )

            results = [
                {
                    "h3_index": cell.h3_index,
                    "resolution": cell.resolution,
                    "center_lat": float(cell.center_lat),
                    "center_lng": float(cell.center_lng),
                    "property_count": cell.property_count,
                    "updated_at": cell.updated_at,
                }
                for cell in cells
            ]

        payload = {
            "mode": "aggregates",
            "resolution": resolution,
            "count": len(results),
            "results": results,
            "meta": {
                "cached": False,
                "filters_applied": has_map_filters,
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
            },
        }
        cache.set(cache_key, payload, MAP_VIEW_CACHE_TTL_SECONDS)
        return Response(payload)


class ListingAISummaryAPIView(APIView):
    """
    POST /api/mls/properties/ai-summary/
    Generates or returns cached AI markdown summary and persists in Property table.
    """

    def post(self, request):
        listing_key = str(request.data.get("listing_key", "")).strip()
        property_payload = request.data.get("property", {}) or {}
        logger.info("AI summary request received for listing_key=%s", listing_key)

        if not listing_key:
            return Response(
                {"error": "listing_key is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prop = Property.objects.filter(listing_key=listing_key).first()
        if not prop:
            return Response(
                {"error": "Property not found for listing_key"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not isinstance(property_payload, dict):
            return Response(
                {"error": "property must be an object"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not property_payload:
            property_payload = {
                "listing_key": prop.listing_key,
                "address": prop.unparsed_address,
                "city": prop.city,
                "city_region": prop.city_region,
                "list_price": prop.list_price,
                "bedrooms_total": prop.bedrooms_total,
                "bathrooms_total_integer": prop.bathrooms_total_integer,
                "building_area_total": prop.building_area_total,
                "property_sub_type": prop.property_sub_type,
                "year_built": prop.year_built,
                "standard_status": prop.standard_status,
                "public_remarks": prop.public_remarks,
                "parking_total": prop.parking_total,
                "lot_size_area": prop.lot_size_area,
                "appliances": prop.appliances,
            }

        payload_hash = hashlib.sha256(
            json.dumps(property_payload, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()

        if (
            prop.ai_summary_markdown
            and prop.ai_summary_payload_hash == payload_hash
            and is_summary_complete(prop.ai_summary_markdown)
        ):
            logger.info("AI summary cache hit for listing_key=%s", listing_key)
            return Response(
                {
                    "summary": prop.ai_summary_markdown,
                    "cached": True,
                    "updated_at": prop.ai_summary_updated_at,
                },
                status=status.HTTP_200_OK,
            )
        elif prop.ai_summary_markdown and not is_summary_complete(prop.ai_summary_markdown):
            logger.info(
                "AI summary cache bypassed (incomplete summary) for listing_key=%s",
                listing_key,
            )

        gemini_api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not gemini_api_key:
            return Response(
                {"error": "GEMINI_API_KEY is not configured on backend"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            summary = generate_listing_summary(property_payload, gemini_api_key)
        except AISummaryGenerationError as exc:
            logger.error(
                "AI summary generation failed for listing_key=%s: %s",
                listing_key,
                str(exc),
            )
            return Response(
                {"error": f"Failed to generate summary: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception:
            logger.exception(
                "Unexpected AI summary error for listing_key=%s",
                listing_key,
            )
            return Response(
                {"error": "Failed to generate summary due to an internal error."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        prop.ai_summary_markdown = summary
        prop.ai_summary_payload_hash = payload_hash
        prop.ai_summary_updated_at = timezone.now()
        prop.save(
            update_fields=[
                "ai_summary_markdown",
                "ai_summary_payload_hash",
                "ai_summary_updated_at",
            ]
        )
        logger.info("AI summary saved for listing_key=%s", listing_key)

        return Response(
            {
                "summary": summary,
                "cached": False,
                "updated_at": prop.ai_summary_updated_at,
            },
            status=status.HTTP_200_OK,
        )

class PropertyDetailView(APIView):
    """
    Fetches a single property from DDF® API by PropertyKey.
    Supports both path-style and function-style access.
    """

    def get(self, request, PropertyKey):

        property_keys = request.GET.getlist('PropertyKey')
        # Validate PropertyKey
        if not PropertyKey:
            return Response({"error": "PropertyKey is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Building filters for the DDF® API
        filters = {
            "$select": request.GET.get('$select', '*'),  # Default to all fields if $select not provided
        }

        try:
            # Make the API call to get the property details by PropertyKey
            ddf_client = DDFAPIClient()
            property_data = ddf_client.make_api_call(f'Property/{PropertyKey}', filters)
            
            # Check if the property data is valid
            if not property_data:
                return Response({"error": "Property not found for the given PropertyKey."}, status=status.HTTP_404_NOT_FOUND)
            (property_data)
            # fetch_properties_by_property_data.delay(property_data)
            return Response(property_data, status=status.HTTP_200_OK)

        except Exception as e:
            # Handle the error and return it in a readable format
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class PropertyCompareDetailView(APIView):
    def get(self, request, *args, **kwargs):
        listing_keys = request.query_params.getlist('listing_key')
        if not listing_keys:
            return Response({"detail": "No listing_keys provided."}, status=status.HTTP_400_BAD_REQUEST)
        properties = Property.objects.filter(listing_key__in=listing_keys)
        if not properties.exists():
            return Response({"detail": "No properties found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PropertyDetailSerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ExclusivePropertiesAPIView(APIView):
    """
    GET /api/exclusive-properties/
    Only listings with "exclusive" in the FIRST 400 characters (~25–35 words)
    """

    def get_queryset(self, params):
        limit = min(int(params.get('limit', 6)), 100)
        offset = int(params.get('offset', 0))

        # CHECK ONLY FIRST 400 CHARS FOR "exclusive" (case-insensitive)
        base_qs = Property.objects.annotate(
            intro=Lower(Substr('public_remarks', 1, 400))
        ).filter(
            Q(intro__contains='exclusive') |
            Q(category_type=Property.EXCLUSIVE)
        ).distinct()

        # Auto-tag any new ones found in intro
        to_tag = base_qs.filter(intro__contains='exclusive') \
                        .exclude(category_type=Property.EXCLUSIVE)
        updated_count = 0
        if to_tag.exists():
            updated_count = to_tag.update(category_type=Property.EXCLUSIVE)

        # Start with all properties
        q = Property.objects.all()
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                q = q.filter(search_q)
        # === ALL REALTOR.CA FILTERS ===
        if params.get('price_min'):
            q = q.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            q = q.filter(list_price__lte=float(params['price_max']))

        if params.get('bedrooms'):
            q = q.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            q = q.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                q = q.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                q = q.filter(city__in=cities)

        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                q = q.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                q = q.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            q = q.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            q = q.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            q = q.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            q = q.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            q = q.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            q = q.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            cutoff = timezone.now() - timedelta(days=days)
            q = q.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            q = q.filter(standard_status=params['standard_status'])

        # Final: must be exclusive (by intro or tag)
        final_qs = q.filter(id__in=base_qs.values('id')) \
                    .distinct() \
                    .order_by('-modification_timestamp', '-list_price')

        return final_qs, limit, offset, updated_count

    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "exclusive-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        qs, limit, offset, updated = self.get_queryset(request.query_params)
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "updated_to_exclusive": updated,
            "results": serializer.data
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)
    



class UploadPreConnListingsAPIView(APIView):
    """
    POST /api/upload-pre-conn/
    Upload CSV or Excel file with column: listing_id
    Then GET /api/upload-pre-conn/ with filters to see updated listings
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Read file
        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(BytesIO(file_obj.read()))
            elif file_obj.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(BytesIO(file_obj.read()))
            else:
                return Response({"error": "File must be CSV or Excel"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Invalid file format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract listing_ids
        if 'listing_id' not in df.columns:
            return Response({"error": "Column 'listing_id' not found in file"}, status=status.HTTP_400_BAD_REQUEST)

        listing_ids = df['listing_id'].dropna().astype(str).tolist()
        if not listing_ids:
            return Response({"error": "No valid listing_ids found"}, status=status.HTTP_400_BAD_REQUEST)

        # Update properties
        updated_qs = Property.objects.filter(listing_id__in=listing_ids)
        updated_count = updated_qs.update(category_type=Property.PRE_CONN)

        # Return summary + first page
        return Response({
            "message": f"Successfully updated {updated_count} properties to PRE_CONN",
            "updated_count": updated_count,
            "total_found": len(listing_ids),
            "preview": PropertySerializer(updated_qs[:10], many=True).data
        }, status=status.HTTP_200_OK)


class PreConnPropertiesAPIView(APIView):
    """
    GET /api/pre-conn-properties/
    Returns all properties with category_type = PRE_CONN
    Supports ALL REALTOR.ca filters + limit/offset
    """

    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "pre-conn-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only PRE_CONN properties
        qs = Property.objects.filter(category_type=Property.PRE_CONN)

        # === ALL REALTOR.CA FILTERS ===
        params = request.query_params
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                qs = qs.filter(search_q)

        if params.get('price_min'):
            qs = qs.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            qs = qs.filter(list_price__lte=float(params['price_max']))

        if params.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                qs = qs.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                qs = qs.filter(city__in=cities)
        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                qs = qs.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            qs = qs.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            qs = qs.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            from django.utils import timezone
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            qs = qs.filter(standard_status=params['standard_status'])

        # Order & paginate
        qs = qs.order_by('-modification_timestamp', '-list_price')
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)
    

class LeasePropertiesAPIView(APIView):
    """
    GET /api/lease-properties/

    Returns ONLY properties with lease_amount > 0
    (Commercial leases, income properties, businesses for lease, etc.)

    Supports ALL realtor.ca filters + limit/offset pagination
    """

    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "lease-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only properties with actual lease amount
        qs = Property.objects.filter(
            lease_amount__gt=0
        ).exclude(
            lease_amount__isnull=True
        )

        # === ALL REALTOR.CA FILTERS ===
        params = request.query_params
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                qs = qs.filter(search_q)
        if params.get('price_min'):
            qs = qs.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            qs = qs.filter(list_price__lte=float(params['price_max']))

        if params.get('lease_amount_min'):
            qs = qs.filter(lease_amount__gte=float(params['lease_amount_min']))
        if params.get('lease_amount_max'):
            qs = qs.filter(lease_amount__lte=float(params['lease_amount_max']))

        if params.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                qs = qs.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                qs = qs.filter(city__in=cities)
        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                qs = qs.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            qs = qs.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            qs = qs.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            qs = qs.filter(standard_status=params['standard_status'])

        # Final ordering
        qs = qs.order_by('-lease_amount', '-modification_timestamp')

        # Pagination
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)
    




# class SoldPropertiesAPIView(APIView):
#     """
#     GET /api/sold-properties/

#     Returns ONLY properties with StandardStatus = 'Sold'
#     (Recently sold homes, condos, commercial, land, etc.)

#     Supports ALL realtor.ca filters + limit/offset pagination
#     """

#     def get(self, request):
#         limit = min(int(request.query_params.get('limit', 24)), 100)
#         offset = int(request.query_params.get('offset', 0))

#         # Base: only SOLD properties
   
#         qs = Property.objects.filter(standard_status="Sold")

#         # === ALL REALTOR.CA FILTERS ===
#         params = request.query_params

#         # Price range (original list price or sold price — here we use list_price)
#         if params.get('price_min'):
#             qs = qs.filter(list_price__gte=float(params['price_min']))
#         if params.get('price_max'):
#             qs = qs.filter(list_price__lte=float(params['price_max']))

#         # Bedrooms / Bathrooms
#         if params.get('bedrooms'):
#             qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
#         if params.get('bathrooms'):
#             qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

#         # Property type
#         if params.get('property_type'):
#             types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
#             if types:
#                 qs = qs.filter(property_sub_type__in=types)

#         # Location
#         if params.get('city'):
#             cities = [c.strip() for c in params['city'].split(',') if c.strip()]
#             if cities:
#                 qs = qs.filter(city__in=cities)
#         if params.get('province'):
#             provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
#             if provinces:
#                 qs = qs.filter(state_or_province__in=provinces)
#         if params.get('postal_code'):
#             codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
#             if codes:
#                 qs = qs.filter(postal_code__in=codes)

#         # Map bounding box
#         if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
#             qs = qs.annotate(
#                 lat_float=Cast('latitude', FloatField()),
#                 lng_float=Cast('longitude', FloatField())
#             ).filter(
#                 lat_float__gte=float(params['latitude_min']),
#                 lat_float__lte=float(params['latitude_max']),
#                 lng_float__gte=float(params['longitude_min']),
#                 lng_float__lte=float(params['longitude_max']),
#             )

#         # Size & lot
#         if params.get('building_area_min'):
#             qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
#         if params.get('lot_size_min'):
#             qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
#         if params.get('year_built_min'):
#             qs = qs.filter(year_built__gte=int(params['year_built_min']))

#         # Keywords in remarks
#         if params.get('keywords'):
#             keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
#             kw_q = Q()
#             for kw in keywords:
#                 kw_q |= Q(public_remarks__icontains=kw)
#             qs = qs.filter(kw_q)

#         # Has photos
#         if params.get('has_photos') in ('true', '1', 'True'):
#             qs = qs.filter(photos_count__gt=0)

#         # Sold in last N days
#         if params.get('sold_days'):
#             days = int(params['sold_days'])
#             cutoff = timezone.now() - timedelta(days=days)
#             qs = qs.filter(status_change_timestamp__gte=cutoff)

#         # Final ordering: most recent sold first
#         qs = qs.order_by('-status_change_timestamp', '-list_price')

#         # Pagination
#         paginator = Paginator(qs, limit)
#         page = paginator.get_page((offset // limit) + 1)

#         serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

#         return Response({
#             "count": paginator.count,
#             "next": offset + limit if page.has_next() else None,
#             "previous": offset - limit if offset >= limit else None,
#             "results": serializer.data
#         })
# schools/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from math import radians, sin, cos, sqrt, atan2


class NearestSchoolAPIView(APIView):
    """
    GET /api/nearest-school/?lat=43.418&lon=-80.317
    Returns the nearest school(s) within a specified radius with distance and full geometry.
    """
    
    def get(self, request):
        OVERPASS_URL = "https://overpass-api.de/api/interpreter"
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius = request.query_params.get('radius', '5000')  # default 5 km

        if not lat or not lon:
            return Response(
                {"error": "lat and lon parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            lat = float(lat)
            lon = float(lon)
            radius = int(radius)
        except ValueError:
            return Response(
                {"error": "lat, lon, radius must be numbers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cache_key = f"nearest-school:{round(lat, 3)}:{round(lon, 3)}:{radius}"
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        # Step 1: Query Overpass for schools near the point
        # overpass-api.de requires a non-stock User-Agent (otherwise 406 Not Acceptable).
        overpass_query = (
            f"[out:json][timeout:25];"
            f"("
            f'way(around:{radius},{lat},{lon})["amenity"="school"];'
            f'way(around:{radius},{lat},{lon})["landuse"="education"];'
            f");"
            f"out geom;"
        )
        overpass_headers = {
            "User-Agent": "mls-v2-backend/1.0 (nearest-schools; +https://vsell4u.ca)",
            "Accept": "application/json",
        }

        try:
            response = requests.post(
                OVERPASS_URL,
                data={"data": overpass_query},
                headers=overpass_headers,
                timeout=30,
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to query OpenStreetMap: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        data = response.json()

        # Step 2: Parse the Overpass data and format the result
        schools = []

        for element in data.get('elements', []):
            if element['type'] != 'way':
                continue

            # Build polygon coordinates
            coords = [[node['lon'], node['lat']] for node in element.get('geometry', [])]
            if not coords:
                continue

            # Close the ring
            if coords[0] != coords[-1]:
                coords.append(coords[0])

            # Extract the school details from the Overpass API response
            name = element.get('tags', {}).get('name', 'Unnamed School')
            amenity = element.get('tags', {}).get('amenity', '')
            operator = element.get('tags', {}).get('operator', '')
            phone = element.get('tags', {}).get('phone', '')
            website = element.get('tags', {}).get('website', '')
            address = element.get('tags', {}).get('addr:street', '') + ", " + element.get('tags', {}).get('addr:city', '')

            # Step 3: Calculate the distance using the Haversine formula
            distance_m = self.haversine(lat, lon, coords[0][1], coords[0][0]) * 1000  # Convert to meters
            distance_km = round(distance_m / 1000, 2)

            schools.append({
                "name": name,
                "operator": operator,
                "amenity": amenity,
                "phone": phone,
                "website": website,
                "address": address,
                "distance_meters": round(distance_m, 1),
                "distance_km": distance_km,
                "osm_id": element['id'],
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            })

        # Sort by distance
        schools.sort(key=lambda x: x['distance_meters'])

        payload = {
            "user_location": {"lat": lat, "lon": lon},
            "nearest_schools": schools[:10],  # Return top 10 closest
            "total_found": len(schools),
            "search_radius_m": radius
        }
        cache.set(cache_key, payload, NEAREST_SCHOOL_CACHE_TTL_SECONDS)
        return Response(payload, status=status.HTTP_200_OK)

    def haversine(self, lat1, lon1, lat2, lon2):
        """
        Calculate the great-circle distance between two points
        on the Earth's surface given their latitude and longitude
        in decimal degrees.
        """
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        r = 6371  # Radius of the Earth in kilometers
        return r * c  # Distance in kilometers



class NewlyListedPropertiesAPIView(APIView):
    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "newly-listed-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only properties with actual lease amount
        qs = Property.objects.filter(
            original_entry_timestamp__isnull=False
        ).order_by('-original_entry_timestamp')

        # === ALL REALTOR.CA FILTERS ===
        params = request.query_params
        if params.get('search'):
            search_term = params['search'].strip()
            if search_term:
                search_q = Q()

                # Text fields (case-insensitive partial match)
                text_fields = [
                    'unparsed_address',
                    'public_remarks',
                    'city',
                    'postal_code',
                    'listing_id',
                    'listing_key',
                    'street_name',
                    'street_number',
                    'unit_number',
                    'subdivision_name',
                    'directions',
                    'property_sub_type',
                    'common_interest',
                    'list_aor',
                    'zoning',
                    'zoning_description',
                    'parcel_number',
                    'anchors_co_tenants',
                    'water_body_name',
                ]

                for field in text_fields:
                    search_q |= Q(**{f"{field}__icontains": search_term})

                # Exact match for numeric-like strings (e.g. postal code without space)
                if len(search_term) >= 3:
                    search_q |= Q(postal_code__iexact=search_term.replace(" ", ""))

                # Search in remarks keywords
                search_q |= Q(public_remarks__icontains=search_term)

                qs = qs.filter(search_q)
        if params.get('price_min'):
            qs = qs.filter(list_price__gte=float(params['price_min']))
        if params.get('price_max'):
            qs = qs.filter(list_price__lte=float(params['price_max']))

        if params.get('lease_amount_min'):
            qs = qs.filter(lease_amount__gte=float(params['lease_amount_min']))
        if params.get('lease_amount_max'):
            qs = qs.filter(lease_amount__lte=float(params['lease_amount_max']))

        if params.get('bedrooms'):
            qs = qs.filter(bedrooms_total__gte=int(params['bedrooms']))
        if params.get('bathrooms'):
            qs = qs.filter(bathrooms_total_integer__gte=int(params['bathrooms']))

        if params.get('property_type'):
            types = [t.strip() for t in params['property_type'].split(',') if t.strip()]
            if types:
                qs = qs.filter(property_sub_type__in=types)

        if params.get('city'):
            cities = [c.strip() for c in params['city'].split(',') if c.strip()]
            if cities:
                qs = qs.filter(city__in=cities)
        if params.get('province'):
            provinces = [p.strip() for p in params['province'].split(',') if p.strip()]
            if provinces:
                qs = qs.filter(state_or_province__in=provinces)

        if params.get('postal_code'):
            codes = [c.strip().upper() for c in params['postal_code'].split(',') if c.strip()]
            if codes:
                qs = qs.filter(postal_code__in=codes)

        # Map bounding box
        if all(k in params for k in ['latitude_min', 'latitude_max', 'longitude_min', 'longitude_max']):
            qs = qs.annotate(
                lat_float=Cast('latitude', FloatField()),
                lng_float=Cast('longitude', FloatField())
            ).filter(
                lat_float__gte=float(params['latitude_min']),
                lat_float__lte=float(params['latitude_max']),
                lng_float__gte=float(params['longitude_min']),
                lng_float__lte=float(params['longitude_max']),
            )

        if params.get('building_area_min'):
            qs = qs.filter(building_area_total__gte=float(params['building_area_min']))
        if params.get('lot_size_min'):
            qs = qs.filter(lot_size_area__gte=float(params['lot_size_min']))
        if params.get('year_built_min'):
            qs = qs.filter(year_built__gte=int(params['year_built_min']))

        if params.get('keywords'):
            keywords = [k.strip() for k in params['keywords'].split(',') if k.strip()]
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(public_remarks__icontains=kw)
            qs = qs.filter(kw_q)

        if params.get('has_photos') in ('true', '1', 'True'):
            qs = qs.filter(photos_count__gt=0)

        if params.get('new_listings_days'):
            days = int(params['new_listings_days'])
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(modification_timestamp__gte=cutoff)

        if params.get('standard_status'):
            qs = qs.filter(standard_status=params['standard_status'])

        # Final ordering
        qs = qs.order_by('-lease_amount', '-modification_timestamp')

        # Pagination
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)
    
