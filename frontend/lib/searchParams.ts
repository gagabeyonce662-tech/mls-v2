import type { ExclusivePropertyFilterParams } from "@/lib/api";

const numberKeys: Array<keyof ExclusivePropertyFilterParams> = [
  "price_min",
  "price_max",
  "bedrooms",
  "bathrooms",
  "building_area_min",
  "building_area_max",
  "lot_size_min",
  "lot_size_max",
  "year_built_min",
  "year_built_max",
  "limit",
  "offset",
  "latitude_min",
  "latitude_max",
  "longitude_min",
  "longitude_max",
  "new_listings_days",
];

const stringKeys: Array<keyof ExclusivePropertyFilterParams> = [
  "city",
  "province",
  "postal_code",
  "property_sub_type",
  "property_type",
  "keywords",
  "standard_status",
  "search",
];

export function filtersToSearchParams(
  filters: ExclusivePropertyFilterParams,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of numberKeys) {
    const value = filters[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(String(key), String(value));
    }
  }

  for (const key of stringKeys) {
    const value = filters[key];
    if (typeof value === "string" && value.trim()) {
      params.set(String(key), value.trim());
    }
  }

  if (typeof filters.has_photos === "boolean") {
    params.set("has_photos", String(filters.has_photos));
  }

  return params;
}

export function searchParamsToFilters(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): ExclusivePropertyFilterParams {
  const filters: ExclusivePropertyFilterParams = {};

  for (const key of numberKeys) {
    const value = searchParams.get(String(key));
    if (!value) continue;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      filters[key] = parsed as never;
    }
  }

  for (const key of stringKeys) {
    const value = searchParams.get(String(key));
    if (value && value.trim()) {
      filters[key] = value.trim() as never;
    }
  }

  const hasPhotos = searchParams.get("has_photos");
  if (hasPhotos === "true") filters.has_photos = true;
  else if (hasPhotos === "false") filters.has_photos = false;

  return filters;
}

type ReadonlyURLSearchParams = {
  get: (name: string) => string | null;
};
