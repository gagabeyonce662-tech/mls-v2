import json
from decimal import Decimal
from typing import Any, Dict, Optional

from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from mls.models import Property
from mls.services.valuation import (
    apply_hedonic,
    compute_trend,
    match_agent,
    parse_lot_depth_from_dimensions,
    select_comps,
)
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
        prop = Property.objects.filter(listing_key=listing_key).first() if listing_key else None

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
                    "trend": {"pct_30d": 0.0, "applied": 0.0},
                    "comps": [],
                    "agent": match_agent(_fsa_from_postal(postal), city, city_region),
                    "beta": True,
                    "sparse": True,
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
            "property_sub_type": body.get("property_sub_type") or (prop.property_sub_type if prop else "") or "",
            "bedrooms_total": _int_or_none(body.get("bedrooms_total")),
            "bedrooms_partial": _int_or_none(body.get("bedrooms_partial")),
            "bathrooms_total": _int_or_none(body.get("bathrooms_total")),
            "living_area": float(living) if living is not None else None,
            "parking_total": _int_or_none(body.get("parking_total")),
            "tax_annual_amount": _float_or_none(body.get("tax_annual_amount")),
            "lot_frontage": _float_or_none(body.get("lot_frontage")),
            "lot_depth": _float_or_none(body.get("lot_depth")),
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

        comps = select_comps(subject)
        hed = apply_hedonic(subject, comps)
        trend = compute_trend(postal or _fsa_from_postal(postal))
        mult = 1.0 + float(trend.get("applied") or 0)

        point = hed["point"] * mult
        low = hed["low"] * mult
        high = hed["high"] * mult
        qsl = hed["quick_sale_low"] * mult
        qsh = hed["quick_sale_high"] * mult

        fsa = _fsa_from_postal(postal)
        agent = match_agent(fsa, city, city_region)

        sparse = len(comps) < 3 or point <= 0

        comps_out = []
        for c in comps:
            comps_out.append(
                {
                    "listing_key": c.get("listing_key"),
                    "price": c.get("price"),
                    "bedrooms_total": c.get("bedrooms_total"),
                    "bathrooms_total_integer": c.get("bathrooms_total_integer"),
                    "living_area": c.get("living_area"),
                    "unparsed_address": c.get("unparsed_address") or "",
                    "city": c.get("city") or "",
                    "distance_km": c.get("distance_km"),
                    "source": c.get("source"),
                }
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
                "breakdown": hed.get("breakdown") or [],
                "trend": trend,
                "comps": comps_out,
                "agent": agent,
                "beta": True,
                "sparse": sparse,
                "confidence": hed.get("confidence"),
            },
            status=status.HTTP_200_OK,
        )
