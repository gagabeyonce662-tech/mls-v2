from collections import defaultdict
from decimal import Decimal

import h3
from django.db import transaction

from mls.models import MapAggregateCell, Property


LOW_ZOOM_MAX = 9
MID_ZOOM_MAX = 12
AGGREGATE_RESOLUTIONS = (4, 5)


def get_resolution_for_zoom(zoom: int) -> int | None:
    if zoom <= LOW_ZOOM_MAX:
        return 4
    if zoom <= MID_ZOOM_MAX:
        return 5
    return None


def _iter_active_property_coordinates():
    qs = (
        Property.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False,
        )
        .exclude(standard_status__iexact="Sold")
        .values_list("latitude", "longitude")
    )
    for lat, lng in qs.iterator(chunk_size=5000):
        yield float(lat), float(lng)


def _cell_bucket_default() -> dict:
    return {"count": 0, "sum_lat": 0.0, "sum_lng": 0.0}


@transaction.atomic
def rebuild_h3_aggregates() -> int:
    # Per cell: count + sum of listing coordinates (centroid of listings in the cell).
    # Using h3.cell_to_latlng alone places markers at hex geometric centers, often in water
    # for shoreline-heavy cells.
    buckets_by_resolution: dict[int, dict[str, dict]] = {
        resolution: defaultdict(_cell_bucket_default)
        for resolution in AGGREGATE_RESOLUTIONS
    }

    for lat, lng in _iter_active_property_coordinates():
        for resolution in AGGREGATE_RESOLUTIONS:
            cell = h3.latlng_to_cell(lat, lng, resolution)
            b = buckets_by_resolution[resolution][cell]
            b["count"] += 1
            b["sum_lat"] += lat
            b["sum_lng"] += lng

    MapAggregateCell.objects.all().delete()
    objects_to_create: list[MapAggregateCell] = []

    for resolution, cells in buckets_by_resolution.items():
        for h3_index, bucket in cells.items():
            property_count = bucket["count"]
            if property_count <= 0:
                continue
            center_lat = bucket["sum_lat"] / property_count
            center_lng = bucket["sum_lng"] / property_count
            objects_to_create.append(
                MapAggregateCell(
                    h3_index=h3_index,
                    resolution=resolution,
                    property_count=property_count,
                    center_lat=Decimal(str(round(center_lat, 6))),
                    center_lng=Decimal(str(round(center_lng, 6))),
                )
            )

    if objects_to_create:
        MapAggregateCell.objects.bulk_create(objects_to_create, batch_size=5000)

    return len(objects_to_create)
