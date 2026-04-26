export type LatLngPoint = {
  lat: number;
  lng: number;
};

export function normalizePolygonRing(points: LatLngPoint[]): LatLngPoint[] {
  const normalized = points
    .map((point) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
    }))
    .filter((point) => !Number.isNaN(point.lat) && !Number.isNaN(point.lng));

  if (normalized.length < 3) return [];

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const isClosed = first.lat === last.lat && first.lng === last.lng;
  return isClosed ? normalized : [...normalized, first];
}

export function getBoundingBoxFromPoints(points: LatLngPoint[]) {
  if (points.length === 0) return null;
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  return {
    latitude_min: Number(Math.min(...latitudes).toFixed(6)),
    latitude_max: Number(Math.max(...latitudes).toFixed(6)),
    longitude_min: Number(Math.min(...longitudes).toFixed(6)),
    longitude_max: Number(Math.max(...longitudes).toFixed(6)),
  };
}

function isPointOnSegment(
  point: LatLngPoint,
  segStart: LatLngPoint,
  segEnd: LatLngPoint,
): boolean {
  const epsilon = 1e-10;
  const cross =
    (point.lng - segStart.lng) * (segEnd.lat - segStart.lat) -
    (point.lat - segStart.lat) * (segEnd.lng - segStart.lng);

  if (Math.abs(cross) > epsilon) return false;

  const dot =
    (point.lng - segStart.lng) * (segEnd.lng - segStart.lng) +
    (point.lat - segStart.lat) * (segEnd.lat - segStart.lat);
  if (dot < -epsilon) return false;

  const squaredLen =
    (segEnd.lng - segStart.lng) ** 2 + (segEnd.lat - segStart.lat) ** 2;
  if (dot - squaredLen > epsilon) return false;

  return true;
}

export function isPointInPolygon(
  point: LatLngPoint,
  ring: LatLngPoint[],
  edgeInclusive = true,
): boolean {
  const polygon = normalizePolygonRing(ring);
  if (polygon.length < 4) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const start = polygon[j];
    const end = polygon[i];

    if (edgeInclusive && isPointOnSegment(point, start, end)) return true;

    const intersects =
      start.lat > point.lat !== end.lat > point.lat &&
      point.lng <
        ((end.lng - start.lng) * (point.lat - start.lat)) /
          (end.lat - start.lat) +
          start.lng;

    if (intersects) inside = !inside;
  }

  return inside;
}
