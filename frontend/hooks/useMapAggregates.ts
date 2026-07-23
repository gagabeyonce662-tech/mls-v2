import { fetchAPI, MapAggregatesResponse } from "@/lib/api";

export const LOW_ZOOM_MAX = 9;
export const MID_ZOOM_MAX = 12;
export const LISTING_ZOOM_MIN = 13;
const MAP_MICRO_CACHE_TTL_MS = 60 * 1000;
const mapAggregatesMicroCache = new Map<
  string,
  { timestamp: number; data: MapAggregatesResponse }
>();

export interface MapBBox {
  latitude_min: number;
  latitude_max: number;
  longitude_min: number;
  longitude_max: number;
}

export interface MapFilterParams {
  price_min?: string | number;
  price_max?: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  city?: string;
  province?: string;
  postal_code?: string;
  property_type?: string;
  transaction_type?: "sale" | "rent";
  status?: string;
  has_lease?: boolean;
  has_photos?: boolean;
  garage?: string;
  building_area_min?: string | number;
  building_area_max?: string | number;
  lot_size_min?: string | number;
  lot_size_max?: string | number;
  parking_min?: string | number;
  keywords?: string;
  search?: string;
}

export const shouldUseAggregateMode = (zoom: number): boolean =>
  zoom < LISTING_ZOOM_MIN;

/**
 * Target zoom after user drills into an aggregate bubble.
 * Returns null when already at listing zoom (no map motion needed).
 */
export function getDrillTargetZoom(currentZoom: number): number | null {
  if (currentZoom >= LISTING_ZOOM_MIN) return null;
  if (currentZoom <= LOW_ZOOM_MAX) return 11;
  return LISTING_ZOOM_MIN;
}

export async function fetchMapAggregatesForBBox(
  apiBaseUrl: string,
  bbox: MapBBox,
  zoom: number,
  filters?: MapFilterParams,
  signal?: AbortSignal,
): Promise<MapAggregatesResponse> {
  const params = new URLSearchParams();
  Object.entries(bbox).forEach(([k, v]) => params.append(k, String(v)));
  params.append("zoom", String(zoom));
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.append(key, String(value));
    });
  }

  const url = `${apiBaseUrl}/api/mls/properties/map-aggregates/?${params.toString()}`;
  const now = Date.now();
  const cachedEntry = mapAggregatesMicroCache.get(url);
  if (cachedEntry && now - cachedEntry.timestamp < MAP_MICRO_CACHE_TTL_MS) {
    return cachedEntry.data;
  }

  const response = await fetchAPI<MapAggregatesResponse>(url, {
    cache: "no-store",
    signal,
  });
  mapAggregatesMicroCache.set(url, { timestamp: now, data: response });

  return response;
}
