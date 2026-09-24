"""Helpers shared by the homepage feeds."""

from __future__ import annotations

import re
import statistics
from decimal import Decimal
from typing import Iterable

_PARENTHETICAL = re.compile(r"\s*\(.*\)\s*$")
# AMPRE codes Toronto by district ("Toronto C08", "Toronto W05").
_TORONTO_DISTRICT = re.compile(r"^(Toronto)\s+[CEW]\d{2}$", re.IGNORECASE)


def base_city(city: str | None) -> str:
    """'Toronto (Mimico)' / 'Toronto C08' → 'Toronto'.

    DDF appends the neighbourhood in parentheses and AMPRE appends a district
    code; both need collapsing before cities can be compared or grouped.
    """
    if not city:
        return ""
    value = _PARENTHETICAL.sub("", city).strip()
    match = _TORONTO_DISTRICT.match(value)
    return match.group(1).title() if match else value


def median(values: Iterable[float]) -> float | None:
    clean = [float(v) for v in values if v is not None]
    return statistics.median(clean) if clean else None


def to_float(value: Decimal | float | int | str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def pct(part: float, whole: float) -> float | None:
    """Rounded percentage, or None when the base is unusable."""
    if not whole:
        return None
    return round(part / whole * 100, 1)
