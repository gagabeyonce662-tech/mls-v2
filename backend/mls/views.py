import requests
import hashlib
import os
import json
import logging
import time
import re
from io import BytesIO
import pandas as pd
from datetime import timedelta, datetime
import h3

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers
from django.db.models import Q, FloatField, Count, Value, F
from django.db.models.functions import Cast, Substr, Lower, Replace, Upper
from django.core.paginator import Paginator
from django.core.cache import cache
from django.utils import timezone

# Local imports
from .models import AccessToken
from .helpers import get_access_token, fetch_properties_by_property_data
from mls.models import (
    MapAggregateCell,
    Property,
    CommunityListing,
    UserFavorite,
    UserHistory,
    UserToured,
    UserFollowedArea,
    UserAlertPreference,
    ListingViewEvent,
    UserPropertyInteraction,
    PropertyNote,
    PropertySnapshot,
    CensusFSA,
)
from .serializers import (
    PropertySerializer,
    PropertyDetailSerializer,
    UserFeedbackSerializer,
    PropertyInquirySerializer,
    WatchedMutationSerializer,
    UserFavoriteSerializer,
    UserHistorySerializer,
    UserTouredSerializer,
    FollowedAreaMutationSerializer,
    UserFollowedAreaSerializer,
    UserAlertPreferenceSerializer,
    ListingRecommendationsResponseSerializer,
    RecommendationTrackSerializer,
)
from mls.services.map_aggregates import get_resolution_for_zoom
from mls.services.inquiry_ghl import sync_inquiry_to_ghl
from mls.services.inquiry_notifications import send_inquiry_email_to_realtor
from mls.services.ai_listing_summary import (
    AISummaryGenerationError,
    generate_listing_summary,
    is_summary_complete,
    SUMMARY_PROMPT_VERSION,
)
from mls.services.recommendations import build_recommendation_payload

logger = logging.getLogger(__name__)
# Shared TTL for map bbox responses (aggregates + property filter). Override via env; default 15m fits ~24h listing refresh cadence.
MAP_VIEW_CACHE_TTL_SECONDS = int(
    os.environ.get("MAP_VIEW_CACHE_TTL_SECONDS", "900")
)
LISTING_CACHE_TTL_SECONDS = int(
    os.environ.get("LISTING_CACHE_TTL_SECONDS", "86400")
)
RECOMMENDATION_CACHE_TTL_SECONDS = int(
    os.environ.get("RECOMMENDATION_CACHE_TTL_SECONDS", "300")
)
NEAREST_SCHOOL_CACHE_TTL_SECONDS = int(
    os.environ.get("NEAREST_SCHOOL_CACHE_TTL_SECONDS", "86400")
)


def _load_school_enrichment_maps():
    """
    Returns (by_name_lower, by_osm_id_str).
    JSON may be legacy flat {name: meta} or structured {"names": {...}, "osm_ids": {...}}.
    """
    path = os.path.join(os.path.dirname(__file__), "data", "school_enrichment.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and ("names" in data or "osm_ids" in data):
            by_name = {
                str(k).strip().lower(): v
                for k, v in (data.get("names") or {}).items()
                if isinstance(v, dict)
            }
            by_osm = {
                str(k).strip(): v
                for k, v in (data.get("osm_ids") or {}).items()
                if isinstance(v, dict)
            }
            return by_name, by_osm
        if isinstance(data, dict):
            legacy = {
                str(k).strip().lower(): v
                for k, v in data.items()
                if isinstance(v, dict)
            }
            return legacy, {}
    except Exception:
        pass
    return {}, {}


_SCHOOL_ENRICHMENT_BY_NAME, _SCHOOL_ENRICHMENT_BY_OSM = _load_school_enrichment_maps()


def _school_enrichment_for_row(osm_id, name):
    blob = _SCHOOL_ENRICHMENT_BY_OSM.get(str(osm_id)) or _SCHOOL_ENRICHMENT_BY_NAME.get(
        (name or "").strip().lower()
    )
    if not blob or not isinstance(blob, dict):
        return None
    out = dict(blob)
    if "eqao_rating_band" not in out and out.get("eqao_band") is not None:
        out["eqao_rating_band"] = out["eqao_band"]
    return out


def _median_sorted(nums):
    if not nums:
        return None
    s = sorted(nums)
    n = len(s)
    mid = n // 2
    if n % 2:
        return float(s[mid])
    return (float(s[mid - 1]) + float(s[mid])) / 2.0


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
            lng_float=Cast("longitude", FloatField())
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
    strict = _apply_common_filters(base_qs, params, include_search=True, include_location=True, relaxed_city=False)
    strict = strict.order_by(*order_by)
    if strict.exists():
        return strict, {
            "fallback_applied": False,
            "fallback_stage": None,
            "suggested_locations": [],
        }

    relaxed = _apply_common_filters(base_qs, params, include_search=True, include_location=True, relaxed_city=True)
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

class FetchProperties(APIView):
    """
    API view to fetch properties from the REALTOR.ca API
    """

    @extend_schema(
        operation_id="mls_properties_list",
        responses={200: OpenApiTypes.OBJECT},
    )
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

    @extend_schema(
        summary="Submit user feedback",
        description="Create a feedback submission from a visitor or signed-in user.",
        request=UserFeedbackSerializer,
        responses={
            201: inline_serializer(
                name="FeedbackCreatedResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "message": serializers.CharField(),
                },
            ),
            400: OpenApiResponse(description="Invalid feedback payload."),
        },
        auth=[],
    )
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


class PropertyInquiryAPIView(APIView):
    """
    POST /api/mls/inquiries/
    Create a property search / Find My Home inquiry for the realtor.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Create a property inquiry",
        description="Submit a property search or Find My Home inquiry for the realtor.",
        request=PropertyInquirySerializer,
        responses={
            201: inline_serializer(
                name="InquiryCreatedResponse",
                fields={
                    "id": serializers.IntegerField(),
                    "message": serializers.CharField(),
                },
            ),
            400: OpenApiResponse(description="Invalid inquiry payload."),
        },
        auth=[],
    )
    def post(self, request):
        serializer = PropertyInquirySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        inquiry = serializer.save(
            user=request.user if request.user.is_authenticated else None,
        )
        page_url = serializer.validated_data.get("page_url") or ""
        listing_match = re.search(r"/listing/(?:rental/)?([^/?#]+)", page_url)
        inferred_listing_key = listing_match.group(1) if listing_match else ""
        if inferred_listing_key:
            UserPropertyInteraction.objects.create(
                listing_key=inferred_listing_key,
                user=request.user if request.user.is_authenticated else None,
                session_key=request.headers.get("X-Session-Key", "")[:64],
                event_type=UserPropertyInteraction.EVENT_INQUIRY,
                source="inquiry_form",
                metadata={"page_url": page_url, "intent": serializer.validated_data.get("intent", "buy")},
            )
        sync_inquiry_to_ghl(inquiry)
        send_inquiry_email_to_realtor(inquiry)
        return Response(
            {
                "id": inquiry.id,
                "message": "Inquiry received.",
            },
            status=status.HTTP_201_CREATED,
        )


class WatchedOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get watched properties overview",
        description="Return the authenticated user's favorites, history, toured properties, followed areas, and alert preferences.",
        responses={
            200: inline_serializer(
                name="WatchedOverviewResponse",
                fields={
                    "favorites": UserFavoriteSerializer(many=True),
                    "history": UserHistorySerializer(many=True),
                    "toured": UserTouredSerializer(many=True),
                    "followed_areas": UserFollowedAreaSerializer(many=True),
                    "alert_preferences": UserAlertPreferenceSerializer(),
                },
            ),
            401: OpenApiResponse(description="Authentication credentials were not provided or are invalid."),
        },
    )
    def get(self, request):
        favorites = UserFavorite.objects.filter(user=request.user).order_by("-created_at")
        history = UserHistory.objects.filter(user=request.user).order_by("-viewed_at")
        toured = UserToured.objects.filter(user=request.user).order_by("-toured_at")
        followed_areas = UserFollowedArea.objects.filter(user=request.user).order_by("-created_at")
        prefs, _ = UserAlertPreference.objects.get_or_create(user=request.user)
        return Response(
            {
                "favorites": UserFavoriteSerializer(favorites, many=True).data,
                "history": UserHistorySerializer(history, many=True).data,
                "toured": UserTouredSerializer(toured, many=True).data,
                "followed_areas": UserFollowedAreaSerializer(followed_areas, many=True).data,
                "alert_preferences": UserAlertPreferenceSerializer(prefs).data,
            },
            status=status.HTTP_200_OK,
        )


class WatchedFavoriteToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Toggle a watched favorite",
        description="Add a property to favorites, or remove it if it is already favorited.",
        request=WatchedMutationSerializer,
        responses={
            200: inline_serializer(
                name="FavoriteToggleResponse",
                fields={"is_favorite": serializers.BooleanField()},
            ),
            400: OpenApiResponse(description="Invalid property payload."),
            401: OpenApiResponse(description="Authentication credentials were not provided or are invalid."),
        },
    )
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
            UserPropertyInteraction.objects.create(
                listing_key=property_key,
                user=request.user,
                event_type=UserPropertyInteraction.EVENT_FAVORITE,
                source="watched",
                metadata={"created": True},
            )
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

        UserPropertyInteraction.objects.create(
            listing_key=property_key,
            user=request.user,
            event_type=UserPropertyInteraction.EVENT_HISTORY,
            source="watched",
        )
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


class WatchedTouredToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WatchedMutationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_key = serializer.validated_data["property_key"]
        snapshot = serializer.validated_data.get("property_snapshot_json", {}) or {}

        toured, created = UserToured.objects.get_or_create(
            user=request.user,
            property_key=property_key,
            defaults={"property_snapshot_json": snapshot},
        )
        if created:
            UserPropertyInteraction.objects.create(
                listing_key=property_key,
                user=request.user,
                event_type=UserPropertyInteraction.EVENT_TOURED,
                source="watched",
                metadata={"created": True},
            )
            return Response({"is_toured": True}, status=status.HTTP_200_OK)

        toured.delete()
        return Response({"is_toured": False}, status=status.HTTP_200_OK)


class WatchedClearTouredAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = UserToured.objects.filter(user=request.user).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class WatchedAreaFollowAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FollowedAreaMutationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        area_key = serializer.validated_data["area_key"]
        area_label = serializer.validated_data.get("area_label") or area_key.replace("-", " ").title()
        area_kind = serializer.validated_data.get("area_kind", "community")
        metadata_json = serializer.validated_data.get("metadata_json", {}) or {}

        UserFollowedArea.objects.update_or_create(
            user=request.user,
            area_key=area_key,
            defaults={
                "area_label": area_label,
                "area_kind": area_kind,
                "metadata_json": metadata_json,
            },
        )
        return Response({"followed": True}, status=status.HTTP_200_OK)


class WatchedAreaUnfollowAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FollowedAreaMutationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        area_key = serializer.validated_data["area_key"]
        deleted, _ = UserFollowedArea.objects.filter(user=request.user, area_key=area_key).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class WatchedAreaClearAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = UserFollowedArea.objects.filter(user=request.user).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class WatchedAlertPreferencesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = UserAlertPreference.objects.get_or_create(user=request.user)
        return Response(UserAlertPreferenceSerializer(prefs).data, status=status.HTTP_200_OK)

    def put(self, request):
        prefs, _ = UserAlertPreference.objects.get_or_create(user=request.user)
        serializer = UserAlertPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class WatchedAlertPreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", "14") or 14)
        days = max(1, min(days, 60))
        since = timezone.now() - timedelta(days=days)

        prefs, _ = UserAlertPreference.objects.get_or_create(user=request.user)
        if not prefs.email_enabled:
            return Response(
                {"events": [], "message": "Email alerts are disabled."},
                status=status.HTTP_200_OK,
            )
        if not prefs.email_watched_property:
            return Response(
                {"events": [], "message": "Watched property email alerts are disabled."},
                status=status.HTTP_200_OK,
            )

        favorite_keys = list(
            UserFavorite.objects.filter(user=request.user).values_list("property_key", flat=True)[:500]
        )
        if not favorite_keys:
            return Response({"events": []}, status=status.HTTP_200_OK)

        events = []
        for listing_key in favorite_keys:
            snapshots = list(
                PropertySnapshot.objects.filter(
                    listing_key=listing_key,
                    created_at__gte=since,
                )
                .order_by("-created_at")[:2]
            )
            if len(snapshots) < 2:
                continue

            latest, previous = snapshots[0], snapshots[1]
            latest_price = float(latest.list_price) if latest.list_price is not None else None
            previous_price = float(previous.list_price) if previous.list_price is not None else None
            latest_status = (latest.standard_status or "").strip()
            previous_status = (previous.standard_status or "").strip()

            if prefs.price_changes and latest_price is not None and previous_price is not None and latest_price != previous_price:
                events.append(
                    {
                        "type": "price_change",
                        "listing_key": listing_key,
                        "old_price": previous_price,
                        "new_price": latest_price,
                        "changed_at": latest.created_at,
                    }
                )
            if prefs.status_updates and latest_status and previous_status and latest_status != previous_status:
                events.append(
                    {
                        "type": "status_change",
                        "listing_key": listing_key,
                        "old_status": previous_status,
                        "new_status": latest_status,
                        "changed_at": latest.created_at,
                    }
                )

        events.sort(key=lambda item: item.get("changed_at") or timezone.now(), reverse=True)
        return Response(
            {
                "events": events[:50],
                "window_days": days,
                "favorites_checked": len(favorite_keys),
            },
            status=status.HTTP_200_OK,
        )


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


class PropertyRecommendationsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, listing_key):
        listing_key = (listing_key or "").strip()
        if not listing_key:
            return Response({"error": "listing_key is required"}, status=status.HTTP_400_BAD_REQUEST)

        prop = Property.objects.filter(listing_key=listing_key).first()
        if not prop:
            return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)

        limit = max(2, min(int(request.query_params.get("limit", "6")), 12))
        session_key = (request.query_params.get("session_key") or request.headers.get("X-Session-Key") or "")[:64]
        segment = f"user:{request.user.id}" if request.user.is_authenticated else f"session:{session_key or 'anon'}"
        cache_key = f"recommendations:{listing_key}:{segment}:l{limit}"
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        rec_payload = build_recommendation_payload(
            target_property=prop,
            user=request.user if request.user.is_authenticated else None,
            session_key=session_key,
            limit_per_section=limit,
        )

        def _serialize_rows(rows):
            return [{**row, "property": PropertySerializer(row["property"]).data} for row in rows]

        sections = rec_payload.get("sections", {})
        response_payload = {
            "for_this_home": _serialize_rows(sections.get("for_this_home", [])),
            "based_on_your_history": _serialize_rows(sections.get("based_on_your_history", [])),
            "people_also_viewed": _serialize_rows(sections.get("people_also_viewed", [])),
            "fallback": _serialize_rows(rec_payload.get("fallback", {}).get("rows", [])),
            "metadata": {
                **rec_payload.get("metadata", {}),
                "fallback_applied": rec_payload.get("fallback", {}).get("applied", False),
            },
        }
        cache.set(cache_key, response_payload, RECOMMENDATION_CACHE_TTL_SECONDS)
        return Response(response_payload, status=status.HTTP_200_OK)


class RecommendationTrackAPIView(APIView):
    permission_classes = [AllowAny]

    EVENT_TYPE_MAP = {
        "impression": UserPropertyInteraction.EVENT_VIEW,
        "click": UserPropertyInteraction.EVENT_DETAIL_OPEN,
        "detail_open": UserPropertyInteraction.EVENT_DETAIL_OPEN,
        "save": UserPropertyInteraction.EVENT_FAVORITE,
        "compare": UserPropertyInteraction.EVENT_HISTORY,
    }

    def post(self, request):
        serializer = RecommendationTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event_type = serializer.validated_data["event_type"]
        listing_key = serializer.validated_data["listing_key"]
        session_key = (
            serializer.validated_data.get("session_key")
            or request.headers.get("X-Session-Key", "")
        )[:64]
        metadata = serializer.validated_data.get("metadata", {}) or {}
        section = serializer.validated_data.get("section") or ""
        if section:
            metadata["section"] = section
        metadata["event_type_raw"] = event_type

        UserPropertyInteraction.objects.create(
            listing_key=listing_key,
            session_key=session_key,
            user=request.user if request.user.is_authenticated else None,
            event_type=self.EVENT_TYPE_MAP.get(event_type, UserPropertyInteraction.EVENT_VIEW),
            source="recommendation",
            metadata=metadata,
        )
        return Response({"ok": True}, status=status.HTTP_201_CREATED)


class PropertyTypesAPIView(APIView):
    """
    GET /api/mls/properties/property-types/
    Returns available property_sub_type values with counts.
    Optional query params:
      - province (comma-separated province codes, e.g. ON,QC)
      - listing_type: all | exclusive | lease | precon | community
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
        elif listing_type == "community":
            qs = qs.filter(community_listings__is_published=True).distinct()
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
            )
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


class ListingAISummaryThrottle(UserRateThrottle):
    scope = "listing_ai_summary"


def _build_listing_summary_payload(prop):
    is_rental = bool(prop.lease_amount or prop.total_actual_rent)
    return {
        "listing_key": prop.listing_key,
        "transaction_type": "rent" if is_rental else "sale",
        "address": prop.unparsed_address,
        "city": prop.city,
        "city_region": prop.city_region,
        "status": prop.standard_status,
        "property_type": prop.property_sub_type,
        "list_price": prop.list_price,
        "rent": prop.lease_amount or prop.total_actual_rent,
        "rent_frequency": prop.lease_amount_frequency,
        "bedrooms": prop.bedrooms_total,
        "bathrooms": prop.bathrooms_total_integer,
        "size": prop.building_area_total or prop.living_area,
        "size_unit": prop.building_area_units or prop.living_area_units,
        "year_built": prop.year_built,
        "parking_spaces": prop.parking_total,
        "parking_features": prop.parking_features,
        "utilities": prop.utilities,
        "appliances": prop.appliances,
        "exterior_features": prop.exterior_features,
        "flooring": prop.flooring,
        "lot_size": prop.lot_size_area,
        "annual_taxes": prop.tax_annual_amount,
        "public_remarks": prop.public_remarks,
    }


class ListingAISummaryAPIView(APIView):
    """
    POST /api/mls/properties/ai-summary/
    Generates or returns cached AI markdown summary and persists in Property table.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [ListingAISummaryThrottle]

    def post(self, request):
        listing_key = str(request.data.get("listing_key", "")).strip()
        force = request.data.get("force") is True
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

        # Build from the canonical database record, not client-supplied content.
        property_payload = _build_listing_summary_payload(prop)

        payload_hash = hashlib.sha256(
            json.dumps(
                {"prompt_version": SUMMARY_PROMPT_VERSION, "property": property_payload},
                sort_keys=True,
                default=str,
            ).encode("utf-8")
        ).hexdigest()

        if (
            not force
            and
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

    @extend_schema(
        operation_id="mls_properties_retrieve",
        summary="Get a property by listing key",
        description="Fetch a single property from the DDF API by its PropertyKey.",
        parameters=[
            OpenApiParameter("PropertyKey", OpenApiTypes.STR, OpenApiParameter.PATH, description="DDF property/listing key."),
            OpenApiParameter("$select", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Comma-separated DDF fields to return."),
        ],
        responses={
            200: OpenApiResponse(response=OpenApiTypes.OBJECT, description="DDF property payload."),
            400: OpenApiResponse(description="The DDF request failed."),
            404: OpenApiResponse(description="Property was not found."),
        },
        auth=[],
    )
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

        scoped_qs = Property.objects.filter(id__in=base_qs.values('id')).distinct()
        final_qs, fallback_meta = _apply_fallback_pipeline(
            scoped_qs,
            params,
            ("-modification_timestamp", "-list_price"),
        )
        return final_qs, limit, offset, updated_count, fallback_meta

    @extend_schema(
        summary="List exclusive properties",
        description="Return listings tagged exclusive or containing exclusive language in the first 400 characters of the remarks.",
        parameters=[
            OpenApiParameter("limit", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Page size, capped at 100. Defaults to 6."),
            OpenApiParameter("offset", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Number of results to skip. Defaults to 0."),
            OpenApiParameter("search", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("property_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("min_price", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("max_price", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
        ],
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="ExclusivePropertiesResponse",
                fields={
                    "count": serializers.IntegerField(),
                    "next": serializers.IntegerField(allow_null=True),
                    "previous": serializers.IntegerField(allow_null=True),
                    "updated_to_exclusive": serializers.IntegerField(),
                    "results": PropertySerializer(many=True),
                    "fallback_applied": serializers.BooleanField(required=False),
                },
            )),
            400: OpenApiResponse(description="Invalid query parameter."),
        },
        auth=[],
    )
    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "exclusive-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        qs, limit, offset, updated, fallback_meta = self.get_queryset(request.query_params)
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "updated_to_exclusive": updated,
            "results": serializer.data,
            **fallback_meta,
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

        qs = Property.objects.filter(category_type=Property.PRE_CONN)
        qs, fallback_meta = _apply_fallback_pipeline(
            qs,
            request.query_params,
            ("-modification_timestamp", "-list_price"),
        )
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
            **fallback_meta,
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)
    

class CommunityPropertiesAPIView(APIView):
    """
    GET /api/community-properties/
    Returns published community-linked properties with community metadata.
    """

    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "community-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.query_params.get("limit", 12)), 100)
        offset = int(request.query_params.get("offset", 0))

        community_qs = CommunityListing.objects.filter(is_published=True).select_related(
            "property"
        )
        if request.query_params.get("community_slug"):
            slugs = _split_csv(request.query_params.get("community_slug", ""))
            if slugs:
                community_qs = community_qs.filter(community_slug__in=slugs)
        if request.query_params.get("community_name"):
            community_qs = community_qs.filter(
                community_name__icontains=request.query_params.get("community_name", "")
            )

        property_ids = list(community_qs.values_list("property_id", flat=True))
        base_qs = Property.objects.filter(id__in=property_ids)
        base_qs, fallback_meta = _apply_fallback_pipeline(
            base_qs,
            request.query_params,
            ("-modification_timestamp", "-list_price"),
        )

        community_by_property_id = {}
        for row in community_qs.values(
            "property_id", "community_name", "community_slug", "badge", "rank"
        ):
            community_by_property_id[row["property_id"]] = row

        paginator = Paginator(base_qs, limit)
        page = paginator.get_page((offset // limit) + 1)
        serializer = PropertySerializer(page.object_list, many=True, context={"request": request})
        property_ids_by_key = {
            item.listing_key: item.id for item in page.object_list
        }

        merged_results = []
        for prop in serializer.data:
            listing_key = prop.get("listing_key")
            prop_id = property_ids_by_key.get(listing_key)
            community_info = community_by_property_id.get(prop_id, {})
            merged_results.append(
                {
                    **prop,
                    "community_name": community_info.get("community_name"),
                    "community_slug": community_info.get("community_slug"),
                    "community_badge": community_info.get("badge", ""),
                    "community_rank": community_info.get("rank", 0),
                }
            )

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": merged_results,
            **fallback_meta,
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

        qs = Property.objects.filter(
            lease_amount__gt=0
        ).exclude(
            lease_amount__isnull=True
        )
        if request.query_params.get("lease_amount_min"):
            qs = qs.filter(lease_amount__gte=float(request.query_params.get("lease_amount_min")))
        if request.query_params.get("lease_amount_max"):
            qs = qs.filter(lease_amount__lte=float(request.query_params.get("lease_amount_max")))
        qs, fallback_meta = _apply_fallback_pipeline(
            qs,
            request.query_params,
            ("-lease_amount", "-modification_timestamp"),
        )

        # Pagination
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
            **fallback_meta,
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

            row = {
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
                },
            }
            enrich = _school_enrichment_for_row(element["id"], name)
            if enrich:
                row["enrichment"] = enrich
            schools.append(row)

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


class NearbyAmenitiesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")
        radius = request.query_params.get("radius", "1500")
        if not lat or not lon:
            return Response({"error": "lat and lon are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat)
            lon = float(lon)
            radius = int(radius)
        except ValueError:
            return Response({"error": "lat/lon/radius must be numeric"}, status=status.HTTP_400_BAD_REQUEST)

        radius = max(200, min(radius, 5000))
        cache_key = f"nearby-amenities:{round(lat, 4)}:{round(lon, 4)}:{radius}"
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        overpass_query = (
            f"[out:json][timeout:25];("
            f'node(around:{radius},{lat},{lon})["shop"="supermarket"];'
            f'node(around:{radius},{lat},{lon})["amenity"="cafe"];'
            f'node(around:{radius},{lat},{lon})["amenity"="restaurant"];'
            f'node(around:{radius},{lat},{lon})["leisure"="park"];'
            f'node(around:{radius},{lat},{lon})["highway"="bus_stop"];'
            f'node(around:{radius},{lat},{lon})["railway"="station"];'
            f");out body;"
        )
        headers = {
            "User-Agent": "mls-v2-backend/1.0 (nearby-amenities; +https://vsell4u.ca)",
            "Accept": "application/json",
        }
        try:
            response = requests.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_query},
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            return Response(
                {"error": f"Failed to query OpenStreetMap amenities: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        grouped = {"groceries": [], "cafes": [], "parks": [], "transit": []}
        for element in response.json().get("elements", []):
            if element.get("type") != "node":
                continue
            tags = element.get("tags", {}) or {}
            row = {
                "name": tags.get("name", "Unnamed"),
                "lat": element.get("lat"),
                "lon": element.get("lon"),
                "osm_id": element.get("id"),
                "address": ", ".join(
                    [v for v in [tags.get("addr:street"), tags.get("addr:city")] if v]
                ),
            }
            if tags.get("shop") == "supermarket":
                grouped["groceries"].append(row)
            elif tags.get("amenity") in {"cafe", "restaurant"}:
                grouped["cafes"].append(row)
            elif tags.get("leisure") == "park":
                grouped["parks"].append(row)
            elif tags.get("highway") == "bus_stop" or tags.get("railway") == "station":
                grouped["transit"].append(row)

        payload = {
            "origin": {"lat": lat, "lon": lon},
            "radius_m": radius,
            "categories": grouped,
        }
        cache.set(cache_key, payload, 86400)
        return Response(payload, status=status.HTTP_200_OK)


class NewlyListedPropertiesAPIView(APIView):
    @extend_schema(
        summary="List newly listed properties",
        description="Return active properties ordered by their original listing timestamp, with optional lease filters.",
        parameters=[
            OpenApiParameter("limit", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Page size, capped at 100. Defaults to 6."),
            OpenApiParameter("offset", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Number of results to skip. Defaults to 0."),
            OpenApiParameter("lease_amount_min", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("lease_amount_max", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("search", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
        ],
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="NewlyListedPropertiesResponse",
                fields={
                    "count": serializers.IntegerField(),
                    "next": serializers.IntegerField(allow_null=True),
                    "previous": serializers.IntegerField(allow_null=True),
                    "results": PropertySerializer(many=True),
                    "fallback_applied": serializers.BooleanField(required=False),
                },
            )),
            400: OpenApiResponse(description="Invalid query parameter."),
        },
        auth=[],
    )
    def get(self, request):
        cache_key = _build_query_params_cache_key(
            "newly-listed-properties", request.query_params
        )
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.query_params.get('limit', 6)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Base: only properties with valid original entry timestamp
        qs = Property.objects.filter(
            original_entry_timestamp__isnull=False
        )
        if request.query_params.get("lease_amount_min"):
            qs = qs.filter(lease_amount__gte=float(request.query_params.get("lease_amount_min")))
        if request.query_params.get("lease_amount_max"):
            qs = qs.filter(lease_amount__lte=float(request.query_params.get("lease_amount_max")))
        qs, fallback_meta = _apply_fallback_pipeline(
            qs,
            request.query_params,
            ("-original_entry_timestamp", "-modification_timestamp"),
        )

        # Pagination
        paginator = Paginator(qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={'request': request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
            **fallback_meta,
        }
        cache.set(cache_key, payload, LISTING_CACHE_TTL_SECONDS)
        return Response(payload)


class ListingCatalogStatsAPIView(APIView):
    """Aggregates from active listings in our DB only (not sold market data)."""

    permission_classes = [AllowAny]

    def get(self, request):
        city = (request.query_params.get("city") or "").strip()
        fsa = (request.query_params.get("fsa") or "").strip().upper()[:3]
        has_city = bool(city)
        has_fsa = len(fsa) == 3
        if not has_city and not has_fsa:
            return Response(
                {"error": "Provide city or fsa (3-letter FSA)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cache_key = f"catalog-stats:{city.lower()}:{fsa}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = Property.objects.filter(
            standard_status__iexact="Active",
            list_price__isnull=False,
        ).exclude(list_price__lte=0)
        if city:
            qs = qs.filter(city__iexact=city)
        if len(fsa) == 3:
            pc_norm = Upper(
                Replace(
                    Replace(F("postal_code"), Value(" "), Value("")),
                    Value("-"),
                    Value(""),
                )
            )
            qs = qs.annotate(pc_norm=pc_norm).filter(pc_norm__startswith=fsa)

        prices = []
        ppsf = []
        for lp, la in qs.values_list("list_price", "living_area"):
            if lp is None:
                continue
            try:
                fv = float(lp)
            except (TypeError, ValueError):
                continue
            if fv <= 0:
                continue
            prices.append(fv)
            if la:
                try:
                    laf = float(la)
                    if laf > 0:
                        ppsf.append(fv / laf)
                except (TypeError, ValueError):
                    pass

        payload = {
            "scope": {"city": city or None, "fsa": fsa if len(fsa) == 3 else None},
            "sample_size": len(prices),
            "median_list_price": _median_sorted(prices),
            "mean_list_price": (sum(prices) / len(prices)) if prices else None,
            "min_list_price": min(prices) if prices else None,
            "max_list_price": max(prices) if prices else None,
            "median_price_per_sqft": _median_sorted(ppsf),
            "disclaimer": "Based on active listings in this site catalog only; not sold comparables or board-reported market stats.",
        }
        cache.set(cache_key, payload, 300)
        return Response(payload)


class ListingTrendsAPIView(APIView):
    """Time-series trends from active/listing catalog data (not sold feed)."""

    permission_classes = [AllowAny]

    def get(self, request):
        city = (request.query_params.get("city") or "").strip()
        fsa = (request.query_params.get("fsa") or "").strip().upper()[:3]
        months = request.query_params.get("window", "12m").strip().lower()
        try:
            window_months = int(months.replace("m", ""))
        except ValueError:
            window_months = 12
        window_months = max(3, min(window_months, 36))

        has_city = bool(city)
        has_fsa = len(fsa) == 3
        if not has_city and not has_fsa:
            return Response(
                {"error": "Provide city or fsa (3-letter FSA)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = f"listing-trends:{city.lower()}:{fsa}:{window_months}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = Property.objects.filter(
            standard_status__iexact="Active",
            list_price__isnull=False,
        ).exclude(list_price__lte=0)
        if city:
            qs = qs.filter(city__iexact=city)
        if len(fsa) == 3:
            pc_norm = Upper(
                Replace(
                    Replace(F("postal_code"), Value(" "), Value("")),
                    Value("-"),
                    Value(""),
                )
            )
            qs = qs.annotate(pc_norm=pc_norm).filter(pc_norm__startswith=fsa)

        def percentile(nums, p):
            if not nums:
                return None
            s = sorted(nums)
            if len(s) == 1:
                return float(s[0])
            k = (len(s) - 1) * p
            f = int(k)
            c = min(f + 1, len(s) - 1)
            if f == c:
                return float(s[f])
            d0 = s[f] * (c - k)
            d1 = s[c] * (k - f)
            return float(d0 + d1)

        now = timezone.now()
        # Approx month start N months back.
        start_month = (now.year * 12 + now.month - window_months)
        start_year = start_month // 12
        start_month_num = start_month % 12
        if start_month_num == 0:
            start_year -= 1
            start_month_num = 12
        start_date = datetime(start_year, start_month_num, 1, tzinfo=now.tzinfo)

        monthly = {}
        subtype_count = {}
        bed_bucket_count = {"0-1": 0, "2": 0, "3": 0, "4+": 0}
        bath_bucket_count = {"0-1": 0, "2": 0, "3": 0, "4+": 0}
        lease_vs_sale = {"lease": 0, "sale": 0}
        all_prices = []
        all_ppsf = []
        total_rows = 0
        rows_with_living_area = 0
        rows_with_list_price = 0
        rows_recently_updated_30d = 0
        new_30d = 0
        mods_30d = 0
        for row in qs.values(
            "listing_key",
            "list_price",
            "living_area",
            "property_sub_type",
            "bedrooms_total",
            "bathrooms_total_integer",
            "lease_amount",
            "total_actual_rent",
            "original_entry_timestamp",
            "modification_timestamp",
        ):
            total_rows += 1
            lp = row.get("list_price")
            if lp is None:
                continue
            rows_with_list_price += 1
            try:
                price = float(lp)
            except (TypeError, ValueError):
                continue
            if price <= 0:
                continue
            all_prices.append(price)
            ts = row.get("original_entry_timestamp") or row.get("modification_timestamp")
            if not ts or ts < start_date:
                continue
            if row.get("original_entry_timestamp") and row.get("original_entry_timestamp") >= now - timedelta(days=30):
                new_30d += 1
            if row.get("modification_timestamp") and row.get("modification_timestamp") >= now - timedelta(days=30):
                mods_30d += 1
                rows_recently_updated_30d += 1
            month_key = f"{ts.year:04d}-{ts.month:02d}"
            bucket = monthly.setdefault(
                month_key,
                {"prices": [], "ppsf": [], "new_listings": 0},
            )
            bucket["prices"].append(price)
            bucket["new_listings"] += 1
            la = row.get("living_area")
            if la:
                try:
                    area = float(la)
                    if area > 0:
                        bucket["ppsf"].append(price / area)
                        all_ppsf.append(price / area)
                        rows_with_living_area += 1
                except (TypeError, ValueError):
                    pass
            subtype = (row.get("property_sub_type") or "Other").strip() or "Other"
            subtype_count[subtype] = subtype_count.get(subtype, 0) + 1
            beds = row.get("bedrooms_total")
            baths = row.get("bathrooms_total_integer")
            try:
                b = int(float(beds)) if beds is not None else 0
            except (TypeError, ValueError):
                b = 0
            try:
                bt = int(float(baths)) if baths is not None else 0
            except (TypeError, ValueError):
                bt = 0
            if b <= 1:
                bed_bucket_count["0-1"] += 1
            elif b == 2:
                bed_bucket_count["2"] += 1
            elif b == 3:
                bed_bucket_count["3"] += 1
            else:
                bed_bucket_count["4+"] += 1
            if bt <= 1:
                bath_bucket_count["0-1"] += 1
            elif bt == 2:
                bath_bucket_count["2"] += 1
            elif bt == 3:
                bath_bucket_count["3"] += 1
            else:
                bath_bucket_count["4+"] += 1
            if row.get("lease_amount") is not None or row.get("total_actual_rent") is not None:
                lease_vs_sale["lease"] += 1
            else:
                lease_vs_sale["sale"] += 1

        month_points = []
        ym = start_month
        for _ in range(window_months):
            y = ym // 12
            m = ym % 12
            if m == 0:
                y -= 1
                m = 12
            key = f"{y:04d}-{m:02d}"
            b = monthly.get(key, {"prices": [], "ppsf": [], "new_listings": 0})
            prices = b["prices"]
            ppsf = b["ppsf"]
            month_points.append(
                {
                    "month": key,
                    "median_list_price": _median_sorted(prices),
                    "mean_list_price": (sum(prices) / len(prices)) if prices else None,
                    "median_price_per_sqft": _median_sorted(ppsf),
                    "new_listings": b["new_listings"],
                }
            )
            ym += 1

        subtype_distribution = [
            {"name": k, "count": v}
            for k, v in sorted(subtype_count.items(), key=lambda kv: kv[1], reverse=True)[:8]
        ]

        scoped_keys = list(qs.values_list("listing_key", flat=True)[:2000])
        views_7d = 0
        views_prev_7d = 0
        saves_30d = 0
        rising = []
        if scoped_keys:
            last7 = now - timedelta(days=7)
            prev7 = now - timedelta(days=14)
            views_7d = ListingViewEvent.objects.filter(
                listing_key__in=scoped_keys,
                created_at__gte=last7,
            ).count()
            views_prev_7d = ListingViewEvent.objects.filter(
                listing_key__in=scoped_keys,
                created_at__gte=prev7,
                created_at__lt=last7,
            ).count()
            saves_30d = UserFavorite.objects.filter(
                property_key__in=scoped_keys,
                created_at__gte=now - timedelta(days=30),
            ).count()
            current_map = {
                row["listing_key"]: row["c"]
                for row in ListingViewEvent.objects.filter(
                    listing_key__in=scoped_keys,
                    created_at__gte=last7,
                )
                .values("listing_key")
                .annotate(c=Count("id"))
            }
            prev_map = {
                row["listing_key"]: row["c"]
                for row in ListingViewEvent.objects.filter(
                    listing_key__in=scoped_keys,
                    created_at__gte=prev7,
                    created_at__lt=last7,
                )
                .values("listing_key")
                .annotate(c=Count("id"))
            }
            deltas = []
            for key, curr in current_map.items():
                prev = prev_map.get(key, 0)
                deltas.append((key, curr, prev, curr - prev))
            deltas.sort(key=lambda x: x[3], reverse=True)
            rising = [
                {
                    "listing_key": d[0],
                    "views_7d": d[1],
                    "views_prev_7d": d[2],
                    "delta": d[3],
                }
                for d in deltas[:8]
                if d[3] > 0
            ]

        active_prev_30d = Property.objects.filter(
            standard_status__iexact="Active",
            list_price__isnull=False,
        ).exclude(list_price__lte=0)
        if city:
            active_prev_30d = active_prev_30d.filter(city__iexact=city)
        if len(fsa) == 3:
            pc_norm_prev = Upper(
                Replace(
                    Replace(F("postal_code"), Value(" "), Value("")),
                    Value("-"),
                    Value(""),
                )
            )
            active_prev_30d = active_prev_30d.annotate(pc_norm=pc_norm_prev).filter(pc_norm__startswith=fsa)
        active_prev_30d = active_prev_30d.filter(
            original_entry_timestamp__lt=now - timedelta(days=30)
        ).count()
        active_current = total_rows

        payload = {
            "scope": {"city": city or None, "fsa": fsa if len(fsa) == 3 else None},
            "window_months": window_months,
            "series": month_points,
            "subtype_distribution": subtype_distribution,
            "sample_size": sum(p["new_listings"] for p in month_points),
            "velocity": {
                "active_current": active_current,
                "active_delta_30d": active_current - active_prev_30d,
                "new_listings_30d": new_30d,
                "modifications_30d": mods_30d,
            },
            "pricing": {
                "list_price_p25": percentile(all_prices, 0.25),
                "list_price_p50": percentile(all_prices, 0.50),
                "list_price_p75": percentile(all_prices, 0.75),
                "price_per_sqft_p25": percentile(all_ppsf, 0.25),
                "price_per_sqft_p50": percentile(all_ppsf, 0.50),
                "price_per_sqft_p75": percentile(all_ppsf, 0.75),
                "spread_index": (
                    (percentile(all_prices, 0.75) - percentile(all_prices, 0.25))
                    if percentile(all_prices, 0.75) is not None and percentile(all_prices, 0.25) is not None
                    else None
                ),
            },
            "segmentation": {
                "by_subtype": subtype_distribution,
                "by_bedrooms": [{"name": k, "count": v} for k, v in bed_bucket_count.items()],
                "by_bathrooms": [{"name": k, "count": v} for k, v in bath_bucket_count.items()],
                "lease_vs_sale": [{"name": k, "count": v} for k, v in lease_vs_sale.items()],
            },
            "behavior": {
                "views_7d": views_7d,
                "views_prev_7d": views_prev_7d,
                "views_delta_pct": (
                    ((views_7d - views_prev_7d) / views_prev_7d * 100.0)
                    if views_prev_7d > 0
                    else None
                ),
                "saves_30d": saves_30d,
                "rising_listings": rising,
                "note": "Activity is based on usage on this site.",
            },
            "confidence": {
                "sample_size": active_current,
                "pct_with_living_area": (rows_with_living_area / active_current * 100.0) if active_current else 0.0,
                "pct_with_list_price": (rows_with_list_price / active_current * 100.0) if active_current else 0.0,
                "pct_recently_updated_30d": (rows_recently_updated_30d / active_current * 100.0) if active_current else 0.0,
            },
            "disclaimer": "Based on active listings in this site catalog only; not sold-market stats.",
        }
        cache.set(cache_key, payload, 300)
        return Response(payload)


class ListingViewBeaconAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import ListingViewBeaconSerializer

        ser = ListingViewBeaconSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        lk = ser.validated_data["listing_key"]
        sk = ser.validated_data["session_key"]
        user = request.user if request.user.is_authenticated else None
        ListingViewEvent.objects.create(
            listing_key=lk,
            session_key=sk,
            user=user,
        )
        UserPropertyInteraction.objects.create(
            listing_key=lk,
            session_key=sk,
            user=user,
            event_type=UserPropertyInteraction.EVENT_VIEW,
            source="beacon",
        )
        return Response({"ok": True}, status=status.HTTP_201_CREATED)


class ListingEngagementAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        lk = (request.query_params.get("listing_key") or "").strip()
        if not lk:
            return Response(
                {"error": "listing_key required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        since = timezone.now() - timedelta(days=7)
        views_7d = ListingViewEvent.objects.filter(
            listing_key=lk, created_at__gte=since
        ).count()
        views_30d = ListingViewEvent.objects.filter(
            listing_key=lk, created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        city = (
            Property.objects.filter(listing_key=lk)
            .values_list("city", flat=True)
            .first()
        )
        peer_views = 0
        if city:
            peer_keys = list(
                Property.objects.filter(
                    city__iexact=city, standard_status__iexact="Active"
                ).values_list("listing_key", flat=True)[:500]
            )
            if peer_keys:
                peer_views = ListingViewEvent.objects.filter(
                    created_at__gte=since,
                    listing_key__in=peer_keys,
                ).count()
        activity = "low"
        if views_7d >= 15:
            activity = "high"
        elif views_7d >= 5:
            activity = "medium"
        return Response(
            {
                "listing_key": lk,
                "views_7d": views_7d,
                "views_30d": views_30d,
                "activity_band": activity,
                "peer_views_7d_sample": peer_views,
                "peer_context_note": "Counts reflect traffic on this site only (approximate peer sample by city).",
            }
        )


class CensusFSAAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, fsa):
        fsa = (fsa or "").strip().upper()[:3]
        if len(fsa) != 3:
            return Response({"error": "Invalid FSA"}, status=status.HTTP_400_BAD_REQUEST)
        row = CensusFSA.objects.filter(pk=fsa).first()
        if row:
            return Response({"fsa": fsa, "profile": row.data})
        seed_path = os.path.join(
            os.path.dirname(__file__), "data", "census_fsa_seed.json"
        )
        try:
            with open(seed_path, encoding="utf-8") as f:
                blob = json.load(f)
            block = blob.get(fsa)
            if block:
                return Response({"fsa": fsa, "profile": block, "source": "seed_file"})
        except Exception:
            pass
        return Response(
            {"fsa": fsa, "profile": None, "message": "No census profile loaded for this FSA."},
            status=status.HTTP_404_NOT_FOUND,
        )


class PropertySnapshotsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, listing_key):
        qs = (
            PropertySnapshot.objects.filter(listing_key=listing_key)
            .order_by("-created_at")[:50]
        )
        data = [
            {
                "list_price": float(s.list_price) if s.list_price is not None else None,
                "standard_status": s.standard_status,
                "source_modification_timestamp": s.source_modification_timestamp,
                "created_at": s.created_at,
            }
            for s in qs
        ]
        return Response({"listing_key": listing_key, "snapshots": data})


class PropertyNoteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lk = (request.query_params.get("listing_key") or "").strip()
        if not lk:
            return Response(
                {"error": "listing_key required"}, status=status.HTTP_400_BAD_REQUEST
            )
        note, _ = PropertyNote.objects.get_or_create(
            user=request.user, listing_key=lk, defaults={"body": ""}
        )
        return Response(
            {"listing_key": lk, "body": note.body, "updated_at": note.updated_at}
        )

    def put(self, request):
        lk = (request.data.get("listing_key") or "").strip()
        body = request.data.get("body", "")
        if not lk:
            return Response(
                {"error": "listing_key required"}, status=status.HTTP_400_BAD_REQUEST
            )
        note, _ = PropertyNote.objects.update_or_create(
            user=request.user,
            listing_key=lk,
            defaults={"body": str(body)[:20000]},
        )
        return Response(
            {"listing_key": lk, "body": note.body, "updated_at": note.updated_at}
        )
