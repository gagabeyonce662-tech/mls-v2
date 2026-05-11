from datetime import timedelta

from django.core.cache import cache
from django.core.paginator import Paginator
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import FloatField
from django.db.models.functions import Cast

from .models import Property, SearchEvent
from .serializers import PropertySerializer
from .services.query_helpers import (
    _apply_fallback_pipeline,
    _build_property_filter_cache_key,
)
from .views import (
    MAP_VIEW_CACHE_TTL_SECONDS,
)


class PropertyFilterView(APIView):
    """
    GET /api/properties/

    Full-featured property search using your local Property model (PostgreSQL)
    No DDF API calls -> No 400/500 errors -> Super fast
    """

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
            qs = qs.filter(lease_amount__gt=0)
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

        order_by = request.GET.get("orderby", "-modification_timestamp")
        final_qs, fallback_meta = _apply_fallback_pipeline(qs, request.GET, (order_by,))

        paginator = Paginator(final_qs, limit)
        page = paginator.get_page((offset // limit) + 1)

        serializer = PropertySerializer(page.object_list, many=True, context={"request": request})

        payload = {
            "count": paginator.count,
            "next": offset + limit if page.has_next() else None,
            "previous": offset - limit if offset >= limit else None,
            "results": serializer.data,
            **fallback_meta,
        }
        cache.set(filter_cache_key, payload, MAP_VIEW_CACHE_TTL_SECONDS)
        query = (request.GET.get("search") or "").strip()
        city = (request.GET.get("city") or "").strip()
        if query or city:
            SearchEvent.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_key=(request.headers.get("X-Session-Key", "") or request.GET.get("session_key", ""))[:64],
                query=query[:255],
                city=city[:255],
                filters_json={k: v for k, v in request.GET.items() if k != "session_key"},
                result_count=paginator.count,
            )
        return Response(payload)
