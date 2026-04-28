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

export const getPropertyType = (property: Property): string =>
  property.property_sub_type ||
  property.PropertySubType ||
  property.PropertyType ||
  property.category_type ||
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

/* ──────────────────────────── Navigation ──────────────────────────── */

/**
 * Checks if the property is a rental/lease based on various possible API fields.
 */
export const isRental = (property: Property): boolean => {
  const type = (
    property.PropertyType ||
    property.category_type ||
    ""
  ).toLowerCase();
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

export const getPropertyDetailSections = (
  property: Property,
  core: { price: string; type: string; livingArea: string },
): PropertyDetailSection[] => {
  const sections: PropertyDetailSection[] = [];

  const pushSection = (title: string, items: Array<PropertyDetailItem | null>) => {
    const filtered = items.filter((item): item is PropertyDetailItem => Boolean(item));
    if (filtered.length > 0) sections.push({ title, items: filtered });
  };

  pushSection("Financial Information", [
    toDetailItem("List Price", core.price),
    toDetailItem(
      "Status",
      toValue(getRaw(property, "standard_status", "StandardStatus")),
    ),
    toDetailItem(
      "MLS Number",
      toValue(getRaw(property, "listing_key", "ListingKey", "PropertyKey")),
    ),
    toDetailItem("Annual Taxes", getTaxAnnualAmount(property)),
    toDetailItem(
      "Common Interest",
      toValue(getRaw(property, "common_interest", "CommonInterest")),
    ),
  ]);

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
