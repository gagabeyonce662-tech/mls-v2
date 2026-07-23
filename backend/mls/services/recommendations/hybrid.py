from __future__ import annotations

import os
from collections import defaultdict
from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable

from django.db.models import Count, Q
from django.utils import timezone

from mls.models import ListingViewEvent, Property, UserFavorite, UserHistory, UserPropertyInteraction, UserToured


def _to_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _is_rental(property: Property) -> bool:
    return bool(property.lease_amount or property.total_actual_rent)


def _comparison_price(property: Property):
    """Use monthly/lease price for rentals and list price for sale listings."""
    if _is_rental(property):
        return _to_float(property.lease_amount or property.total_actual_rent)
    return _to_float(property.list_price)


@dataclass
class _Weights:
    content: float = float(os.environ.get("REC_WEIGHT_CONTENT", "0.55"))
    personal: float = float(os.environ.get("REC_WEIGHT_PERSONAL", "0.30"))
    collaborative: float = float(os.environ.get("REC_WEIGHT_COLLAB", "0.10"))
    freshness: float = float(os.environ.get("REC_WEIGHT_FRESHNESS", "0.05"))


def _score_content(target: Property, candidate: Property) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []
    if target.city and candidate.city and target.city.lower() == candidate.city.lower():
        score += 0.35
        reasons.append("same_city")
    if (
        target.property_sub_type
        and candidate.property_sub_type
        and target.property_sub_type.lower() == candidate.property_sub_type.lower()
    ):
        score += 0.30
        reasons.append("same_type")
    target_price = _comparison_price(target)
    candidate_price = _comparison_price(candidate)
    if target_price and candidate_price:
        delta = abs(candidate_price - target_price) / max(target_price, 1)
        if delta <= 0.10:
            score += 0.25
            reasons.append("similar_rent" if _is_rental(target) else "similar_price")
        elif delta <= 0.25:
            score += 0.15
            reasons.append("close_rent" if _is_rental(target) else "close_price")
        elif delta <= 0.40:
            score += 0.08
    target_beds = _to_int(target.bedrooms_total)
    candidate_beds = _to_int(candidate.bedrooms_total)
    if target_beds is not None and candidate_beds is not None:
        if target_beds == candidate_beds:
            score += 0.10
            reasons.append("same_beds")
        elif abs(target_beds - candidate_beds) == 1:
            score += 0.05
    target_baths = _to_int(target.bathrooms_total_integer)
    candidate_baths = _to_int(candidate.bathrooms_total_integer)
    if target_baths is not None and candidate_baths is not None:
        if target_baths == candidate_baths:
            score += 0.08
            reasons.append("same_baths")
        elif abs(target_baths - candidate_baths) == 1:
            score += 0.04
    return min(score, 1.0), reasons


def _score_freshness(candidate: Property) -> float:
    ts = candidate.modification_timestamp
    if ts is None:
        return 0.0
    age_days = (timezone.now() - ts).days
    if age_days <= 3:
        return 1.0
    if age_days <= 7:
        return 0.7
    if age_days <= 14:
        return 0.45
    if age_days <= 30:
        return 0.2
    return 0.0


def _get_user_listing_keys(user) -> set[str]:
    if not user or not user.is_authenticated:
        return set()
    keys = set(UserHistory.objects.filter(user=user).values_list("property_key", flat=True)[:120])
    keys.update(UserFavorite.objects.filter(user=user).values_list("property_key", flat=True)[:120])
    keys.update(UserToured.objects.filter(user=user).values_list("property_key", flat=True)[:120])
    keys.update(
        UserPropertyInteraction.objects.filter(user=user).values_list("listing_key", flat=True)[:200]
    )
    return {str(k) for k in keys if k}


def _get_collaborative_keys(seed_keys: Iterable[str], limit: int = 60) -> list[str]:
    seed_keys = [str(k) for k in seed_keys if k]
    if not seed_keys:
        return []
    recent = timezone.now() - timedelta(days=45)
    sessions = list(
        ListingViewEvent.objects.filter(listing_key__in=seed_keys, created_at__gte=recent)
        .values_list("session_key", flat=True)
        .distinct()[:1500]
    )
    if not sessions:
        return []
    rows = (
        ListingViewEvent.objects.filter(session_key__in=sessions, created_at__gte=recent)
        .exclude(listing_key__in=seed_keys)
        .values("listing_key")
        .annotate(c=Count("id"))
        .order_by("-c")[:limit]
    )
    return [str(row["listing_key"]) for row in rows if row.get("listing_key")]


def _diversify(sorted_rows: list[dict], per_city_cap: int = 4) -> list[dict]:
    kept: list[dict] = []
    city_count = defaultdict(int)
    for row in sorted_rows:
        city = (row["property"].city or "").lower()
        if city and city_count[city] >= per_city_cap:
            continue
        kept.append(row)
        if city:
            city_count[city] += 1
    return kept


def build_recommendation_payload(
    *,
    target_property: Property,
    user,
    session_key: str,
    limit_per_section: int = 6,
) -> dict:
    weights = _Weights()
    enable_personal = os.environ.get("REC_ENABLE_PERSONAL", "1") != "0"
    enable_collab = os.environ.get("REC_ENABLE_COLLAB", "1") != "0"
    user_keys = _get_user_listing_keys(user)
    seed_keys = user_keys or ({target_property.listing_key} if target_property.listing_key else set())
    collaborative_keys = _get_collaborative_keys(seed_keys) if enable_collab else []
    collaborative_set = set(collaborative_keys)

    candidates_qs = (
        Property.objects.filter(standard_status__iexact="Active")
        .exclude(listing_key=target_property.listing_key)
        .exclude(listing_key__isnull=True)
    )
    if _is_rental(target_property):
        candidates_qs = candidates_qs.filter(
            Q(lease_amount__isnull=False) | Q(total_actual_rent__isnull=False)
        )
    else:
        candidates_qs = candidates_qs.filter(
            lease_amount__isnull=True,
            total_actual_rent__isnull=True,
        )

    broad_candidates_qs = candidates_qs
    if target_property.city:
        candidates_qs = candidates_qs.filter(
            Q(city__iexact=target_property.city) | Q(city_region__iexact=target_property.city_region or "")
        )
    base_price = _comparison_price(target_property)
    if base_price:
        if _is_rental(target_property):
            candidates_qs = candidates_qs.filter(
                Q(lease_amount__gte=base_price * 0.55, lease_amount__lte=base_price * 1.65)
                | Q(
                    total_actual_rent__gte=base_price * 0.55,
                    total_actual_rent__lte=base_price * 1.65,
                )
            )
        else:
            candidates_qs = candidates_qs.filter(
                list_price__gte=base_price * 0.55,
                list_price__lte=base_price * 1.65,
            )
    candidates = list(candidates_qs.order_by("-modification_timestamp")[:220])

    # Sparse markets should still have useful suggestions. Relax city/price only
    # after preserving transaction type, and never mix rentals with sales.
    if len(candidates) < limit_per_section:
        existing_keys = [candidate.listing_key for candidate in candidates]
        candidates.extend(
            list(
                broad_candidates_qs.exclude(listing_key__in=existing_keys)
                .order_by("-modification_timestamp")[: 220 - len(candidates)]
            )
        )

    ranked: list[dict] = []
    for candidate in candidates:
        content_score, reasons = _score_content(target_property, candidate)
        personal_score = 1.0 if enable_personal and candidate.listing_key in user_keys else 0.0
        collab_score = 1.0 if enable_collab and candidate.listing_key in collaborative_set else 0.0
        fresh_score = _score_freshness(candidate)
        total = (
            weights.content * content_score
            + weights.personal * personal_score
            + weights.collaborative * collab_score
            + weights.freshness * fresh_score
        )
        why = list(reasons)
        if personal_score > 0:
            why.append("matches_your_history")
        if collab_score > 0:
            why.append("also_viewed")
        ranked.append(
            {
                "property": candidate,
                "score": round(total, 4),
                "content_score": round(content_score, 4),
                "personal_score": round(personal_score, 4),
                "collab_score": round(collab_score, 4),
                "freshness_score": round(fresh_score, 4),
                "why": why[:3],
            }
        )

    ranked.sort(key=lambda row: row["score"], reverse=True)
    ranked = _diversify(ranked)

    def _section(rows: list[dict], predicate):
        out = []
        for row in rows:
            if predicate(row):
                out.append(row)
            if len(out) >= limit_per_section:
                break
        return out

    for_this_home = _section(ranked, lambda row: row["content_score"] >= 0.45)
    based_on_history = (
        _section(
            ranked,
            lambda row: row["personal_score"] > 0 or "matches_your_history" in row["why"],
        )
        if enable_personal
        else []
    )
    people_also_viewed = (
        _section(
            ranked,
            lambda row: row["collab_score"] > 0 or "also_viewed" in row["why"],
        )
        if enable_collab
        else []
    )

    seen_keys = {row["property"].listing_key for row in for_this_home + based_on_history + people_also_viewed}
    fallback_rows = [row for row in ranked if row["property"].listing_key not in seen_keys][:limit_per_section]

    confidence = {
        "for_this_home": "high" if len(for_this_home) >= 3 else "medium" if for_this_home else "low",
        "based_on_your_history": "high" if len(based_on_history) >= 3 else "medium" if based_on_history else "low",
        "people_also_viewed": "high" if len(people_also_viewed) >= 3 else "medium" if people_also_viewed else "low",
    }

    return {
        "sections": {
            "for_this_home": for_this_home,
            "based_on_your_history": based_on_history,
            "people_also_viewed": people_also_viewed,
        },
        "fallback": {
            "applied": len(for_this_home) == 0 or len(based_on_history) == 0,
            "rows": fallback_rows,
        },
        "metadata": {
            "weights": {
                "content": weights.content,
                "personal": weights.personal,
                "collaborative": weights.collaborative,
                "freshness": weights.freshness,
            },
            "candidate_count": len(candidates),
            "feature_flags": {
                "enable_personal": enable_personal,
                "enable_collaborative": enable_collab,
            },
            "section_sizes": {
                "for_this_home": len(for_this_home),
                "based_on_your_history": len(based_on_history),
                "people_also_viewed": len(people_also_viewed),
                "fallback": len(fallback_rows),
            },
            "session_key": session_key or "",
            "generated_at": timezone.now(),
            "confidence": confidence,
        },
    }
