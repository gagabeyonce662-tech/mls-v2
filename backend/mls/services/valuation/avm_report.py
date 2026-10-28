"""Per-property rows for the AVM report table (scope #10).

The client asked for the home evaluation "in the AVM report format": a
subject column beside comparable sales, row by row. Every value comes from the
listing record; anything the feed does not carry is None and renders as a
dash. Renovation year/type and rental-items-under-contract have no dedicated
MLS column yet, so those keys stay None.
"""
from __future__ import annotations

import re
from decimal import Decimal
from typing import Any, Optional

from django.utils import timezone

from mls.models import Property
from mls.services.valuation.lot_dims import infer_lot_depth

FEET_PER_METRE = 3.28084


def _num(value: Any) -> Optional[float]:
    if value in (None, ""):
        return None
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def _text(value: Any) -> Optional[str]:
    text = (value or "").strip() if isinstance(value, str) else value
    return text or None


def _yes_no(value: Optional[str]) -> Optional[bool]:
    """'None'/'No' → False, any description → True, blank → unknown (None).

    Blank is unknown rather than "no": DDF leaves the field empty both when
    there is none and when the agent skipped it.
    """
    text = (value or "").strip().lower()
    if not text:
        return None
    return text not in {"none", "no", "n", "n/a"}


def _feet(value: Optional[Decimal], units: Optional[str]) -> Optional[float]:
    number = _num(value)
    if number is None:
        return None
    if (units or "").strip().lower().startswith("met"):
        number = round(number * FEET_PER_METRE, 2)
    return number


def _garage_type(parking_features: Optional[str]) -> Optional[str]:
    """Best-effort garage type from free-text parking features."""
    text = (parking_features or "").strip()
    if not text:
        return None
    lower = text.lower()
    if "none" in lower or lower in {"no", "n/a"} or "no garage" in lower:
        return "None"
    if "attached" in lower:
        return "Attached garage"
    if "detached" in lower:
        return "Detached garage"
    if "garage" in lower:
        return text
    return text


def _garage_spaces(parking_features: Optional[str]) -> Optional[int]:
    """Infer garage stall count from free-text parking features when possible."""
    text = (parking_features or "").strip().lower()
    if not text:
        return None
    if "no garage" in text or text in {"none", "no", "n/a"}:
        return 0
    if "garage" not in text:
        return None
    for pattern, count in (
        (r"\btriple\b|\b3[\s-]?car\b|\bthree[\s-]?car\b", 3),
        (r"\bdouble\b|\b2[\s-]?car\b|\btwo[\s-]?car\b", 2),
        (r"\bsingle\b|\b1[\s-]?car\b|\bone[\s-]?car\b", 1),
    ):
        if re.search(pattern, text):
            return count
    # Attached/Detached Garage with no count usually means one stall.
    return 1


def _has_locker(*blobs: Optional[str]) -> Optional[bool]:
    joined = " ".join(b for b in blobs if b).lower()
    if not joined.strip():
        return None
    return "locker" in joined


def _basement_finish(basement: Optional[str], finished_sqft: Optional[float]) -> Optional[str]:
    """Finished / unfinished / partial, from basement text or finished sq ft."""
    text = (basement or "").strip()
    lower = text.lower()
    if "unfinished" in lower and "finished" in lower:
        return text or "Partial"
    if "part" in lower and "finish" in lower:
        return text or "Partial"
    if "unfinished" in lower:
        return "Unfinished"
    if "finished" in lower:
        return "Finished"
    if finished_sqft is not None and finished_sqft > 0:
        return "Finished" if not text else f"Finished ({text})"
    return text or None


def _days_on_market(prop: Property) -> Optional[int]:
    if not prop.original_entry_timestamp:
        return None
    start = prop.original_entry_timestamp.date()
    if prop.close_date:
        end = prop.close_date
    else:
        end = timezone.now().date()
    days = (end - start).days
    return days if days >= 0 else None


def _room_signals(prop: Property) -> tuple[Optional[bool], Optional[int], Optional[str]]:
    """Family-room flag, kitchen count, and a condo-style level hint from rooms."""
    rooms = list(prop.rooms.all().only("room_type", "room_level"))
    if not rooms:
        return None, None, None
    family = any("family" in (r.room_type or "").lower() for r in rooms)
    kitchens = sum(1 for r in rooms if "kitchen" in (r.room_type or "").lower())
    # Numeric / "Flat" / "Level 12" style levels only — skip Main/Second/Basement.
    level: Optional[str] = None
    for room in rooms:
        raw = (room.room_level or "").strip()
        if not raw:
            continue
        lower = raw.lower()
        if any(token in lower for token in ("main", "second", "third", "fourth", "basement", "lower", "ground", "upper", "sub-")):
            continue
        level = raw
        break
    return family, kitchens or None, level


def _potl_and_maintenance(
    prop: Property, fee: Optional[float]
) -> tuple[Optional[float], Optional[float]]:
    """Split association fee into POTL vs condo maintenance when we can tell."""
    if fee is None:
        return None, None
    interest = (prop.common_interest or "").lower()
    remarks = (prop.public_remarks or "").lower()
    includes = (prop.association_fee_includes or "").lower()
    is_potl = "potl" in remarks or "potl" in includes or (
        "freehold" in interest and "condo" not in interest and "strata" not in interest
    )
    is_condo = "condo" in interest or "strata" in interest
    if is_potl and not is_condo:
        return fee, None
    if is_condo:
        return None, fee
    # Unknown tenure with a fee: surface under maintenance (the common case).
    return None, fee


def property_details(prop: Optional[Property]) -> dict[str, Any]:
    """AVM table values for one listing. All keys always present."""
    if prop is None:
        return {key: None for key in DETAIL_KEYS}
    depth = infer_lot_depth(prop.lot_size_dimensions, prop.lot_size_area, prop.frontage_length_numeric)
    parking_features = _text(prop.parking_features)
    building_features = _text(prop.building_features)
    fee = _num(prop.association_fee)
    potl_fee, maintenance_fee = _potl_and_maintenance(prop, fee)
    finished_sqft = _num(prop.below_grade_finished_area)
    family_room, kitchens, level = _room_signals(prop)
    return {
        "roll_number": _text(prop.parcel_number),
        "address": _text(prop.unparsed_address),
        "city": _text(prop.city),
        "community": _text(prop.city_region) or _text(prop.subdivision_name),
        "province": _text(prop.state_or_province),
        "postal_code": _text(prop.postal_code),
        "level": level,
        "unit_number": _text(prop.unit_number),
        "locker": _has_locker(building_features, parking_features),
        "potl_monthly_fees": potl_fee,
        "maintenance": maintenance_fee,
        "maintenance_includes": _text(prop.association_fee_includes),
        "property_style": _text(prop.architectural_style) or _text(prop.property_sub_type),
        "property_type": _text(prop.structure_type) or _text(prop.property_sub_type),
        "frontage_ft": _feet(prop.frontage_length_numeric, prop.frontage_length_numeric_units),
        "depth_ft": _feet(depth, prop.frontage_length_numeric_units) if depth is not None else None,
        "lot_area": _num(prop.lot_size_area),
        "lot_area_units": _text(prop.lot_size_units),
        "list_price": _num(prop.list_price),
        "last_sold_price": _num(prop.close_price),
        "tax_annual_amount": _num(prop.tax_annual_amount),
        "days_on_market": _days_on_market(prop),
        "year_built": prop.year_built,
        "floor_area_sqft": _num(prop.living_area) or _num(prop.above_grade_finished_area),
        "above_grade_sqft": _num(prop.above_grade_finished_area),
        "basement": _basement_finish(_text(prop.basement), finished_sqft),
        # Feed has finished below-grade area only; total basement area is unknown.
        "basement_total_sqft": None,
        "basement_finished_sqft": finished_sqft,
        "storeys": prop.stories,
        "structure_condition": _text(prop.property_condition),
        "bedrooms": prop.bedrooms_total,
        "bedrooms_below_grade": prop.bedrooms_below_grade,
        "bathrooms_full": prop.bathrooms_total_integer,
        "bathrooms_half": prop.bathrooms_partial,
        "family_room": family_room,
        "kitchens": kitchens,
        "rental_items": None,
        "fireplaces": prop.fireplaces_total,
        "renovation_year": None,
        "renovation_type": None,
        "heating": _text(prop.heating),
        "air_conditioning": _yes_no(prop.cooling),
        "pool": _yes_no(prop.pool_features),
        "garage_type": _garage_type(parking_features),
        "garage_area": None,
        "garage_spaces": _garage_spaces(parking_features),
        "parking_total": prop.parking_total,
        "parking_features": parking_features,
    }


DETAIL_KEYS = (
    "roll_number",
    "address", "city", "community", "province", "postal_code",
    "level", "unit_number", "locker",
    "potl_monthly_fees", "maintenance", "maintenance_includes",
    "property_style", "property_type",
    "frontage_ft", "depth_ft", "lot_area", "lot_area_units",
    "list_price", "last_sold_price", "tax_annual_amount", "days_on_market",
    "year_built", "floor_area_sqft", "above_grade_sqft",
    "basement", "basement_total_sqft", "basement_finished_sqft", "storeys", "structure_condition",
    "bedrooms", "bedrooms_below_grade", "bathrooms_full", "bathrooms_half",
    "family_room", "kitchens", "rental_items",
    "fireplaces", "renovation_year", "renovation_type", "heating", "air_conditioning", "pool",
    "garage_type", "garage_area", "garage_spaces", "parking_total", "parking_features",
)


def subject_details(prop: Optional[Property], subject: dict[str, Any]) -> dict[str, Any]:
    """The subject column: the looked-up listing, overridden by what the user entered."""
    details = property_details(prop)
    overrides = {
        "postal_code": subject.get("postal_code") or None,
        "property_type": subject.get("property_sub_type") or None,
        "bedrooms": subject.get("bedrooms_total"),
        "bedrooms_below_grade": subject.get("bedrooms_partial"),
        "bathrooms_full": subject.get("bathrooms_total"),
        "floor_area_sqft": subject.get("living_area"),
        "above_grade_sqft": subject.get("living_area"),
        "parking_total": subject.get("parking_total"),
        "tax_annual_amount": subject.get("tax_annual_amount"),
        "frontage_ft": subject.get("lot_frontage"),
        "depth_ft": subject.get("lot_depth"),
    }
    for key, value in overrides.items():
        if value not in (None, ""):
            details[key] = value
    if not details["property_style"] and details["property_type"]:
        details["property_style"] = details["property_type"]
    return details


def confidence_stars(confidence: Optional[str], comp_count: int) -> int:
    """0-5 stars for the report header, from the model's own confidence band.

    Bands come from hedonic.apply_hedonic (by comparable count); within a band
    more comparables earn the higher star, capped at 5.
    """
    band = (confidence or "").lower()
    if band == "high":
        return 5 if comp_count >= 8 else 4
    if band == "medium":
        return 3
    if band == "low":
        return 2 if comp_count >= 2 else 1
    return 0
