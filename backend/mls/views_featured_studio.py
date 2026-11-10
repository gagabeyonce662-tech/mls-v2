"""Staff pin/unpin for the homepage Featured MLS rail."""

from __future__ import annotations

from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from vlog.permissions import IsStaffUser

from .models import Property


def _row(prop: Property) -> dict:
    return {
        "listing_key": prop.listing_key,
        "address": prop.unparsed_address or "",
        "city": prop.city or "",
        "list_price": str(prop.list_price) if prop.list_price is not None else None,
        "standard_status": prop.standard_status or "",
        "is_featured": prop.is_featured,
        "featured_order": prop.featured_order,
        "featured_until": prop.featured_until.isoformat() if prop.featured_until else None,
    }


def _clear_featured_cache() -> None:
    keys = [
        f"featured-properties:{limit}:{fill}"
        for limit in (3, 6, 12, 24)
        for fill in (0, 1)
    ]
    cache.delete_many(keys)


class StudioFeaturedAPIView(APIView):
    """GET lists pins plus a search. PATCH sets is_featured, order, and an optional end time."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()[:120]
        pins = Property.objects.filter(is_featured=True).order_by("featured_order", "-listing_key")[:24]
        results = []
        if query:
            results = (
                Property.objects.filter(
                    Q(unparsed_address__icontains=query)
                    | Q(city__icontains=query)
                    | Q(listing_key__icontains=query)
                )
                .order_by("-list_price")[:20]
            )
        return Response({
            "pins": [_row(prop) for prop in pins],
            "results": [_row(prop) for prop in results],
        })

    def patch(self, request):
        listing_key = request.data.get("listing_key")
        if not isinstance(listing_key, str) or not listing_key.strip():
            return Response({"detail": "Choose a listing."}, status=status.HTTP_400_BAD_REQUEST)
        prop = get_object_or_404(Property, listing_key=listing_key.strip())
        featured = request.data.get("is_featured")
        if not isinstance(featured, bool):
            return Response({"detail": "Set is_featured to true or false."}, status=status.HTTP_400_BAD_REQUEST)
        order = request.data.get("featured_order")
        until_raw = request.data.get("featured_until")
        until = None
        if featured:
            if order is not None and order != "":
                if isinstance(order, bool) or not isinstance(order, int) or order < 1 or order > 99:
                    return Response(
                        {"detail": "Position must be a number from 1 to 99, or blank."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                order = None
            if until_raw:
                until = parse_datetime(str(until_raw))
                if until is None:
                    return Response({"detail": "The end date is not valid."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            order = None
            until = None
        prop.is_featured = featured
        prop.featured_order = order
        prop.featured_until = until
        prop.save(update_fields=["is_featured", "featured_order", "featured_until"])
        _clear_featured_cache()
        return Response(_row(prop))
