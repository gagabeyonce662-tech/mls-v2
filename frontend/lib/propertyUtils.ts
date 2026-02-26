/**
 * Property Field Normalizer — Single Source of Truth
 *
 * The API returns properties with both `snake_case` and `PascalCase` field names.
 * This module provides one canonical accessor for each field so that components
 * never have to guess which casing to use.
 *
 * RULES:
 *  - If you need a new property accessor, add it HERE — not inline.
 *  - Always import from `@/lib/propertyUtils` — never access `property.city`
 *    or `property.City` directly.
 *  - The `Property` type comes from `@/lib/api`.
 */

import type { Property } from "@/lib/api";
import { propertyCard } from "@/config/design-system";

/* ──────────────────────────── Identity ──────────────────────────── */

export const getPropertyKey = (property: Property): string =>
  property.listing_key ||
  property.PropertyKey ||
  `property-${property.city || property.City || "unknown"}-${
    property.ListPrice || property.list_price || "0"
  }`;

/* ──────────────────────────── Location ──────────────────────────── */

export const getCity = (property: Property): string =>
  property.city || property.City || "Unknown City";

export const getProvince = (property: Property): string =>
  property.province || property.StateOrProvince || "";

export const getPostalCode = (property: Property): string =>
  property.postal_code || property.PostalCode || "";

export const getAddress = (property: Property): string | null =>
  property.unparsed_address || property.address || null;

export const getFullAddress = (property: Property): string => {
  const parts = [
    getAddress(property),
    getCity(property),
    getProvince(property),
    getPostalCode(property),
  ].filter(Boolean);
  return parts.join(", ");
};

export const getLatitude = (property: Property): number | null => {
  const val = property.latitude || property.Latitude;
  if (!val) return null;
  const num = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(num) ? num : null;
};

export const getLongitude = (property: Property): number | null => {
  const val = property.longitude || property.Longitude;
  if (!val) return null;
  const num = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(num) ? num : null;
};

/* ──────────────────────────── Pricing ──────────────────────────── */

export const getPrice = (property: Property): number => {
  const possible =
    (property as any).list_price ??
    property.ListPrice ??
    (property as any).ListPriceNumeric ??
    0;
  if (typeof possible === "string") {
    const parsed = parseFloat(possible.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return typeof possible === "number" ? possible : 0;
};

export const formatPrice = (price: number): string =>
  price > 0
    ? new Intl.NumberFormat(propertyCard.currency.locale, {
        style: "currency",
        currency: propertyCard.currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)
    : propertyCard.fallbackText.noPrice;

/* ──────────────────────────── Classification ──────────────────────────── */

export const getPropertyType = (property: Property): string =>
  property.category_type || property.PropertySubType || "Property";

export const getStatus = (property: Property): string =>
  property.standard_status || property.StandardStatus || "For Sale";

/* ──────────────────────────── Features ──────────────────────────── */

export const getBedrooms = (property: Property): number => {
  const val = property.bedrooms_total ?? property.BedroomsTotal ?? 0;
  return typeof val === "string" ? parseFloat(val) || 0 : val;
};

export const getBathrooms = (property: Property): number => {
  const val =
    property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? 0;
  return typeof val === "string" ? parseFloat(val) || 0 : val;
};

export const getSqft = (property: Property): number | null => {
  const val =
    property.building_area_total ?? (property as any).LivingArea ?? null;
  if (!val) return null;
  const num = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(num) && num > 0 ? num : null;
};

export const getYearBuilt = (property: Property): number | null => {
  const val = property.year_built ?? (property as any).YearBuilt ?? null;
  if (!val) return null;
  const num = typeof val === "string" ? parseInt(val, 10) : val;
  return Number.isFinite(num) && num > 1800 ? num : null;
};

export const getParkingSpaces = (property: Property): number | null =>
  property.parking_total ?? (property as any).GarageSpaces ?? null;

/* ──────────────────────────── Media ──────────────────────────── */

const MEDIA_URL_KEYS = [
  "url",
  "media_url",
  "MediaURL",
  "MediaUrl",
  "src",
  "thumbnail",
  "thumbnailUrl",
  "ImageURL",
  "imageUrl",
] as const;

export const getThumbnail = (property: Property): string | null => {
  const candidates = [
    (property as any).photos,
    property.Photos,
    property.media,
    property.Media,
    (property as any).images,
    (property as any).Images,
  ];

  for (const field of candidates) {
    if (!field) continue;

    if (Array.isArray(field) && field.length > 0) {
      const first = field[0];
      if (typeof first === "string" && first.trim()) return first;
      if (typeof first === "object" && first !== null) {
        for (const k of MEDIA_URL_KEYS) {
          if (first[k]) return first[k];
        }
      }
    }

    if (typeof field === "object" && !Array.isArray(field)) {
      for (const k of MEDIA_URL_KEYS) {
        if ((field as any)[k]) return (field as any)[k];
      }
    }

    if (typeof field === "string" && field.trim()) return field;
  }
  return null;
};

export const getPhotosCount = (property: Property): number =>
  property.photos_count ?? 0;

/* ──────────────────────────── Dates ──────────────────────────── */

export const getListingDate = (property: Property): string => {
  const fields = [
    (property as any).listing_date,
    (property as any).ListingDate,
    (property as any).list_date,
    (property as any).ListDate,
    property.ModificationTimestamp,
    (property as any).created_at,
    (property as any).CreatedAt,
  ];

  for (const field of fields) {
    if (field) {
      const date = new Date(field);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(propertyCard.currency.locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  }
  return "Recently listed";
};

export const getDaysOnMarket = (property: Property): number | null =>
  (property as any).DaysOnMarket ??
  (property as any).CumulativeDaysOnMarket ??
  null;

/* ──────────────────────────── Text ──────────────────────────── */

export const getDescription = (property: Property): string =>
  property.public_remarks || property.PublicRemarks || "";

export const getListingUrl = (property: Property): string | null =>
  property.listing_url || null;
