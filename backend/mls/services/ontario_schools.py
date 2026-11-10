"""Ontario public-school lookup from the Ministry's open school file.

The file is the 2024-25 English "School information and student demographics"
workbook on the Ontario Data Catalogue, published under the Open Government
Licence – Ontario. It includes each school's location and the EQAO percentages
the Ministry already publishes. It does not include attendance boundaries;
those are set by the school board.
"""

from __future__ import annotations

import gzip
import json
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "ontario_schools.json.gz"
_SCHOOLS: list[dict] | None = None

ELEMENTARY_FIELDS = ("g3_read", "g3_write", "g3_math", "g6_read", "g6_write", "g6_math")
SECONDARY_FIELDS = ("g9_math", "osslt")

# Greater Toronto, wide enough to include Hamilton through Durham.
_GTA = {"lat_min": 43.25, "lat_max": 44.20, "lon_min": -80.05, "lon_max": -78.55}

SOURCE = {
    "name": "Ontario Ministry of Education, School information and student demographics, 2024-25",
    "licence": "Open Government Licence – Ontario",
    "url": "https://data.ontario.ca/dataset/school-information-and-student-demographics",
    "boundary_note": (
        "Attendance boundaries are set by the school board and are not in this file. "
        "The schools below are the nearest ones in the Ministry list."
    ),
}


def load_schools() -> list[dict]:
    global _SCHOOLS
    if _SCHOOLS is None:
        with gzip.open(_DATA, "rt", encoding="utf-8") as handle:
            payload = json.load(handle)
        _SCHOOLS = list(payload.get("schools") or [])
    return _SCHOOLS


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    lat1, lon1, lat2, lon2 = (radians(value) for value in (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * radius * asin(sqrt(a))


def _published(school: dict) -> list[int]:
    level = (school.get("level") or "").lower()
    fields = SECONDARY_FIELDS if level == "secondary" else ELEMENTARY_FIELDS
    return [school[field] for field in fields if isinstance(school.get(field), int)]


def eqao_percent(school: dict) -> int | None:
    """Average of the published subject percentages for this school's level."""
    values = _published(school)
    if not values:
        return None
    return round(sum(values) / len(values))


def eqao_label(school: dict) -> str:
    if (school.get("level") or "").lower() == "secondary":
        return "Average of published Grade 9 math and OSSLT results"
    return "Average of published Grade 3 and Grade 6 results"


def _public_school(school: dict, distance_km: float | None = None) -> dict:
    website = school.get("website") or ""
    if not website.startswith("http"):
        website = ""
    row = {
        "id": school.get("id") or "",
        "name": school.get("name") or "",
        "board": school.get("board") or "",
        "kind": school.get("kind") or "",
        "level": school.get("level") or "",
        "city": school.get("city") or "",
        "website": website,
        "latitude": school.get("lat"),
        "longitude": school.get("lon"),
        "eqao_percent": eqao_percent(school),
        "eqao_label": eqao_label(school),
    }
    if distance_km is not None:
        row["distance_km"] = round(distance_km, 1)
    return row


def schools_near(
    lat: float,
    lon: float,
    *,
    radius_km: float = 8,
    limit_elementary: int = 5,
    limit_secondary: int = 3,
    schools: list[dict] | None = None,
) -> list[dict]:
    """Nearest Ministry schools, elementary and secondary kept as separate groups."""
    elementary: list[tuple[float, dict]] = []
    secondary: list[tuple[float, dict]] = []
    for school in schools if schools is not None else load_schools():
        school_lat = school.get("lat")
        school_lon = school.get("lon")
        if not isinstance(school_lat, (int, float)) or not isinstance(school_lon, (int, float)):
            continue
        distance = _distance_km(lat, lon, float(school_lat), float(school_lon))
        if distance > radius_km:
            continue
        level = (school.get("level") or "").lower()
        if level == "secondary":
            secondary.append((distance, school))
        else:
            elementary.append((distance, school))
    elementary.sort(key=lambda item: item[0])
    secondary.sort(key=lambda item: item[0])
    chosen = elementary[:limit_elementary] + secondary[:limit_secondary]
    chosen.sort(key=lambda item: (0 if (item[1].get("level") or "").lower() != "secondary" else 1, item[0]))
    return [_public_school(school, distance) for distance, school in chosen]


def top_gta_schools(*, limit: int = 4, schools: list[dict] | None = None) -> list[dict]:
    """GTA secondary schools with the highest average of published EQAO results."""
    ranked = []
    for school in schools if schools is not None else load_schools():
        if (school.get("level") or "").lower() != "secondary":
            continue
        lat = school.get("lat")
        lon = school.get("lon")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            continue
        if not (_GTA["lat_min"] <= lat <= _GTA["lat_max"] and _GTA["lon_min"] <= lon <= _GTA["lon_max"]):
            continue
        score = eqao_percent(school)
        if score is None:
            continue
        ranked.append((score, school.get("name") or "", school))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return [_public_school(school) for _, _, school in ranked[:limit]]


def _normalize_name(value: str) -> str:
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in (value or "")).split())


def search_schools(
    query: str,
    *,
    limit: int = 8,
    schools: list[dict] | None = None,
) -> list[dict]:
    """Name search over the Ministry file for typeahead / homes-near-school."""
    term = _normalize_name(query)
    if len(term) < 2:
        return []
    tokens = [token for token in term.split() if len(token) > 1]
    if not tokens:
        return []

    ranked: list[tuple[float, str, dict]] = []
    for school in schools if schools is not None else load_schools():
        lat = school.get("lat")
        lon = school.get("lon")
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            continue
        name = _normalize_name(school.get("name") or "")
        city = _normalize_name(school.get("city") or "")
        board = _normalize_name(school.get("board") or "")
        hay = f"{name} {city} {board}".strip()
        if not name or not hay:
            continue
        if not all(token in hay for token in tokens):
            continue
        score = 0.0
        if name == term:
            score = 100.0
        elif name.startswith(term):
            score = 90.0
        elif term in name:
            score = 80.0
        else:
            score = 60.0
        # Prefer GTA secondaries slightly — common buyer search intent.
        if (school.get("level") or "").lower() == "secondary":
            score += 2.0
        if _GTA["lat_min"] <= lat <= _GTA["lat_max"] and _GTA["lon_min"] <= lon <= _GTA["lon_max"]:
            score += 1.0
        ranked.append((score, name, school))

    ranked.sort(key=lambda item: (-item[0], item[1]))
    return [_public_school(school) for _, _, school in ranked[: max(1, min(limit, 20))]]
