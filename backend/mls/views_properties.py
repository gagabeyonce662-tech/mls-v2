import json
from datetime import timedelta
from decimal import Decimal

from django.core.cache import cache
from django.core.paginator import Paginator
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, OpenApiTypes, extend_schema, inline_serializer
from django.db.models import FloatField
from django.db.models import Q
from django.db.models.functions import Cast

from .models import Property, SearchEvent
from .serializers import PropertySerializer
from .services.listing_embeddings import rank_ids
from .services.query_helpers import (
    apply_structure_filters,
    price_field_for,
    _apply_fallback_pipeline,
    _apply_open_house_filters,
    _build_property_filter_cache_key,
    home_type_q,
)
from .views import (
    MAP_VIEW_CACHE_TTL_SECONDS,
)


def _point_in_polygon(lat, lng, polygon):
    inside = False
    previous = polygon[-1]
    for current in polygon:
        cy, cx = current["lat"], current["lng"]
        py, px = previous["lat"], previous["lng"]
        intersects = (cy > lat) != (py > lat) and lng < (px - cx) * (lat - cy) / (py - cy) + cx
        if intersects:
            inside = not inside
        previous = current
    return inside


# "Best match" scores at most this many filtered listings (newest first);
# the result count is capped to it, which the rolling DDF cache rarely hits
# once a city or price filter applies.
RELEVANCE_POOL = 2000


def _relevance_order(final_qs, text):
    """Filtered listing ids ordered by similarity to ``text``, or None to keep
    the normal order (no embeddings yet, or OpenAI unavailable)."""
    if isinstance(final_qs, list):
        ids = [prop.id for prop in final_qs[:RELEVANCE_POOL]]
    else:
        ids = list(final_qs.values_list("id", flat=True)[:RELEVANCE_POOL])
    return rank_ids(ids, text)


class PropertyFilterView(APIView):
    """
    GET /api/properties/

    Full-featured property search using your local Property model (PostgreSQL)
    No DDF API calls -> No 400/500 errors -> Super fast
    """

    @extend_schema(
        summary="Filter properties",
        description="Search local MLS properties using text, location, map bounds, status, and date filters.",
        parameters=[
            OpenApiParameter("limit", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Page size, capped at 100. Defaults to 6."),
            OpenApiParameter("offset", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("search", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("city", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("has_lease", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("lat_min", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("lat_max", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("lng_min", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("lng_max", OpenApiTypes.NUMBER, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sold_days", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("modified_since", OpenApiTypes.DATETIME, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("orderby", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="A field (e.g. -list_price), or 'relevance' to rank by similarity to `semantic`."),
            OpenApiParameter("semantic", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Soft preferences from AI search (e.g. 'near subway, big backyard'). Used only with orderby=relevance; never filters."),
            OpenApiParameter("price_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum list_price."),
            OpenApiParameter("price_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Maximum list_price."),
            OpenApiParameter("beds_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum bedrooms_total."),
            OpenApiParameter("baths_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum bathrooms_total_integer."),
            OpenApiParameter("property_sub_type", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Repeatable. Comma-separated or repeated param values (e.g. 'Detached,Condo Apartment')."),
            OpenApiParameter("sqft_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum building_area_total."),
            OpenApiParameter("sqft_max", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Maximum building_area_total."),
            OpenApiParameter("year_built_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum year_built."),
            OpenApiParameter("garages_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum garage / parking spaces."),
            OpenApiParameter("stories_min", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description="Minimum number of floors/stories."),
            OpenApiParameter("basement", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False, description="Basement: yes | finished | unfinished | apartment | none."),
            OpenApiParameter("has_open_house", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False, description="Restrict to listings with an upcoming open house (defaults to today onwards)."),
            OpenApiParameter("open_house_from", OpenApiTypes.DATE, OpenApiParameter.QUERY, required=False, description="Open-house date lower bound (YYYY-MM-DD)."),
            OpenApiParameter("open_house_to", OpenApiTypes.DATE, OpenApiParameter.QUERY, required=False, description="Open-house date upper bound (YYYY-MM-DD)."),
            OpenApiParameter("allow_fallback", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False, description="Set to false to disable the relaxed/nearby/safety-net fallback and return count=0 on no-match."),
        ],
        responses={
            200: OpenApiResponse(response=inline_serializer(
                name="PropertyFilterResponse",
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
        filter_cache_key = _build_property_filter_cache_key(request)
        cached_payload = cache.get(filter_cache_key)
        if cached_payload is not None:
            return Response(cached_payload)

        limit = min(int(request.GET.get("limit", 6)), 100)
        offset = int(request.GET.get("offset", 0))

        qs = Property.objects.all()
        if request.GET.get("status"):
            qs = qs.filter(standard_status=request.GET.get("status", "").strip())
        if request.GET.get("has_lease") in ("true", "1", "True"):
            qs = qs.filter(Q(lease_amount__gt=0) | Q(total_actual_rent__gt=0))

        # On Rent, price filters and price sorting use the monthly rent:
        # rentals have no list_price, so filtering on it returned nothing.
        # Annotated on the base queryset because the fallback's safety-net
        # stage orders it directly, without passing through the filters.
        qs, price_field = price_field_for(qs, request.GET)

        try:
            if request.GET.get("price_min"):
                qs = qs.filter(**{f"{price_field}__gte": int(request.GET.get("price_min"))})
            if request.GET.get("price_max"):
                qs = qs.filter(**{f"{price_field}__lte": int(request.GET.get("price_max"))})
            if request.GET.get("beds_min"):
                qs = qs.filter(bedrooms_total__gte=int(request.GET.get("beds_min")))
            if request.GET.get("baths_min"):
                qs = qs.filter(bathrooms_total_integer__gte=int(request.GET.get("baths_min")))
            if request.GET.get("sqft_min"):
                qs = qs.filter(building_area_total__gte=int(request.GET.get("sqft_min")))
            if request.GET.get("sqft_max"):
                qs = qs.filter(building_area_total__lte=int(request.GET.get("sqft_max")))
            if request.GET.get("year_built_min"):
                qs = qs.filter(year_built__gte=int(request.GET.get("year_built_min")))
            if request.GET.get("garages_min"):
                int(request.GET.get("garages_min"))  # validate early; applied below
            if request.GET.get("stories_min"):
                int(request.GET.get("stories_min"))
        except (TypeError, ValueError):
            return Response(
                {
                    "error": (
                        "price_min/price_max/beds_min/baths_min/sqft_min/sqft_max/"
                        "year_built_min/garages_min/stories_min must be integers."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = apply_structure_filters(qs, request.GET)

        sub_type_values: list[str] = []
        for raw in request.GET.getlist("property_sub_type"):
            for value in str(raw).split(","):
                cleaned = value.strip()
                if cleaned and cleaned not in sub_type_values:
                    sub_type_values.append(cleaned)
        if sub_type_values:
            qs = qs.filter(property_sub_type__in=sub_type_values)
        home_q = home_type_q(request.GET)
        if home_q is not None:
            qs = qs.filter(home_q)

        if all(k in request.GET for k in ["lat_min", "lat_max", "lng_min", "lng_max"]):
            qs = qs.annotate(
                lat_float=Cast("latitude", FloatField()),
                lng_float=Cast("longitude", FloatField())
            ).filter(
                lat_float__gte=float(request.GET.get("lat_min")),
                lat_float__lte=float(request.GET.get("lat_max")),
                lng_float__gte=float(request.GET.get("lng_min")),
                lng_float__lte=float(request.GET.get("lng_max")),
            )
        if request.GET.get("sold_days"):
            days = int(request.GET.get("sold_days"))
            cutoff = timezone.now() - timedelta(days=days)
            qs = qs.filter(status_change_timestamp__gte=cutoff)
        if request.GET.get("modified_since"):
            qs = qs.filter(modification_timestamp__gte=request.GET.get("modified_since"))

        # GAP-01: open-house filters are applied before the fallback pipeline
        # so a strict "must have an open house" search returns count=0 rather
        # than the relaxed catalog when nothing matches.
        qs = _apply_open_house_filters(qs, request.GET)

        order_by = request.GET.get("orderby", "-modification_timestamp")
        # "relevance" (AI search's "Best match") ranks by description
        # similarity after filtering; the SQL step keeps newest-first so
        # equal scores and unembedded listings stay in a sensible order.
        semantic = (request.GET.get("semantic") or "").strip()[:300]
        rank_by_relevance = order_by == "relevance"
        if rank_by_relevance:
            order_by = "-modification_timestamp"
        if order_by.lstrip("-") == "list_price":
            order_by = order_by.replace("list_price", price_field)
        # listing_key (unique) breaks ties. Price, beds and size sorts tie
        # constantly, and Postgres may order tied rows differently per query,
        # so offset paging repeated some homes across pages and skipped others.
        final_qs, fallback_meta = _apply_fallback_pipeline(qs, request.GET, (order_by, "listing_key"))

        polygon = None
        if request.GET.get("polygon"):
            try:
                raw_polygon = json.loads(request.GET["polygon"])
                if not isinstance(raw_polygon, list) or len(raw_polygon) < 3:
                    raise ValueError
                polygon = [
                    {"lat": float(point["lat"]), "lng": float(point["lng"])}
                    for point in raw_polygon
                ]
            except (TypeError, ValueError, KeyError, json.JSONDecodeError):
                return Response({"error": "polygon must contain at least three lat/lng points"}, status=status.HTTP_400_BAD_REQUEST)

        if polygon:
            # Narrow in SQL to the polygon's bounding box first. The exact
            # point-in-polygon test below runs in Python over every row it is
            # given, so without this it iterated the whole filtered catalogue;
            # the bbox is a strict superset of the polygon, so no match is lost.
            # latitude/longitude are DecimalFields, compared directly (indexed).
            lats = [point["lat"] for point in polygon]
            lngs = [point["lng"] for point in polygon]
            final_qs = final_qs.filter(
                latitude__isnull=False,
                longitude__isnull=False,
                latitude__gte=Decimal(str(min(lats))),
                latitude__lte=Decimal(str(max(lats))),
                longitude__gte=Decimal(str(min(lngs))),
                longitude__lte=Decimal(str(max(lngs))),
            )
            final_qs = [
                prop
                for prop in final_qs.iterator(chunk_size=1000)
                if prop.latitude is not None
                and prop.longitude is not None
                and _point_in_polygon(float(prop.latitude), float(prop.longitude), polygon)
            ]

        ranked_ids = _relevance_order(final_qs, semantic) if rank_by_relevance and semantic else None
        if ranked_ids is not None:
            # Page over the ranked ids, then load just that page's rows from
            # the filtered queryset so its annotations (rent price) survive.
            paginator = Paginator(ranked_ids, limit)
            page = paginator.get_page((offset // limit) + 1)
            page_ids = list(page.object_list)
            if isinstance(final_qs, list):
                by_id = {prop.id: prop for prop in final_qs}
            else:
                by_id = {prop.id: prop for prop in final_qs.filter(id__in=page_ids)}
            page_objects = [by_id[pid] for pid in page_ids if pid in by_id]
        else:
            paginator = Paginator(final_qs, limit)
            page = paginator.get_page((offset // limit) + 1)
            page_objects = page.object_list

        serializer = PropertySerializer(page_objects, many=True, context={"request": request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
            "ranked_by_relevance": ranked_ids is not None,
            **fallback_meta,
        }
        cache.set(filter_cache_key, payload, MAP_VIEW_CACHE_TTL_SECONDS)
        query = (request.GET.get("search") or "").strip()
        city = (request.GET.get("city") or "").strip()
        # Internal replays (saved-search alerts) are not user searches.
        if (query or city) and not getattr(request, "_skip_search_event", False):
            SearchEvent.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_key=(request.headers.get("X-Session-Key", "") or request.GET.get("session_key", ""))[:64],
                query=query[:255],
                city=city[:255],
                filters_json={k: v for k, v in request.GET.items() if k != "session_key"},
                result_count=paginator.count,
            )
        return Response(payload)
