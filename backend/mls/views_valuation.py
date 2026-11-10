import json
from decimal import Decimal
from typing import Any, Dict, Optional

from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from mls.models import Property
from mls.services.valuation import (
    ai_cma,
    apply_hedonic,
    blend_with_prior_anchor,
    compute_trend,
    match_agent,
    parse_lot_depth_from_dimensions,
    prior_sale_anchor,
    pricing_comps,
    select_active_comps,
    select_comps,
)
from mls.services.valuation.avm_report import confidence_stars, property_details, subject_details
from mls.services.valuation.lot_dims import infer_lot_depth


def _fsa_from_postal(postal: Optional[str]) -> str:
    if not postal:
        return ""
    s = "".join(c for c in str(postal).upper() if c.isalnum())
    return s[:3] if len(s) >= 3 else ""


def _decimal_or_none(v: Any) -> Optional[Decimal]:
    if v is None or v == "":
        return None
    try:
        return Decimal(str(v))
    except Exception:
        return None


def _int_or_none(v: Any) -> Optional[int]:
    if v is None or v == "":
        return None
    try:
        return int(v)
    except Exception:
        return None


def _float_or_none(v: Any) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except Exception:
        return None


def _property_to_lookup_payload(p: Property) -> Dict[str, Any]:
    depth = infer_lot_depth(
        p.lot_size_dimensions,
        p.lot_size_area,
        p.frontage_length_numeric,
    )
    depth_alt = parse_lot_depth_from_dimensions(p.lot_size_dimensions)
    if depth is None and depth_alt is not None:
        depth = depth_alt
    return {
        "listing_key": p.listing_key,
        "unparsed_address": p.unparsed_address or "",
        "postal_code": p.postal_code or "",
        "city": p.city or "",
        "city_region": p.city_region or "",
        "latitude": float(p.latitude) if p.latitude is not None else None,
        "longitude": float(p.longitude) if p.longitude is not None else None,
        "bedrooms_total": p.bedrooms_total,
        "bedrooms_partial": p.bedrooms_below_grade,
        "bathrooms_total": p.bathrooms_total_integer,
        "bathrooms_partial": p.bathrooms_partial,
        "living_area": float(p.living_area) if p.living_area else None,
        "above_grade_finished_area": float(p.above_grade_finished_area) if p.above_grade_finished_area else None,
        "parking_total": p.parking_total,
        "tax_annual_amount": float(p.tax_annual_amount) if p.tax_annual_amount else None,
        "property_sub_type": p.property_sub_type or "",
        "lot_frontage": float(p.frontage_length_numeric) if p.frontage_length_numeric else None,
        "lot_depth": float(depth) if depth is not None else None,
        "lot_size_dimensions": p.lot_size_dimensions or "",
    }


class ValuationAutocompleteAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response({"results": []}, status=status.HTTP_200_OK)

        lim = 10
        qs = (
            Property.objects.filter(
                Q(unparsed_address__icontains=q)
                | Q(street_name__icontains=q)
                | Q(listing_key__icontains=q)
                | Q(listing_id__icontains=q)
            )
            .only(
                "listing_key",
                "unparsed_address",
                "city",
                "postal_code",
                "latitude",
                "longitude",
            )[:lim]
        )
        results = []
        for p in qs:
            fsa = _fsa_from_postal(p.postal_code)
            label = (p.unparsed_address or "").strip()
            if p.city:
                label = f"{label}, {p.city}" if label else str(p.city)
            results.append(
                {
                    "label": label or p.listing_key,
                    "listing_key": p.listing_key,
                    "latitude": float(p.latitude) if p.latitude is not None else None,
                    "longitude": float(p.longitude) if p.longitude is not None else None,
                    "fsa": fsa,
                }
            )
        return Response({"results": results}, status=status.HTTP_200_OK)


class ValuationLookupAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        listing_key = (request.query_params.get("listing_key") or "").strip()
        address = (request.query_params.get("address") or "").strip()

        p = None
        if listing_key:
            p = Property.objects.filter(listing_key=listing_key).first()
        elif address and len(address) >= 3:
            p = Property.objects.filter(unparsed_address__icontains=address).first()

        if not p:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(_property_to_lookup_payload(p), status=status.HTTP_200_OK)


class ValuationEstimateAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            body = request.data if isinstance(request.data, dict) else json.loads(request.body or "{}")
        except Exception:
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        listing_key = (body.get("listing_key") or "").strip() or None
        prop = (
            Property.objects.filter(listing_key=listing_key).prefetch_related("rooms").first()
            if listing_key
            else None
        )

        postal = body.get("postal_code") or (prop.postal_code if prop else "") or ""
        city = body.get("city") or (prop.city if prop else "") or ""
        city_region = body.get("city_region") or (prop.city_region if prop else "") or ""

        lat = _float_or_none(body.get("latitude"))
        lng = _float_or_none(body.get("longitude"))
        if lat is None and prop and prop.latitude is not None:
            lat = float(prop.latitude)
        if lng is None and prop and prop.longitude is not None:
            lng = float(prop.longitude)

        if lat is None or lng is None:
            return Response(
                {
                    "detail": "latitude and longitude are required for an estimate (lookup a listing first).",
                    "estimate": {
                        "low": 0,
                        "market": 0,
                        "high": 0,
                        "quick_sale_low": 0,
                        "quick_sale_high": 0,
                    },
                    "breakdown": [],
                    "trend": {
                        "pct_30d": 0.0,
                        "pct_90d": 0.0,
                        "pct_12m": 0.0,
                        "applied": 0.0,
                        "source": None,
                        "series": [],
                    },
                    "comps": [],
                    "agent": match_agent(_fsa_from_postal(postal), city, city_region),
                    "beta": True,
                    "sparse": True,
                    "ai": {
                        "suggested": None,
                        "weight": 0.0,
                        "rationale": None,
                        "adjustments": [],
                        "used": False,
                    },
                    "methodology": "hybrid_cma_v2",
                },
                status=status.HTTP_200_OK,
            )

        living = _decimal_or_none(body.get("living_area"))
        if living is None and prop and prop.living_area:
            living = prop.living_area
        if living is None and prop and prop.above_grade_finished_area:
            living = prop.above_grade_finished_area

        subject: Dict[str, Any] = {
            "latitude": lat,
            "longitude": lng,
            "postal_code": postal,
            "city": city,
            "city_region": city_region,
            "property_sub_type": body.get("property_sub_type") or (prop.property_sub_type if prop else "") or "",
            "bedrooms_total": _int_or_none(body.get("bedrooms_total")),
            "bedrooms_partial": _int_or_none(body.get("bedrooms_partial")),
            "bathrooms_total": _int_or_none(body.get("bathrooms_total")),
            "living_area": float(living) if living is not None else None,
            "parking_total": _int_or_none(body.get("parking_total")),
            "tax_annual_amount": _float_or_none(body.get("tax_annual_amount")),
            "lot_frontage": _float_or_none(body.get("lot_frontage")),
            "lot_depth": _float_or_none(body.get("lot_depth")),
            "year_built": _int_or_none(body.get("year_built")),
            "last_sold_price": _float_or_none(body.get("last_sold_price")),
            "last_sold_date": body.get("last_sold_date") or None,
        }

        if prop:
            if subject["bedrooms_total"] is None:
                subject["bedrooms_total"] = prop.bedrooms_total
            if subject["bedrooms_partial"] is None:
                subject["bedrooms_partial"] = prop.bedrooms_below_grade
            if subject["bathrooms_total"] is None:
                subject["bathrooms_total"] = prop.bathrooms_total_integer
            if subject["parking_total"] is None:
                subject["parking_total"] = prop.parking_total
            if subject["tax_annual_amount"] is None and prop.tax_annual_amount:
                subject["tax_annual_amount"] = float(prop.tax_annual_amount)
            if subject["lot_frontage"] is None and prop.frontage_length_numeric:
                subject["lot_frontage"] = float(prop.frontage_length_numeric)
            if subject["lot_depth"] is None:
                d = infer_lot_depth(
                    prop.lot_size_dimensions,
                    prop.lot_size_area,
                    prop.frontage_length_numeric,
                )
                if d is not None:
                    subject["lot_depth"] = float(d)
            if subject["year_built"] is None:
                subject["year_built"] = prop.year_built
            if subject["last_sold_price"] is None and prop.close_price:
                subject["last_sold_price"] = float(prop.close_price)
            if not subject["last_sold_date"] and prop.close_date:
                subject["last_sold_date"] = prop.close_date.isoformat()

        comps = select_comps(subject)
        active_comps = select_active_comps(subject)
        hed_comps = pricing_comps(comps, active_comps)
        if not hed_comps:
            hed_comps = active_comps
        hed = apply_hedonic(subject, hed_comps or comps)

        fsa = _fsa_from_postal(postal)
        trend = compute_trend(fsa, city=city, community=city_region or None)
        mult = 1.0 + float(trend.get("applied") or 0)

        cma_point = float(hed["point"] or 0) * mult
        # Last-resort anchors when comps are empty: prior sale, then city
        # median sold from the trend series, then the subject's own list price.
        if cma_point <= 0:
            series = trend.get("series") or []
            medians = [
                float(p["median_sold_price"])
                for p in series
                if isinstance(p, dict) and p.get("median_sold_price")
            ]
            if medians:
                cma_point = medians[-1] * mult
            elif prop and prop.list_price:
                cma_point = float(prop.list_price)
            elif subject.get("last_sold_price"):
                cma_point = float(subject["last_sold_price"]) * mult

        anchor = prior_sale_anchor(subject, trend)
        cma_point = blend_with_prior_anchor(cma_point, anchor)

        sold_for_ai = [c for c in comps if c.get("source") == "sold"]
        ai = ai_cma.suggest(
            subject,
            sold_for_ai or comps or active_comps,
            active_comps,
            trend,
            cma_point,
        )
        point = ai_cma.blend(cma_point, ai)

        # Rebuild range around the blended market using hedonic band ratios.
        hed_point = float(hed["point"] or 0)
        if hed_point > 0 and float(hed.get("low") or 0) > 0:
            low_ratio = float(hed["low"]) / hed_point
            high_ratio = float(hed["high"]) / hed_point
            qsl_ratio = float(hed["quick_sale_low"]) / hed_point
            qsh_ratio = float(hed["quick_sale_high"]) / hed_point
        else:
            low_ratio, high_ratio, qsl_ratio, qsh_ratio = 0.88, 1.12, 0.85, 0.94
        low = point * low_ratio
        high = point * high_ratio
        qsl = point * qsl_ratio
        qsh = point * qsh_ratio

        agent = match_agent(fsa, city, city_region)

        sold_count = sum(1 for c in comps if c.get("source") == "sold")
        pricing_n = len(hed_comps or comps)
        # WOWA targets ≥5 sold comps for a solid CMA.
        sparse = (sold_count < 5 and pricing_n < 5) or point <= 0

        all_comp_rows = comps + [
            a for a in active_comps if a.get("listing_key") not in {c.get("listing_key") for c in comps}
        ]
        comp_props = {
            p.listing_key: p
            for p in Property.objects.filter(
                listing_key__in=[c.get("listing_key") for c in all_comp_rows if c.get("listing_key")]
            ).prefetch_related("rooms")
        }

        def _comp_out(c: Dict[str, Any]) -> Dict[str, Any]:
            details = property_details(comp_props.get(c.get("listing_key")))
            # Enrich from AMPRE/proxy fields when the local catalogue row is gone.
            if not details.get("address") and c.get("unparsed_address"):
                details["address"] = c.get("unparsed_address")
            if not details.get("city") and c.get("city"):
                details["city"] = c.get("city")
            if not details.get("community") and c.get("city_region"):
                details["community"] = c.get("city_region")
            if details.get("list_price") is None and c.get("list_price") is not None:
                details["list_price"] = c.get("list_price")
            if details.get("last_sold_price") is None and c.get("close_price") is not None:
                details["last_sold_price"] = c.get("close_price")
            if details.get("days_on_market") is None and c.get("days_on_market") is not None:
                details["days_on_market"] = c.get("days_on_market")
            if details.get("year_built") is None and c.get("year_built") is not None:
                details["year_built"] = c.get("year_built")
            if details.get("floor_area_sqft") is None and c.get("living_area") is not None:
                details["floor_area_sqft"] = c.get("living_area")
            return {
                "listing_key": c.get("listing_key"),
                "price": c.get("price"),
                "close_price": c.get("close_price"),
                "list_price": c.get("list_price"),
                "bedrooms_total": c.get("bedrooms_total"),
                "bathrooms_total_integer": c.get("bathrooms_total_integer"),
                "living_area": c.get("living_area"),
                "unparsed_address": c.get("unparsed_address") or "",
                "city": c.get("city") or "",
                "distance_km": c.get("distance_km"),
                "source": c.get("source"),
                "event_date": c.get("event_date"),
                "days_on_market": c.get("days_on_market"),
                "details": details,
            }

        comps_out = [_comp_out(c) for c in comps]
        active_out = [_comp_out(c) for c in active_comps]

        breakdown = list(hed.get("breakdown") or [])
        for adj in ai.get("adjustments") or []:
            breakdown.append(
                {
                    "feature": adj.get("feature"),
                    "delta": adj.get("delta"),
                    "source": "ai",
                    "note": adj.get("note"),
                }
            )

        user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
        if user and getattr(user, "email", None):
            from mls.services.lead_ghl import push_lead_to_ghl

            address = (prop.unparsed_address if prop else None) or body.get("address") or postal or city
            push_lead_to_ghl(
                email=user.email,
                first_name=getattr(user, "first_name", ""),
                last_name=getattr(user, "last_name", ""),
                phone=getattr(user, "phone", None),
                source="home-valuation",
                tags=["home-valuation"],
                note=(
                    "Home valuation requested\n"
                    f"Address: {address or '—'}\n"
                    f"City: {city or '—'}\n"
                    f"Estimate: {round(point, 2)}"
                ),
                user=user,
            )

        return Response(
            {
                "estimate": {
                    "low": round(low, 2),
                    "market": round(point, 2),
                    "high": round(high, 2),
                    "quick_sale_low": round(qsl, 2),
                    "quick_sale_high": round(qsh, 2),
                },
                "breakdown": breakdown,
                "trend": trend,
                "comps": comps_out,
                "active_comps": active_out,
                "agent": agent,
                "beta": True,
                "sparse": sparse,
                "confidence": hed.get("confidence"),
                "confidence_stars": confidence_stars(
                    hed.get("confidence"),
                    max(sold_count, len(hed_comps or comps)),
                ),
                "valuation_date": timezone.localdate().isoformat(),
                "subject_details": subject_details(prop, subject),
                "ai": {
                    "suggested": ai.get("suggested"),
                    "weight": ai.get("weight") or 0.0,
                    "rationale": ai.get("rationale"),
                    "adjustments": ai.get("adjustments") or [],
                    "used": bool(ai.get("used")),
                    "confidence": ai.get("confidence"),
                },
                "methodology": "hybrid_cma_v2",
                "cma_point": round(cma_point, 2),
                "prior_sale_anchor": anchor,
            },
            status=status.HTTP_200_OK,
        )
