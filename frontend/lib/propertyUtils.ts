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
import { getMlsNumberForDisplay } from "@/lib/listingDisplay";

export interface PropertyDetailItem {
  label: string;
  value: string;
}

export interface PropertyDetailSection {
  title: string;
  items: PropertyDetailItem[];
}

/* ──────────────────────────── Identity ──────────────────────────── */

export const getPropertyKey = (property: Property): string =>
  property.listing_key ||
  property.PropertyKey ||
  `property-${property.city || property.City || "unknown"}-${property.ListPrice || property.list_price || "0"
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

/** Human-facing building/type label — not `category_type` (ddf / exclusive / pre_conn). */
export const getPropertyType = (property: Property): string =>
  property.property_sub_type ||
  property.PropertySubType ||
  property.PropertyType ||
  "Property";

export const getStatus = (property: Property): string =>
  property.standard_status || property.StandardStatus || "For Sale";

/* ──────────────────────────── Features ──────────────────────────── */

export const getBedrooms = (property: Property): number => {
  const val = property.bedrooms_total ?? property.BedroomsTotal ?? 0;
  return typeof val === "string" ? parseFloat(val) || 0 : (val as number);
};

export const getBathrooms = (property: Property): number => {
  const val =
    property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? 0;
  return typeof val === "string" ? parseFloat(val) || 0 : (val as number);
};

export const getSqft = (property: Property): number | null => {
  const val =
    property.building_area_total ??
    (property as any).LivingArea ??
    (property as any).LivingAreaMinimum ??
    null;
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

export const getPhotos = (property: Property): string[] => {
  const candidates = [
    (property as any).photos,
    property.Photos,
    property.media,
    property.Media,
    (property as any).images,
    (property as any).Images,
  ];

  const allPhotos: string[] = [];

  for (const field of candidates) {
    if (!field) continue;

    if (Array.isArray(field) && field.length > 0) {
      for (const item of field) {
        if (typeof item === "string" && item.trim()) {
          allPhotos.push(item);
        } else if (typeof item === "object" && item !== null) {
          for (const k of MEDIA_URL_KEYS) {
            if ((item as any)[k]) {
              allPhotos.push((item as any)[k]);
              break;
            }
          }
        }
      }
    } else if (typeof field === "object") {
      for (const k of MEDIA_URL_KEYS) {
        if ((field as any)[k]) {
          allPhotos.push((field as any)[k]);
          break;
        }
      }
    } else if (typeof field === "string" && field.trim()) {
      allPhotos.push(field);
    }

    if (allPhotos.length > 0) break;
  }

  // Deduplicate
  return allPhotos.filter((item, index) => allPhotos.indexOf(item) === index);
};

export const getPhotosCount = (property: Property): number => {
  const photos = getPhotos(property);
  return photos.length || (property as any).photos_count || 0;
};

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

/** Canadian postal FSA (first 3 alphanumeric chars, spaces removed). */
export function postalToFsa(
  postal: string | null | undefined,
): string | null {
  if (!postal || typeof postal !== "string") return null;
  const alnum = postal.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (alnum.length < 3) return null;
  return alnum.slice(0, 3);
}

/* ──────────────────────────── Navigation ──────────────────────────── */

/**
 * Checks if the property is a rental/lease based on various possible API fields.
 */
export const isRental = (property: Property): boolean => {
  const type = (property.PropertyType || "").toLowerCase();
  const subType = (
    property.PropertySubType ||
    property.property_sub_type ||
    ""
  ).toLowerCase();
  const status = (
    property.standard_status ||
    property.StandardStatus ||
    ""
  ).toLowerCase();

  return (
    type.includes("lease") ||
    type.includes("rental") ||
    subType.includes("lease") ||
    subType.includes("rental") ||
    status.includes("lease") ||
    status.includes("rent") ||
    !!property.lease_amount ||
    !!property.total_actual_rent
  );
};

/**
 * Returns the canonical detail page URL for a property.
 */
export const getDetailUrl = (property: Property): string => {
  const key = getPropertyKey(property);
  const rental = isRental(property);
  const url = rental ? `/listing/rental/${key}` : `/listing/${key}`;
  // #region agent log
  fetch("http://127.0.0.1:7349/ingest/3f08206e-1a73-4004-abc2-35f0c9af591f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "db96a5",
    },
    body: JSON.stringify({
      sessionId: "db96a5",
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "frontend/lib/propertyUtils.ts:321",
      message: "Detail URL computed",
      data: {
        key,
        url,
        rental,
        status: property.standard_status ?? property.StandardStatus ?? null,
        propertyType: property.PropertyType ?? null,
        categoryType: property.category_type ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return url;
};

const toValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return null;
};

const getRaw = (property: Property, ...keys: string[]): unknown => {
  for (const key of keys) {
    const value = (property as Record<string, unknown>)[key];
    if (
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && value.trim() === "")
    ) {
      return value;
    }
  }
  return null;
};

const formatNumber = (value: unknown): string | null => {
  const raw = toValue(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return parsed.toLocaleString("en-US");
};

const formatCurrency = (value: unknown): string | null => {
  const raw = toValue(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const formatList = (value: unknown): string | null => {
  if (!Array.isArray(value)) return toValue(value);
  const compact = value
    .map((entry) => toValue(entry))
    .filter((entry): entry is string => Boolean(entry));
  return compact.length ? compact.join(", ") : null;
};

export const getTaxAnnualAmount = (property: Property): string | null => {
  const raw = getRaw(property, "tax_annual_amount", "TaxAnnualAmount");
  return formatCurrency(raw);
};

export const getParkingSummary = (property: Property): string | null => {
  const total = formatNumber(getRaw(property, "parking_total", "ParkingTotal"));
  const features = formatList(
    getRaw(property, "parking_features", "ParkingFeatures"),
  );
  if (total && features) return `${total} (${features})`;
  return total || features || null;
};

export const getLotSizeSummary = (property: Property): string | null => {
  const dimensions = toValue(
    getRaw(property, "lot_size_dimensions", "LotSizeDimensions"),
  );
  if (dimensions) return dimensions;
  const area = toValue(getRaw(property, "lot_size_area", "LotSizeArea"));
  return area ? `${area} sq ft` : null;
};

/** Prefer living area min–max range when both exist (matches DDF LivingAreaMinimum / Maximum). */
export const getLivingAreaSummary = (property: Property): string => {
  const minStr = toValue(
    getRaw(property, "living_area_minimum", "LivingAreaMinimum"),
  );
  const maxStr = toValue(
    getRaw(property, "living_area_maximum", "LivingAreaMaximum"),
  );
  const minN = minStr ? Number(String(minStr).replace(/,/g, "")) : NaN;
  const maxN = maxStr ? Number(String(maxStr).replace(/,/g, "")) : NaN;
  if (Number.isFinite(minN) && Number.isFinite(maxN)) {
    if (minN === maxN) return `${minN.toLocaleString("en-US")} sq ft`;
    return `${minN.toLocaleString("en-US")} - ${maxN.toLocaleString("en-US")} sq ft`;
  }
  const single =
    toValue(getRaw(property, "building_area_total", "BuildingAreaTotal")) ||
    toValue(getRaw(property, "living_area", "LivingArea")) ||
    (Number.isFinite(minN) ? minN.toLocaleString("en-US") : "");
  if (single) return `${single} sq ft`;
  return "";
};

/** Quick facts / stats: total baths plus partial count when present. */
export const getBathroomDisplayLabel = (property: Property): string | null => {
  const totalRaw =
    property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? null;
  const partialRaw =
    property.bathrooms_partial ?? property.BathroomsPartial ?? null;
  const t =
    totalRaw === null || totalRaw === ""
      ? NaN
      : typeof totalRaw === "string"
        ? parseInt(totalRaw, 10)
        : Number(totalRaw);
  const p =
    partialRaw === null || partialRaw === ""
      ? NaN
      : typeof partialRaw === "string"
        ? parseInt(partialRaw, 10)
        : Number(partialRaw);
  if (!Number.isFinite(t) || t <= 0) return null;
  if (Number.isFinite(p) && p > 0) {
    return `${t} (${p} partial)`;
  }
  return String(t);
};

/** Annual tax amount with tax year when available (e.g. MLS TaxAnnualAmount + TaxYear). */
export const getAnnualTaxDisplayWithYear = (property: Property): string | null => {
  const amt = getTaxAnnualAmount(property);
  const year = toValue(getRaw(property, "tax_year", "TaxYear"));
  if (amt && year) return `${amt} (${year})`;
  if (amt) return amt;
  if (year) return `Tax year ${year}`;
  return null;
};

/** Lat/lng as plain text for listing detail (six decimal places). */
export const getCoordinatesLabel = (property: Property): string | null => {
  const lat = getLatitude(property);
  const lon = getLongitude(property);
  if (lat === null || lon === null) return null;
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
};

const EXTERNAL_MEDIA_CATEGORY =
  /video tour|virtual tour|additional pictures|unbranded virtual/i;

const DDFCDN_PHOTO =
  /^https:\/\/ddfcdn\.realtor\.ca\/.*\.(jpe?g|png|webp)(\?|$)/i;

/**
 * Non-photo MLS media links (virtual tour site, extra photo galleries, Matterport, etc.).
 */
export const getListingExternalMediaLinks = (
  property: Property,
): { label: string; url: string }[] => {
  const rows = (property.media || property.Media || []) as unknown as Array<
    Record<string, unknown>
  >;
  const seen = new Set<string>();
  const out: { label: string; url: string }[] = [];

  for (const row of rows) {
    const url = String(row.media_url ?? row.MediaURL ?? "").trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;

    const cat = String(row.media_category ?? row.MediaCategory ?? "").trim();
    if (DDFCDN_PHOTO.test(url) && /property photo|^photo$/i.test(cat)) continue;

    const looksExternal =
      EXTERNAL_MEDIA_CATEGORY.test(cat) ||
      /insideottawamedia|matterport|my3d|tour\.|vimeo\.com|youtu\.be|youtube\.com/i.test(
        url,
      );
    if (!looksExternal) continue;

    seen.add(url);
    let label = cat || "External media";
    if (/video tour/i.test(cat)) label = "Video tour";
    else if (/additional pictures/i.test(cat)) label = "More photos (external site)";
    else if (/unbranded virtual/i.test(cat)) label = "Virtual tour";
    out.push({ label, url });
  }
  return out;
};

const toDetailItem = (
  label: string,
  value: string | null,
): PropertyDetailItem | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a" || trimmed.toLowerCase() === "null") {
    return null;
  }
  return { label, value: trimmed };
};

export type PropertyDetailSectionsOptions = {
  isPrivileged?: boolean;
};

export const getPropertyDetailSections = (
  property: Property,
  core: { price: string; type: string; livingArea: string },
  options: PropertyDetailSectionsOptions = {},
): PropertyDetailSection[] => {
  const isPrivileged = options.isPrivileged ?? false;
  const sections: PropertyDetailSection[] = [];

  const pushSection = (title: string, items: Array<PropertyDetailItem | null>) => {
    const filtered = items.filter((item): item is PropertyDetailItem => Boolean(item));
    if (filtered.length > 0) sections.push({ title, items: filtered });
  };

  const mlsDisplay = getMlsNumberForDisplay(property, { isPrivileged });

  pushSection("Financial Information", [
    toDetailItem("List Price", core.price),
    toDetailItem(
      "Status",
      toValue(getRaw(property, "standard_status", "StandardStatus")),
    ),
    toDetailItem("MLS® #", mlsDisplay),
    toDetailItem("Annual Taxes", getTaxAnnualAmount(property)),
    toDetailItem("Tax Year", toValue(getRaw(property, "tax_year", "TaxYear"))),
    toDetailItem(
      "Common Interest",
      toValue(getRaw(property, "common_interest", "CommonInterest")),
    ),
  ]);

  const partialBathCount = Number(
    toValue(getRaw(property, "bathrooms_partial", "BathroomsPartial")),
  );

  pushSection("Building Facts", [
    toDetailItem("Property Type", core.type),
    toDetailItem("Building Area", core.livingArea),
    toDetailItem(
      "Year Built",
      toValue(getRaw(property, "year_built", "YearBuilt")),
    ),
    toDetailItem(
      "Stories",
      toValue(getRaw(property, "stories", "Stories")),
    ),
    toDetailItem(
      "Bedrooms Above Grade",
      toValue(getRaw(property, "bedrooms_above_grade", "BedroomsAboveGrade")),
    ),
    Number.isFinite(partialBathCount) && partialBathCount > 0
      ? toDetailItem("Partial bathrooms", String(partialBathCount))
      : null,
  ]);

  pushSection("Location & access", [
    toDetailItem("Directions", toValue(getRaw(property, "directions", "Directions"))),
    toDetailItem("Coordinates", getCoordinatesLabel(property)),
  ]);

  pushSection("Lot & Land", [
    toDetailItem("Lot Size", getLotSizeSummary(property)),
    toDetailItem(
      "Frontage",
      toValue(
        getRaw(
          property,
          "frontage_length_numeric",
          "FrontageLengthNumeric",
          "frontage_length",
          "FrontageLength",
        ),
      ),
    ),
    toDetailItem(
      "Lot Features",
      formatList(getRaw(property, "lot_features", "LotFeatures")),
    ),
    toDetailItem(
      "Pool Features",
      formatList(getRaw(property, "pool_features", "PoolFeatures")),
    ),
  ]);

  pushSection("Construction & Systems", [
    toDetailItem("Heating", formatList(getRaw(property, "heating", "Heating"))),
    toDetailItem("Cooling", formatList(getRaw(property, "cooling", "Cooling"))),
    toDetailItem("Basement", formatList(getRaw(property, "basement", "Basement"))),
    toDetailItem(
      "Foundation",
      formatList(getRaw(property, "foundation_details", "FoundationDetails")),
    ),
    toDetailItem("Roof", formatList(getRaw(property, "roof", "Roof"))),
    toDetailItem(
      "Exterior",
      formatList(getRaw(property, "exterior_features", "ExteriorFeatures")),
    ),
    toDetailItem(
      "Flooring",
      formatList(getRaw(property, "flooring", "Flooring")),
    ),
    toDetailItem(
      "Construction",
      formatList(getRaw(property, "construction_materials", "ConstructionMaterials")),
    ),
    toDetailItem("Appliances", formatList(getRaw(property, "appliances", "Appliances"))),
  ]);

  pushSection("Utilities & Services", [
    toDetailItem("Utilities", formatList(getRaw(property, "utilities", "Utilities"))),
    toDetailItem(
      "Water Source",
      formatList(getRaw(property, "water_source", "WaterSource")),
    ),
    toDetailItem("Sewer", formatList(getRaw(property, "sewer", "Sewer"))),
    toDetailItem("Electric", formatList(getRaw(property, "electric", "Electric"))),
  ]);

  pushSection("Parking & Structure", [
    toDetailItem("Parking", getParkingSummary(property)),
    toDetailItem(
      "Parking Features",
      formatList(getRaw(property, "parking_features", "ParkingFeatures")),
    ),
    toDetailItem(
      "Structure Type",
      formatList(getRaw(property, "structure_type", "StructureType")),
    ),
    toDetailItem(
      "Property Attached",
      toValue(getRaw(property, "property_attached_yn", "PropertyAttachedYN")),
    ),
  ]);

  pushSection("Listing Details", [
    toDetailItem(
      "Postal Code",
      toValue(getRaw(property, "postal_code", "PostalCode")),
    ),
    toDetailItem(
      "Photos Count",
      toValue(getRaw(property, "photos_count", "PhotosCount")),
    ),
    toDetailItem(
      "Rooms Total",
      toValue((property.rooms || property.Rooms || []).length || null),
    ),
    toDetailItem(
      "Zoning",
      toValue(getRaw(property, "zoning_description", "ZoningDescription", "zoning", "Zoning")),
    ),
  ]);

  return sections;
};

export const getFormattedRoomDimensions = (room: Record<string, unknown>): string => {
  const direct = toValue(room.room_dimensions ?? room.RoomDimensions);
  if (direct) return direct;

  const length = toValue(room.room_length ?? room.RoomLength);
  const width = toValue(room.room_width ?? room.RoomWidth);
  const units = toValue(room.room_length_width_units ?? room.RoomLengthWidthUnits);

  if (length && width) {
    return units ? `${length} x ${width} ${units}` : `${length} x ${width}`;
  }
  return "";
};
