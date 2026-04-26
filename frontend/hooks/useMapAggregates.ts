import { fetchAPI, MapAggregatesResponse } from "@/lib/api";

export const LOW_ZOOM_MAX = 9;
export const MID_ZOOM_MAX = 12;
export const LISTING_ZOOM_MIN = 13;

export interface MapBBox {
  latitude_min: number;
  latitude_max: number;
  longitude_min: number;
  longitude_max: number;
}

export const shouldUseAggregateMode = (zoom: number): boolean =>
  zoom < LISTING_ZOOM_MIN;

export async function fetchMapAggregatesForBBox(
  apiBaseUrl: string,
  bbox: MapBBox,
  zoom: number,
): Promise<MapAggregatesResponse> {
  const params = new URLSearchParams();
  Object.entries(bbox).forEach(([k, v]) => params.append(k, String(v)));
  params.append("zoom", String(zoom));

  const url = `${apiBaseUrl}/api/mls/properties/map-aggregates/?${params.toString()}`;
  return fetchAPI<MapAggregatesResponse>(url, { cache: "no-store" });
}
