"""GAP-38: GET /api/mls/search/suggest/

Typed, ranked suggestions for the homepage hero, listings search, and map
search dropdowns. Reuses the existing city fuzzy matcher (get_close_matches,
cutoff=0.5) so a mistyped city or FSA is corrected instead of falling through
to the safety_net stage that returns the entire catalog.

Response shape:
    {
      "corrected_from": null | str,
      "results": [
        {"type": "city|neighbourhood|postal|address|listing", ...},
        ...
      ]
    }

Each result includes ``type``, ``label`` (display string), ``value`` (the
value to drop into a structured filter), plus ``count`` for aggregate types
and ``listing_key`` for the listing type.
"""
from __future__ import annotations

import re
from difflib import get_close_matches

from django.core.cache import cache
from django.db.models import Count, Q
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

from .models import Property
from .services.query_helpers import _normalize_postal, _normalize_text


SUGGEST_CACHE_TTL_SECONDS = 300
DEFAULT_LIMIT = 10
MAX_LIMIT = 10
MIN_QUERY_LENGTH = 2
FUZZY_CUTOFF = 0.5


def _rank_place(query_norm: str, candidate_norm: str) -> int:
    """Lower is better. exact-prefix > contains > fuzzy."""
    if candidate_norm == query_norm:
        return 0
    if candidate_norm.startswith(query_norm):
        return 1
    if query_norm in candidate_norm:
        return 2
    return 3


class SearchSuggestAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Typed, ranked suggestions for the search dropdown (GAP-38)",
        description=(
            "Returns city / neighbourhood / postal (FSA + full) / address / "
            "listing suggestions for a partial query. Includes fuzzy matching "
            "on city names (via difflib.get_close_matches, cutoff 0.5) so "
            "'otawa' -> 'ottawa' surfaces the correct city with counts."
        ),
        parameters=[
            OpenApiParameter("q", OpenApiTypes.STR, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("limit", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False, description=f"Capped at {MAX_LIMIT}."),
        ],
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="SearchSuggestResponse",
                    fields={
                        "corrected_from": serializers.CharField(allow_null=True, required=False),
                        "results": serializers.ListField(child=serializers.DictField()),
                    },
                ),
            ),
        },
        auth=[],
    )
    def get(self, request):
        raw_q = (request.query_params.get("q") or "").strip()
        if len(raw_q) < MIN_QUERY_LENGTH:
            return Response({"corrected_from": None, "results": []})

        try:
            limit = int(request.query_params.get("limit", DEFAULT_LIMIT))
        except (TypeError, ValueError):
            limit = DEFAULT_LIMIT
        limit = max(1, min(limit, MAX_LIMIT))

        # Cache key includes the normalised query so 'Toronto ' and 'toronto'
        # hit the same entry.
        q_norm = _normalize_text(raw_q)
        cache_key = f"search-suggest:v1:{q_norm}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        payload = self._build_payload(raw_q, q_norm, limit)
        cache.set(cache_key, payload, SUGGEST_CACHE_TTL_SECONDS)
        return Response(payload)

    # ------------------------------------------------------------------ helpers

    def _build_payload(self, raw_q: str, q_norm: str, limit: int) -> dict:
        corrected_from: str | None = None

        cities = self._suggest_cities(q_norm, limit)
        # Fuzzy correction is only interesting when NO city matched the raw
        # query at all - otherwise the dropdown surfaces the exact match.
        if not cities:
            corrected = self._fuzzy_correct_city(q_norm)
            if corrected and corrected != q_norm:
                cities = self._suggest_cities(corrected, limit)
                if cities:
                    corrected_from = raw_q

        query_for_search = corrected_from and cities[0]["value"] or raw_q
        query_norm_for_search = _normalize_text(query_for_search)

        neighbourhoods = self._suggest_neighbourhoods(query_norm_for_search, limit)
        postals = self._suggest_postals(raw_q, limit)
        addresses = self._suggest_addresses(query_for_search, limit)
        listings = self._suggest_listings(raw_q, limit)

        # Ranking: places (city, neighbourhood, postal) above addresses/listings.
        # Within places, exact-prefix > contains > fuzzy - handled per-suggester.
        ordered: list[dict] = []
        for group in (cities, neighbourhoods, postals, addresses, listings):
            for item in group:
                if item not in ordered:
                    ordered.append(item)
                if len(ordered) >= limit:
                    break
            if len(ordered) >= limit:
                break

        return {"corrected_from": corrected_from, "results": ordered[:limit]}

    def _suggest_cities(self, q_norm: str, limit: int) -> list[dict]:
        if not q_norm:
            return []
        rows = (
            Property.objects.filter(city__icontains=q_norm)
            .exclude(city__isnull=True)
            .exclude(city__exact="")
            .values("city")
            .annotate(count=Count("id"))
            .order_by("-count")[:100]
        )
        seen: set[str] = set()
        scored: list[tuple[int, int, dict]] = []
        for row in rows:
            city = (row.get("city") or "").strip()
            if not city:
                continue
            key = _normalize_text(city)
            if key in seen:
                continue
            seen.add(key)
            rank = _rank_place(q_norm, key)
            scored.append((
                rank,
                -row["count"],  # sort more-populous first within the same rank
                {
                    "type": "city",
                    "label": city,
                    "value": city,
                    "count": row["count"],
                    "city": city,
                },
            ))
        scored.sort(key=lambda t: (t[0], t[1]))
        return [item for _, _, item in scored[:limit]]

    def _suggest_neighbourhoods(self, q_norm: str, limit: int) -> list[dict]:
        if not q_norm:
            return []
        rows = (
            Property.objects.filter(city_region__icontains=q_norm)
            .exclude(city_region__isnull=True)
            .exclude(city_region__exact="")
            .values("city_region", "city")
            .annotate(count=Count("id"))
            .order_by("-count")[:100]
        )
        seen: set[str] = set()
        scored: list[tuple[int, int, dict]] = []
        for row in rows:
            region = (row.get("city_region") or "").strip()
            if not region:
                continue
            key = _normalize_text(region)
            if key in seen:
                continue
            seen.add(key)
            rank = _rank_place(q_norm, key)
            scored.append((
                rank,
                -row["count"],
                {
                    "type": "neighbourhood",
                    "label": f"{region}, {row.get('city')}" if row.get("city") else region,
                    "value": region,
                    "count": row["count"],
                    "city": row.get("city") or "",
                },
            ))
        scored.sort(key=lambda t: (t[0], t[1]))
        return [item for _, _, item in scored[:limit]]

    def _suggest_postals(self, raw_q: str, limit: int) -> list[dict]:
        compact = _normalize_postal(raw_q)
        if len(compact) < 3:
            return []
        # Match against the postal_code column stripped of whitespace so
        # both 'L7A' and 'L7A 3K9' hit the same rows.
        # Do the strip in Python once we retrieve values (cheaper than
        # annotating a Replace expression for the aggregation, and the FSA
        # bucket is small).
        raw_rows = (
            Property.objects.filter(
                Q(postal_code__istartswith=compact)
                | Q(postal_code__istartswith=f"{compact[:3]} {compact[3:]}"),
            )
            .exclude(postal_code__isnull=True)
            .exclude(postal_code__exact="")
            .values_list("postal_code", flat=True)[:400]
        )
        fsa_counts: dict[str, int] = {}
        full_counts: dict[str, int] = {}
        for pc in raw_rows:
            norm = _normalize_postal(pc)
            if len(norm) >= 3:
                fsa_counts[norm[:3]] = fsa_counts.get(norm[:3], 0) + 1
                if len(norm) == 6:
                    display = f"{norm[:3]} {norm[3:]}"
                    full_counts[display] = full_counts.get(display, 0) + 1

        results: list[dict] = []
        for fsa, count in sorted(fsa_counts.items(), key=lambda kv: -kv[1])[:limit]:
            results.append({
                "type": "postal",
                "label": f"{fsa} (FSA)",
                "value": fsa,
                "count": count,
            })
        if len(compact) >= 6:
            for full, count in sorted(full_counts.items(), key=lambda kv: -kv[1])[:limit]:
                results.append({
                    "type": "postal",
                    "label": full,
                    "value": full,
                    "count": count,
                })
        return results[:limit]

    def _suggest_addresses(self, raw_q: str, limit: int) -> list[dict]:
        rows = (
            Property.objects.filter(
                Q(unparsed_address__icontains=raw_q) | Q(street_name__icontains=raw_q)
            )
            .exclude(unparsed_address__isnull=True)
            .exclude(unparsed_address__exact="")
            .values("listing_key", "unparsed_address", "city")[:limit]
        )
        results: list[dict] = []
        for row in rows:
            address = (row.get("unparsed_address") or "").strip()
            if not address:
                continue
            label = f"{address}, {row['city']}" if row.get("city") else address
            results.append({
                "type": "address",
                "label": label,
                "value": address,
                "listing_key": row["listing_key"],
                "city": row.get("city") or "",
            })
        return results

    def _suggest_listings(self, raw_q: str, limit: int) -> list[dict]:
        # Only match exact-ish listing_key / listing_id so the dropdown
        # does not fill up with substring matches on random address rows.
        if not re.match(r"^[A-Za-z0-9_-]+$", raw_q):
            return []
        rows = Property.objects.filter(
            Q(listing_key__iexact=raw_q)
            | Q(listing_key__istartswith=raw_q)
            | Q(listing_id__iexact=raw_q)
            | Q(listing_id__istartswith=raw_q)
        ).values("listing_key", "listing_id", "unparsed_address")[:limit]
        results: list[dict] = []
        for row in rows:
            listing_key = row.get("listing_key") or ""
            label = row.get("listing_id") or listing_key
            if row.get("unparsed_address"):
                label = f"{label} - {row['unparsed_address']}"
            results.append({
                "type": "listing",
                "label": label,
                "value": listing_key,
                "listing_key": listing_key,
            })
        return results

    def _fuzzy_correct_city(self, q_norm: str) -> str | None:
        if not q_norm:
            return None
        # 600 is the same cap used by _candidate_cities in query_helpers so
        # correction behavior stays consistent with the filter pipeline.
        cities = [
            row["city"]
            for row in Property.objects.exclude(city__isnull=True)
            .exclude(city__exact="")
            .values("city")
            .distinct()[:600]
            if row.get("city")
        ]
        norm_to_city: dict[str, str] = {}
        for c in cities:
            key = _normalize_text(c)
            if key and key not in norm_to_city:
                norm_to_city[key] = c
        matches = get_close_matches(q_norm, list(norm_to_city.keys()), n=1, cutoff=FUZZY_CUTOFF)
        if not matches:
            return None
        return matches[0]
