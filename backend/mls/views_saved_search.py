"""GAP-03: SavedSearch endpoints.

* GET  /api/mls/saved-searches/            - list the caller's saved searches
* POST /api/mls/saved-searches/            - create a saved search
* GET  /api/mls/saved-searches/<id>/       - retrieve one
* PUT  /api/mls/saved-searches/<id>/       - update name / filters / alert cadence
* DELETE /api/mls/saved-searches/<id>/     - delete

All endpoints require authentication. A user cannot see or mutate another
user's rows because every queryset is scoped by ``request.user``.
"""
from __future__ import annotations

import os

from django.db import IntegrityError
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .models import SavedSearch
from .serializers import SavedSearchSerializer


def _saved_search_cap() -> int:
    """Per-user cap, read from the environment.

    The v3 frontend ships ONE saved search per user (it replaces the existing
    row via PUT rather than creating a second), so the default is 1. A garbled
    or non-positive value falls back to 1 instead of failing at import time or
    silently disabling the cap.
    """
    raw = os.environ.get("MAX_SAVED_SEARCHES_PER_USER", "1")
    try:
        value = int(str(raw).strip())
    except (TypeError, ValueError):
        return 1
    return value if value > 0 else 1


MAX_SAVED_SEARCHES_PER_USER = _saved_search_cap()


class _SavedSearchCreateThrottle(UserRateThrottle):
    scope = "saved_search_create"
    # Falls back to DEFAULT_THROTTLE_RATES if the scope is defined there;
    # otherwise DRF treats the class as inactive, which is safe.


class SavedSearchListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        return [_SavedSearchCreateThrottle()] if self.request.method == "POST" else []

    @extend_schema(
        summary="List the caller's saved searches",
        responses={200: SavedSearchSerializer(many=True)},
    )
    def get(self, request):
        qs = SavedSearch.objects.filter(user=request.user).order_by("-updated_at")
        return Response(SavedSearchSerializer(qs, many=True).data)

    @extend_schema(
        summary="Save the current filter set as a named search",
        request=SavedSearchSerializer,
        responses={
            201: SavedSearchSerializer,
            400: OpenApiResponse(description="Invalid payload."),
            409: OpenApiResponse(description="A saved search with this name already exists."),
            429: OpenApiResponse(description="Saved-search cap reached."),
        },
    )
    def post(self, request):
        # Cap protects against a buggy client looping create() calls.
        if SavedSearch.objects.filter(user=request.user).count() >= MAX_SAVED_SEARCHES_PER_USER:
            return Response(
                {"error": f"Cap of {MAX_SAVED_SEARCHES_PER_USER} saved searches reached."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = SavedSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            instance = serializer.save(user=request.user)
        except IntegrityError:
            return Response(
                {"error": "You already have a saved search with this name."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            SavedSearchSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )


class SavedSearchDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_instance(self, request, pk):
        return get_object_or_404(SavedSearch, pk=pk, user=request.user)

    @extend_schema(responses={200: SavedSearchSerializer})
    def get(self, request, pk):
        return Response(SavedSearchSerializer(self._get_instance(request, pk)).data)

    @extend_schema(request=SavedSearchSerializer, responses={200: SavedSearchSerializer})
    def put(self, request, pk):
        instance = self._get_instance(request, pk)
        serializer = SavedSearchSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except IntegrityError:
            return Response(
                {"error": "You already have a saved search with this name."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(serializer.data)

    def delete(self, request, pk):
        self._get_instance(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
