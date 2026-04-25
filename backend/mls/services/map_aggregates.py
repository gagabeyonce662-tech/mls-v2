from collections import defaultdict
from decimal import Decimal

import h3
from django.db import transaction

from mls.models import MapAggregateCell, Property


LOW_ZOOM_MAX = 9
MID_ZOOM_MAX = 12
AGGREGATE_RESOLUTIONS = (4, 5, 6)


def get_resolution_for_zoom(zoom: int) -> int | None:
    if zoom <= LOW_ZOOM_MAX:
        return 4
    if zoom <= MID_ZOOM_MAX:
        return 5
    if zoom <= 13:
        return 6
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


@transaction.atomic
def rebuild_h3_aggregates() -> int:
    counts_by_resolution: dict[int, dict[str, int]] = {
        resolution: defaultdict(int) for resolution in AGGREGATE_RESOLUTIONS
    }

    for lat, lng in _iter_active_property_coordinates():
        for resolution in AGGREGATE_RESOLUTIONS:
            cell = h3.latlng_to_cell(lat, lng, resolution)
            counts_by_resolution[resolution][cell] += 1

    MapAggregateCell.objects.all().delete()
    objects_to_create: list[MapAggregateCell] = []

    for resolution, counts in counts_by_resolution.items():
        for h3_index, property_count in counts.items():
            center_lat, center_lng = h3.cell_to_latlng(h3_index)
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
