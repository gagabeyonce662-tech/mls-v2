"""AI-assisted CMA adjustments blended with the deterministic hedonic point.

Never raises into the estimate endpoint: any failure returns ``used=False``.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from mls.services import openai_client

logger = logging.getLogger(__name__)

AI_WEIGHT = 0.35
CMA_WEIGHT = 0.65
AI_BAND_LOW = 0.75
AI_BAND_HIGH = 1.25
AI_TIMEOUT_SECONDS = 8
AI_MAX_TOKENS = 700


def _nullable(json_type: str, **extra: Any) -> dict[str, Any]:
    return {"type": [json_type, "null"], **extra}


CMA_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "suggested_market_value": {"type": "number"},
        "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
        "rationale": {"type": "string"},
        "adjustments": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "feature": {"type": "string"},
                    "delta": {"type": "number"},
                    "note": _nullable("string"),
                },
                "required": ["feature", "delta", "note"],
            },
        },
    },
    "required": ["suggested_market_value", "confidence", "rationale", "adjustments"],
}


SYSTEM_PROMPT = """You are a GTA residential CMA assistant.
Given a subject home, recent sold comparables (ClosePrice), active listings, a
deterministic CMA point estimate, and local sold-market trends, suggest a
market value and dollar adjustments for material differences.

Rules:
- Prices are CAD. suggested_market_value must stay within 75%–125% of the CMA point.
- Prefer sold ClosePrice comps over active list prices.
- Adjustments are additive CAD deltas (positive = subject worth more).
- Keep rationale to 1–3 short sentences. Do not invent renovations or features
  not present in the supplied data.
- If data is thin, lower confidence and stay close to the CMA point.
"""


def _compact_comp(c: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "address": c.get("unparsed_address") or c.get("address"),
        "price": c.get("price"),
        "close_price": c.get("close_price"),
        "list_price": c.get("list_price"),
        "beds": c.get("bedrooms_total"),
        "baths": c.get("bathrooms_total_integer"),
        "sqft": c.get("living_area"),
        "year_built": c.get("year_built"),
        "distance_km": c.get("distance_km"),
        "source": c.get("source"),
        "event_date": c.get("event_date"),
        "days_on_market": c.get("days_on_market"),
        "subtype": c.get("property_sub_type"),
    }


def _unused(reason: str = "") -> Dict[str, Any]:
    return {
        "suggested": None,
        "weight": 0.0,
        "rationale": reason or None,
        "adjustments": [],
        "used": False,
        "confidence": None,
    }


def suggest(
    subject: Dict[str, Any],
    sold_comps: List[Dict[str, Any]],
    active_comps: List[Dict[str, Any]],
    trend: Dict[str, Any],
    cma_point: float,
) -> Dict[str, Any]:
    """Return AI suggestion payload. Safe to call when OpenAI is not configured."""
    if cma_point <= 0:
        return _unused("no cma point")
    if not openai_client.is_configured():
        return _unused("ai not configured")

    payload = {
        "cma_point": round(cma_point, 2),
        "subject": {
            "beds": subject.get("bedrooms_total"),
            "baths": subject.get("bathrooms_total"),
            "sqft": subject.get("living_area"),
            "parking": subject.get("parking_total"),
            "subtype": subject.get("property_sub_type"),
            "lot_frontage": subject.get("lot_frontage"),
            "lot_depth": subject.get("lot_depth"),
            "year_built": subject.get("year_built"),
            "city": subject.get("city"),
            "postal_code": subject.get("postal_code"),
            "last_sold_price": subject.get("last_sold_price"),
            "last_sold_date": subject.get("last_sold_date"),
        },
        "trend": {
            "pct_30d": trend.get("pct_30d"),
            "pct_90d": trend.get("pct_90d"),
            "pct_12m": trend.get("pct_12m"),
            "applied": trend.get("applied"),
            "source": trend.get("source"),
        },
        "sold_comps": [_compact_comp(c) for c in sold_comps[:8]],
        "active_comps": [_compact_comp(c) for c in active_comps[:5]],
    }

    try:
        result = openai_client.chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, default=str)},
            ],
            model=openai_client.search_model(),
            json_schema=CMA_SCHEMA,
            schema_name="hybrid_cma_suggestion",
            max_tokens=AI_MAX_TOKENS,
            timeout=AI_TIMEOUT_SECONDS,
        )
        parsed = json.loads(result.content)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI CMA suggestion failed: %s", exc)
        return _unused(str(exc)[:200])

    try:
        suggested = float(parsed.get("suggested_market_value") or 0)
    except (TypeError, ValueError):
        return _unused("invalid suggested value")

    low = cma_point * AI_BAND_LOW
    high = cma_point * AI_BAND_HIGH
    if suggested <= 0 or suggested < low or suggested > high:
        return _unused("suggested value outside allowed band")

    adjustments_raw = parsed.get("adjustments") or []
    adjustments: List[Dict[str, Any]] = []
    for item in adjustments_raw:
        if not isinstance(item, dict):
            continue
        feature = (item.get("feature") or "").strip()
        if not feature:
            continue
        try:
            delta = float(item.get("delta") or 0)
        except (TypeError, ValueError):
            continue
        adjustments.append(
            {
                "feature": feature,
                "delta": round(delta, 2),
                "note": (item.get("note") or None),
                "source": "ai",
            }
        )

    return {
        "suggested": round(suggested, 2),
        "weight": AI_WEIGHT,
        "rationale": (parsed.get("rationale") or "").strip()[:500] or None,
        "adjustments": adjustments,
        "used": True,
        "confidence": parsed.get("confidence"),
    }


def blend(cma_point: float, ai: Dict[str, Any]) -> float:
    """65% CMA / 35% AI when AI was used; else CMA only."""
    if not ai.get("used") or not ai.get("suggested"):
        return cma_point
    return CMA_WEIGHT * cma_point + AI_WEIGHT * float(ai["suggested"])
