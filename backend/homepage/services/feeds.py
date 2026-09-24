"""Feed builders behind the homepage endpoints.

Each function turns a data source (the local catalogue, AMPRE, or a derived
table) into the JSON a section renders, and caches it: the homepage is ISR on
the frontend, so these run a few times an hour, not per visitor.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable

from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone

from mls.models import Media, Property
from mls.services.ampre_client import AmpreClientError
from mls.views_market import GTA_CITIES

from . import ampre
from .common import base_city, to_float
from .deals import rank_price_drops
from .market_snapshot import build_snapshot
from .rent_estimates import CALC_BASIS, RentalComp, rank_candidates

logger = logging.getLogger(__name__)

INVESTOR_TTL = 60 * 60
DEALS_TTL = 30 * 60
SNAPSHOT_MAX_AGE = 6 * 60 * 60
INVESTOR_CANDIDATE_POOL = 600
# 6+ bedroom listings are mostly rooming houses and multiplexes whose few
# rental comps are whole-building rents; they swamp the ranking with yields
# a typical investor can't reproduce, so the feed sticks to 1–5 bedrooms.
INVESTOR_MAX_BEDROOMS = 5
RESIDENTIAL_SUB_TYPES = ("Single Family", "Multi-family")


class FeedUnavailable(RuntimeError):
    """Upstream (AMPRE) failed and there is no cached copy to fall back on."""


def _cached(key: str, ttl: int, build):
    value = cache.get(key)
    if value is None:
        value = build()
        cache.set(key, value, ttl)
    return value


def _gta_q() -> Q:
    q = Q()
    for city in GTA_CITIES:
        q |= Q(city__istartswith=city)
    return q


def _photos(listing_keys: Iterable[str]) -> dict[str, str]:
    """First preferred-or-lowest-order photo per listing, in one query."""
    photos: dict[str, str] = {}
    rows = (
        Media.objects.filter(property__listing_key__in=list(listing_keys))
        .order_by("property__listing_key", "-is_preferred", "order")
        .values_list("property__listing_key", "media_url")
    )
    for key, url in rows:
        photos.setdefault(key, url)
    return photos


def _local_by_mls(mls_numbers: Iterable[str]) -> dict[str, str]:
    """AMPRE ListingKey → local listing_key. TRREB listings in the DDF feed
    carry the TRREB number in ``listing_id``, which is how they're matched."""
    return dict(
        Property.objects.filter(listing_id__in=list(mls_numbers)).values_list("listing_id", "listing_key")
    )


# --------------------------------------------------------------------------
# High return properties
# --------------------------------------------------------------------------


def investor_picks(limit: int = 3, city: str | None = None) -> dict[str, Any]:
    def build() -> dict[str, Any]:
        base = Property.objects.filter(standard_status__iexact="active").filter(_gta_q())
        # Rentals: a monthly rent and no sale price (how DDF carries leases).
        comps = [
            RentalComp(city=c or "", bedrooms=b, monthly_rent=float(r))
            for c, b, r in base.filter(total_actual_rent__gt=0, list_price__isnull=True)
            .values_list("city", "bedrooms_total", "total_actual_rent")
        ]
        sales = base.filter(
            list_price__gt=0,
            bedrooms_total__gt=0,
            bedrooms_total__lte=INVESTOR_MAX_BEDROOMS,
            property_sub_type__in=RESIDENTIAL_SUB_TYPES,
        )
        if city:
            sales = sales.filter(city__istartswith=city)
        candidates = [
            {
                "listing_key": row["listing_key"],
                "address": row["unparsed_address"] or "",
                "city": row["city"] or "",
                "bedrooms": row["bedrooms_total"],
                "bathrooms": row["bathrooms_total_integer"],
                "price": row["list_price"],
                "annual_tax": row["tax_annual_amount"],
                "condo_fee": row["association_fee"],
                "condo_fee_frequency": row["association_fee_frequency"],
            }
            for row in sales.order_by("-original_entry_timestamp").values(
                "listing_key", "unparsed_address", "city", "bedrooms_total",
                "bathrooms_total_integer", "list_price", "tax_annual_amount",
                "association_fee", "association_fee_frequency",
            )[:INVESTOR_CANDIDATE_POOL]
        ]
        ranked = rank_candidates(candidates, comps, limit)
        photos = _photos(r["listing_key"] for r in ranked)
        return {
            "results": [
                {
                    "listing_key": r["listing_key"],
                    "address": r["address"],
                    "city": base_city(r["city"]),
                    "bedrooms": r["bedrooms"],
                    "bathrooms": r["bathrooms"],
                    "list_price": to_float(r["price"]),
                    "image_url": photos.get(r["listing_key"]),
                    "estimated_monthly_rent": r["metrics"].estimated_monthly_rent,
                    "gross_yield_pct": r["metrics"].gross_yield_pct,
                    "cap_rate_pct": r["metrics"].cap_rate_pct,
                    "comps_used": r["metrics"].comps_used,
                }
                for r in ranked
            ],
            "calc_basis": CALC_BASIS,
            "generated_at": timezone.now().isoformat(),
        }

    return _cached(f"home:investor:{limit}:{(city or '').lower()}", INVESTOR_TTL, build)


# --------------------------------------------------------------------------
# GTA market deals
# --------------------------------------------------------------------------


def market_deals(limit: int = 4) -> dict[str, Any]:
    def build() -> dict[str, Any]:
        try:
            rows = ampre.fetch_price_drops()
        except AmpreClientError as exc:
            raise FeedUnavailable(str(exc)) from exc
        deals = rank_price_drops(rows, limit)
        local = _local_by_mls(d.mls_number for d in deals)
        photos = _photos(local.values())
        results = []
        for deal in deals:
            key = local.get(deal.mls_number)
            results.append({**deal.as_dict(), "listing_key": key, "image_url": photos.get(key) if key else None})
        return {"results": results, "generated_at": timezone.now().isoformat()}

    return _cached(f"home:deals:{limit}", DEALS_TTL, build)


# --------------------------------------------------------------------------
# Sold below last purchase (reads the table the nightly job fills)
# --------------------------------------------------------------------------


def sold_below_purchase(limit: int = 3, city: str | None = None) -> dict[str, Any]:
    from homepage.models import SoldBelowPurchase

    qs = SoldBelowPurchase.objects.all()
    if city:
        qs = qs.filter(city__iexact=city)
    rows = list(qs.order_by("-close_date")[:limit])
    return {
        "results": [
            {
                "listing_key": row.listing_key,
                "address": row.address,
                "city": row.city,
                "property_sub_type": row.property_sub_type,
                "bedrooms": row.bedrooms,
                "bathrooms": row.bathrooms,
                "close_price": float(row.close_price),
                "close_date": row.close_date.isoformat(),
                "previous_close_price": float(row.previous_close_price),
                "previous_close_date": row.previous_close_date.isoformat(),
                "loss_amount": float(row.loss_amount),
            }
            for row in rows
        ],
        "computed_at": rows[0].computed_at.isoformat() if rows else None,
    }


# --------------------------------------------------------------------------
# Market snapshot (row kept fresh by a job; recomputed on demand if stale)
# --------------------------------------------------------------------------


def refresh_market_snapshot(scope: str = "gta"):
    from homepage.models import MarketSnapshot

    rows: list[dict[str, Any]] = []
    for city in GTA_CITIES:
        rows.extend(ampre.fetch_closed_sales(city, days=62, max_rows=20000))
    active = Property.objects.filter(standard_status__iexact="active", list_price__gt=0).filter(_gta_q()).count()
    payload = build_snapshot(rows, timezone.now().date(), active)
    snapshot, _ = MarketSnapshot.objects.update_or_create(
        scope=scope, defaults={"payload": payload, "as_of": timezone.now()}
    )
    return snapshot


def market_snapshot(scope: str = "gta") -> dict[str, Any]:
    """Serve the stored snapshot; the ``refresh_market_snapshot`` job keeps it
    fresh. Aggregating 13 cities of AMPRE sales takes tens of seconds, so a
    visitor's request only computes it when no snapshot exists at all — a
    stale one is served with ``stale: true`` instead of blocking the page."""
    from homepage.models import MarketSnapshot

    snapshot = MarketSnapshot.objects.filter(scope=scope).first()
    if snapshot is None:
        try:
            snapshot = refresh_market_snapshot(scope)
        except AmpreClientError as exc:
            raise FeedUnavailable(str(exc)) from exc
    age = (timezone.now() - snapshot.as_of).total_seconds()
    return {**snapshot.payload, "scope": scope, "as_of": snapshot.as_of.isoformat(), "stale": age > SNAPSHOT_MAX_AGE}
