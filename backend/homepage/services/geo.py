"""Small geo helpers (no GIS dependency: the DB stores plain lat/lng decimals)."""

from __future__ import annotations

import math

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points, in kilometres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def bounding_box(lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    """(lat_min, lat_max, lng_min, lng_max) enclosing a radius — an index-friendly
    SQL prefilter; callers then trim the corners with ``haversine_km``."""
    dlat = radius_km / 111.32
    # Longitude degrees shrink with latitude; clamp to avoid a pole blow-up.
    dlng = radius_km / (111.32 * max(math.cos(math.radians(lat)), 0.01))
    return lat - dlat, lat + dlat, lng - dlng, lng + dlng
