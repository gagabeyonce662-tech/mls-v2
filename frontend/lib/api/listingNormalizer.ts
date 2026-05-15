import type { Property, PropertyMedia } from "./types";
import { API_BASE_URL } from "./client";

type JsonMap = Record<string, unknown>;

interface NormalizeListingOptions {
  forceListingKey?: string;
  defaultStatus?: string;
  defaultCity?: string;
  defaultType?: string;
  defaultTitle?: string;
}

const IMAGE_OBJECT_KEYS = [
  "media_url",
  "MediaURL",
  "MediaUrl",
  "url",
  "src",
  "image",
  "image_url",
  "featured_image_url",
  "thumbnail",
  "thumbnail_url",
  "PhotoURL",
] as const;

const IMAGE_DIRECT_KEYS = [
  "featured_image_url",
  "primary_image_url",
  "media_url",
  "image_url",
  "thumbnail_url",
  "main_image",
  "featured_image",
] as const;

const NEXT_ALLOWED_IMAGE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "192.168.1.29",
  "images.unsplash.com",
  "i.pravatar.cc",
  "ddfcdn.realtor.ca",
  "staging.vsell4u.ca",
  "mls-backend-v2.vercel.app",
  "estate-4u.com",
  "www.estate-4u.com",
  "estate4u.ca",
  "www.estate4u.ca",
  "res.cloudinary.com",
]);

try {
  const apiUrl = String(API_BASE_URL || "").trim();
  if (apiUrl) {
    const parsed = new URL(apiUrl);
    if (parsed.hostname) {
      NEXT_ALLOWED_IMAGE_HOSTS.add(parsed.hostname);
    }
  }
} catch {
  // Ignore malformed API base URL and continue with static allowlist.
}
function parseJsonLike(value: unknown): JsonMap {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonMap;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonMap)
      : {};
  } catch {
    return {};
  }
}

function parseDescriptionSections(value: unknown): Array<{
  id: string;
  title: string;
  body_html: string;
  order: number;
}> {
  let rawArray: unknown[] = [];
  if (Array.isArray(value)) {
    rawArray = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        rawArray = parsed;
      }
    } catch {
      rawArray = [];
    }
  }

  return rawArray
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const typed = item as JsonMap;
      return {
        id: toCleanString(typed.id) || `section-${idx + 1}`,
        title: toCleanString(typed.title),
        body_html: toCleanString(typed.body_html),
        order:
          typeof typed.order === "number"
            ? typed.order
            : Number.parseInt(String(typed.order ?? idx), 10) || idx,
      };
    })
    .filter(
      (
        section,
      ): section is {
        id: string;
        title: string;
        body_html: string;
        order: number;
      } => Boolean(section),
    )
    .sort((a, b) => a.order - b.order);
}

function getFirstDescriptionSectionBody(value: unknown): string {
  const sections = parseDescriptionSections(value);
  return sections[0]?.body_html || "";
}

function unwrapMetaValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = unwrapMetaValue(item);
      if (nested !== null && nested !== undefined && toCleanString(nested)) {
        return nested;
      }
    }
    return value.length > 0 ? value[0] : undefined;
  }
  return value;
}

function wpMetaValue(wpMeta: JsonMap, ...keys: string[]): unknown {
  for (const key of keys) {
    if (!(key in wpMeta)) continue;
    let raw = unwrapMetaValue(wpMeta[key]);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const objectLike = raw as JsonMap;
      raw =
        objectLike.rendered ??
        objectLike.value ??
        objectLike.url ??
        objectLike.name ??
        undefined;
    }
    if (raw === null || raw === undefined) continue;
    if (typeof raw === "string" && raw.trim() === "") continue;
    return raw;
  }
  return undefined;
}

function taxonomyLabel(wpTerms: JsonMap, ...keys: string[]): string {
  for (const key of keys) {
    const raw = unwrapMetaValue(wpTerms[key]);
    const value = toCleanString(raw);
    if (value) return value;
  }
  return "";
}

function toNumberLoose(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  const parsed = Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseLatLngPair(value: unknown): { lat?: number; lng?: number } {
  const text = toCleanString(unwrapMetaValue(value));
  if (!text) return {};
  const parts = text.split(/[,\s|]+/).filter(Boolean);
  if (parts.length < 2) return {};
  const lat = toNumberLoose(parts[0]);
  const lng = toNumberLoose(parts[1]);
  return { lat, lng };
}

function inferCityFromAddress(value: unknown): string {
  const text = toCleanString(value);
  if (!text) return "";
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return "";
  return parts[parts.length - 2] || "";
}

function inferProvinceFromAddress(value: unknown): string {
  const text = toCleanString(value);
  if (!text) return "";
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  const tail = parts[parts.length - 1];
  const codeMatch = tail.match(/\b([A-Z]{2})\b/);
  if (codeMatch?.[1]) return codeMatch[1];
  return tail;
}

function toCleanString(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  if (text.startsWith("/media/")) {
    const base = String(API_BASE_URL || "").trim().replace(/\/+$/, "");
    return base ? `${base}${text}` : text;
  }
  return text;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const str = toCleanString(value);
    if (str) return str;
  }
  return "";
}

function cleanHtml(value: unknown): string {
  return toCleanString(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumberOrOriginal(value: unknown): number | string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.-]+/g, "");
  if (!cleaned) return String(value);
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : String(value);
}

function toNumberSafe(value: unknown): number {
  const normalized = toNumberOrOriginal(value);
  if (typeof normalized === "number" && Number.isFinite(normalized)) {
    return normalized;
  }
  if (typeof normalized === "string") {
    const parsed = Number(normalized.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function looksLikeImageUrl(value: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return true;
  }
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(normalized);
}

function isAllowedRemoteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return NEXT_ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function filenameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    return decodeURIComponent(segments[segments.length - 1]) || null;
  } catch {
    return null;
  }
}

function extractCandidateStrings(
  value: unknown,
  out: string[],
  depth = 0,
): void {
  if (depth > 3 || value == null) return;

  if (typeof value === "string") {
    const text = value.trim();
    if (looksLikeImageUrl(text)) out.push(text);
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      extractCandidateStrings(entry, out, depth + 1);
    }
    return;
  }

  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value as JsonMap)) {
      if (/image|photo|gallery|media/i.test(key)) {
        extractCandidateStrings(entry, out, depth + 1);
      }
    }
  }
}

function pickImageValue(item: unknown): string {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item !== "object") return "";

  const typed = item as JsonMap;
  for (const key of IMAGE_OBJECT_KEYS) {
    const value = toCleanString(typed[key]);
    if (value) return value;
  }
  return "";
}

function getRawMediaCandidates(
  prop: JsonMap,
  wpMeta: JsonMap,
  wpPost: JsonMap,
): string[] {
  const candidates: string[] = [];
  const push = (value: string) => {
    const cleaned = toCleanString(value);
    if (!cleaned || !looksLikeImageUrl(cleaned)) return;
    // Prevent runtime crashes in next/image by keeping only configured remote hosts.
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      if (!isAllowedRemoteUrl(cleaned)) return;
    }
    candidates.push(cleaned);
  };

  const mediaCollections = [
    prop.media,
    prop.Media,
    prop.photos,
    prop.Photos,
    prop.images,
    prop.Images,
    wpPost.media,
    wpPost.Media,
    wpPost.images,
    wpPost.gallery,
  ];

  for (const collection of mediaCollections) {
    if (!collection) continue;
    if (Array.isArray(collection)) {
      for (const item of collection) {
        const url = pickImageValue(item);
        if (url) push(url);
      }
    } else {
      const url = pickImageValue(collection);
      if (url) push(url);
    }
  }

  for (const key of IMAGE_DIRECT_KEYS) {
    push(toCleanString(prop[key]));
    push(toCleanString(wpPost[key]));
  }

  const yoast = wpPost.yoast_head_json as JsonMap | undefined;
  if (yoast && Array.isArray((yoast as JsonMap).og_image)) {
    for (const image of (yoast as JsonMap).og_image as unknown[]) {
      const url = pickImageValue(image);
      if (url) push(url);
    }
  }

  for (const [key, value] of Object.entries(wpMeta)) {
    if (/image|photo|gallery|media/i.test(key)) {
      const nested: string[] = [];
      extractCandidateStrings(value, nested);
      nested.forEach(push);
    }
  }

  const unique = new Set<string>();
  const ordered: string[] = [];
  for (const item of candidates) {
    if (!unique.has(item)) {
      unique.add(item);
      ordered.push(item);
    }
  }
  return ordered;
}

function buildMedia(urls: string[]): PropertyMedia[] {
  return urls.map((url, index) => ({
    media_url: url,
    media_category: "Property Photo",
    is_preferred: index === 0,
    order: index + 1,
    image_filename: filenameFromUrl(url) || undefined,
  })) as PropertyMedia[];
}

function normalizeRoomsArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeListingRecord(
  rawProp: unknown,
  options: NormalizeListingOptions = {},
): Property {
  const prop = ((rawProp as JsonMap) || {}) as JsonMap;
  const wpMeta = parseJsonLike(prop.wp_meta_json);
  const wpPost = parseJsonLike(prop.wp_post_json);

  const normalizedCity =
    firstString(prop.city, prop.City, prop.location, options.defaultCity) ||
    "Unknown City";
  const normalizedProvince = firstString(
    prop.state_or_province,
    prop.StateOrProvince,
    prop.province,
    wpMetaValue(wpMeta, "fave_property_state"),
  );
  const normalizedStatus =
    firstString(
      prop.standard_status,
      prop.StandardStatus,
      prop.publish_status,
      wpPost.post_status,
      options.defaultStatus,
    ) || "For Sale";
  const normalizedType =
    firstString(
      prop.property_sub_type,
      prop.PropertySubType,
      prop.PropertyType,
      wpMetaValue(wpMeta, "fave_property_type"),
      options.defaultType,
    ) || "Property";

  const forcedKey = options.forceListingKey;
  const bestKey =
    firstString(
      forcedKey,
      prop.listing_key,
      prop.ListingKey,
      prop.PropertyKey,
      prop.listing_id,
      prop.id,
    ) || `property-${normalizedCity.toLowerCase().replace(/\s+/g, "-")}`;

  const title =
    firstString(
      prop.project_name,
      prop.property_title,
      prop.title,
      (wpPost.title as JsonMap | undefined)?.rendered,
      prop.unparsed_address,
      prop.address,
      prop.street_name,
      bestKey,
      options.defaultTitle,
    ) || "Listing";

  const description = cleanHtml(
    firstString(
      getFirstDescriptionSectionBody(prop.description_sections_json),
      prop.property_description,
      prop.public_remarks,
      prop.PublicRemarks,
      (wpPost.content as JsonMap | undefined)?.rendered,
      wpPost.excerpt,
    ),
  );

  const images = getRawMediaCandidates(prop, wpMeta, wpPost);
  const media = buildMedia(images);
  const primaryImage = media[0]?.media_url || "";
  const imageFilename = filenameFromUrl(primaryImage) || "";

  const rawPrice =
    prop.list_price ??
    prop.ListPrice ??
    wpMetaValue(wpMeta, "fave_property_price", "sale_or_rent_price");
  const rawBeds =
    prop.bedrooms_total ??
    prop.BedroomsTotal ??
    wpMetaValue(wpMeta, "fave_property_bedrooms");
  const rawBaths =
    prop.bathrooms_total_integer ??
    prop.BathroomsTotalInteger ??
    wpMetaValue(wpMeta, "fave_property_bathrooms");
  const rawSqft =
    prop.building_area_total ??
    prop.LivingArea ??
    prop.living_area ??
    wpMetaValue(wpMeta, "fave_property_size");
  const normalizedRooms = normalizeRoomsArray(prop.rooms);
  const normalizedLegacyRooms = normalizeRoomsArray(prop.Rooms);
  const resolvedRooms = normalizedRooms.length
    ? normalizedRooms
    : normalizedLegacyRooms;

  return {
    ...(prop as Property),
    id: firstString(prop.id),
    listing_key: bestKey,
    ListingKey: bestKey,
    PropertyKey: bestKey,
    listing_id: firstString(prop.listing_id, prop.listing_key, bestKey),
    project_name: title,
    property_title: firstString(prop.property_title, title),
    address: firstString(prop.address, prop.unparsed_address, title),
    unparsed_address: firstString(prop.unparsed_address, prop.address, title),
    city: normalizedCity,
    City: normalizedCity,
    state_or_province: firstString(
      prop.state_or_province,
      prop.StateOrProvince,
      prop.province,
      normalizedProvince,
    ),
    StateOrProvince: firstString(
      prop.StateOrProvince,
      prop.state_or_province,
      prop.province,
      normalizedProvince,
    ),
    province: firstString(prop.province, normalizedProvince),
    postal_code: firstString(
      prop.postal_code,
      prop.PostalCode,
      prop.postalCode,
    ),
    PostalCode: firstString(
      prop.PostalCode,
      prop.postal_code,
      prop.postalCode,
    ),
    location: firstString(prop.location, normalizedCity),
    standard_status: normalizedStatus,
    StandardStatus: normalizedStatus,
    property_sub_type: normalizedType,
    PropertySubType: normalizedType,
    list_price: toNumberOrOriginal(rawPrice),
    ListPrice: toNumberSafe(rawPrice),
    bedrooms_total: toNumberOrOriginal(rawBeds),
    BedroomsTotal: toNumberSafe(rawBeds),
    bathrooms_total_integer: toNumberOrOriginal(rawBaths),
    BathroomsTotalInteger: toNumberSafe(rawBaths),
    building_area_total: toNumberOrOriginal(rawSqft),
    total_actual_rent:
      prop.total_actual_rent == null
        ? undefined
        : String(prop.total_actual_rent),
    public_remarks: description,
    PublicRemarks: description,
    property_description: firstString(
      prop.property_description,
      getFirstDescriptionSectionBody(prop.description_sections_json),
      description,
    ),
    description_sections_json: parseDescriptionSections(
      prop.description_sections_json,
    ),
    custom_detail_blocks_json:
      prop.custom_detail_blocks_json ?? wpMetaValue(wpMeta, "custom_detail_blocks_json"),
    detail_blocks_layout_json:
      prop.detail_blocks_layout_json ?? wpMetaValue(wpMeta, "detail_blocks_layout_json"),
    listing_buttons_json:
      prop.listing_buttons_json ?? wpMetaValue(wpMeta, "listing_buttons_json"),
    rooms: resolvedRooms,
    Rooms: resolvedRooms,
    media,
    Media: media,
    featured_image_url: firstString(prop.featured_image_url, primaryImage),
    primary_image_url: firstString(prop.primary_image_url, primaryImage),
    image_filename: imageFilename,
    image_names: media
      .map((item) => (item as unknown as JsonMap).image_filename)
      .filter((x): x is string => typeof x === "string" && x.length > 0),
    modification_timestamp: firstString(
      prop.modification_timestamp,
      prop.ModificationTimestamp,
    ),
    ModificationTimestamp: firstString(
      prop.ModificationTimestamp,
      prop.modification_timestamp,
      new Date().toISOString(),
    ),
  } as Property;
}

export function normalizeEstateDetailRecord(
  rawProp: unknown,
  id?: string,
): Property {
  const prop = ((rawProp as JsonMap) || {}) as JsonMap;
  const key = `estate_${id || firstString(prop.id, prop.listing_key, prop.listing_id, "unknown")}`;

  const wpMeta = parseJsonLike(prop.wp_meta_json);
  const wpPost = parseJsonLike(prop.wp_post_json);
  const wpTerms = parseJsonLike(prop.wp_terms_json);
  const fallbackCoords = parseLatLngPair(
    wpMetaValue(wpMeta, "fave_property_location"),
  );
  const fallbackType = taxonomyLabel(wpTerms, "type", "property_type");
  const fallbackStatus = taxonomyLabel(wpTerms, "status", "property_status");
  const fallbackCountry = taxonomyLabel(wpTerms, "country");
  const fallbackAddress = firstString(
    prop.unparsed_address,
    prop.address,
    wpMetaValue(wpMeta, "fave_property_address", "fave_property_map_address"),
  );
  const fallbackCity = inferCityFromAddress(fallbackAddress);
  const fallbackProvince = inferProvinceFromAddress(fallbackAddress);
  const fallbackTitle = firstString(
    prop.property_title,
    prop.project_name,
    (wpPost.title as JsonMap | undefined)?.rendered,
    wpMetaValue(wpMeta, "post_title", "title"),
    prop.unparsed_address,
    key,
  );

  const enriched = {
    ...prop,
    id: firstString(prop.id, id),
    listing_key: key,
    ListingKey: key,
    PropertyKey: key,
    project_name: firstString(
      prop.project_name,
      prop.property_title,
      (wpPost.title as JsonMap | undefined)?.rendered,
      wpMetaValue(wpMeta, "post_title", "title"),
      prop.unparsed_address,
      key,
    ),
    property_title: firstString(
      prop.property_title,
      prop.project_name,
      (wpPost.title as JsonMap | undefined)?.rendered,
      wpMetaValue(wpMeta, "post_title", "title"),
      prop.unparsed_address,
      key,
    ),
    title: firstString(
      prop.title,
      fallbackTitle,
    ),
    city: firstString(
      prop.city,
      prop.location,
      wpMetaValue(wpMeta, "fave_property_city"),
      taxonomyLabel(wpTerms, "city", "property_city"),
      fallbackCity,
    ),
    City: firstString(
      prop.City,
      prop.city,
      prop.location,
      wpMetaValue(wpMeta, "fave_property_city"),
      taxonomyLabel(wpTerms, "city", "property_city"),
      fallbackCity,
    ),
    state_or_province: firstString(
      prop.state_or_province,
      prop.province,
      wpMetaValue(wpMeta, "fave_property_state"),
      prop.StateOrProvince,
      taxonomyLabel(wpTerms, "state"),
      fallbackProvince,
    ),
    StateOrProvince: firstString(
      prop.StateOrProvince,
      prop.state_or_province,
      prop.province,
      wpMetaValue(wpMeta, "fave_property_state"),
      taxonomyLabel(wpTerms, "state"),
      fallbackProvince,
    ),
    province: firstString(
      prop.province,
      prop.state_or_province,
      prop.StateOrProvince,
      wpMetaValue(wpMeta, "fave_property_state"),
      taxonomyLabel(wpTerms, "state"),
      fallbackProvince,
    ),
    standard_status: firstString(
      prop.standard_status,
      prop.publish_status,
      fallbackStatus,
      "For Sale",
    ),
    StandardStatus: firstString(
      prop.StandardStatus,
      prop.standard_status,
      prop.publish_status,
      fallbackStatus,
      "For Sale",
    ),
    property_sub_type: firstString(
      prop.property_sub_type,
      prop.PropertySubType,
      prop.PropertyType,
      wpMetaValue(wpMeta, "fave_property_type"),
      fallbackType,
      "Property",
    ),
    PropertySubType: firstString(
      prop.PropertySubType,
      prop.property_sub_type,
      prop.PropertyType,
      wpMetaValue(wpMeta, "fave_property_type"),
      fallbackType,
      "Property",
    ),
    public_remarks: firstString(
      prop.public_remarks,
      prop.PublicRemarks,
      getFirstDescriptionSectionBody(prop.description_sections_json),
      prop.property_description,
      wpMetaValue(wpMeta, "post_content", "description"),
      (wpPost.content as JsonMap | undefined)?.rendered,
      wpPost.excerpt,
    ),
    property_description: firstString(
      getFirstDescriptionSectionBody(prop.description_sections_json),
      prop.property_description,
      prop.public_remarks,
      prop.PublicRemarks,
      wpMetaValue(wpMeta, "post_content", "description"),
      (wpPost.content as JsonMap | undefined)?.rendered,
      wpPost.excerpt,
    ),
    description_sections_json: parseDescriptionSections(
      prop.description_sections_json,
    ),
    custom_detail_blocks_json:
      prop.custom_detail_blocks_json ?? wpMetaValue(wpMeta, "custom_detail_blocks_json"),
    detail_blocks_layout_json:
      prop.detail_blocks_layout_json ?? wpMetaValue(wpMeta, "detail_blocks_layout_json"),
    listing_buttons_json:
      prop.listing_buttons_json ?? wpMetaValue(wpMeta, "listing_buttons_json"),
    list_price:
      prop.list_price ??
      prop.ListPrice ??
      wpMetaValue(wpMeta, "fave_property_price", "sale_or_rent_price") ??
      prop.second_price,
    second_price:
      prop.second_price ??
      wpMetaValue(wpMeta, "second_price", "fave_property_sec_price"),
    bedrooms_total:
      prop.bedrooms_total ??
      prop.BedroomsTotal ??
      wpMetaValue(wpMeta, "fave_property_bedrooms"),
    bathrooms_total_integer:
      prop.bathrooms_total_integer ??
      prop.BathroomsTotalInteger ??
      wpMetaValue(wpMeta, "fave_property_bathrooms"),
    building_area_total:
      prop.building_area_total ??
      prop.living_area ??
      prop.LivingArea ??
      wpMetaValue(wpMeta, "fave_property_size"),
    lot_size_dimensions: firstString(
      prop.lot_size_dimensions,
      prop.lot_size,
      wpMetaValue(wpMeta, "fave_property_lot_size"),
    ),
    lot_size: firstString(
      prop.lot_size,
      wpMetaValue(wpMeta, "fave_property_lot_size"),
    ),
    land_area:
      prop.land_area ?? wpMetaValue(wpMeta, "fave_property_land", "land_area"),
    land_area_size_postfix: firstString(
      prop.land_area_size_postfix,
      wpMetaValue(wpMeta, "fave_property_land_postfix"),
    ),
    price_prefix: firstString(
      prop.price_prefix,
      wpMetaValue(wpMeta, "fave_property_size_prefix", "price_prefix"),
    ),
    size_postfix: firstString(
      prop.size_postfix,
      wpMetaValue(wpMeta, "fave_property_size_postfix", "size_postfix"),
    ),
    address: firstString(
      prop.address,
      prop.unparsed_address,
      wpMetaValue(wpMeta, "fave_property_address", "fave_property_map_address"),
    ),
    unparsed_address: firstString(
      prop.unparsed_address,
      prop.address,
      wpMetaValue(wpMeta, "fave_property_address", "fave_property_map_address"),
    ),
    postal_code: firstString(
      prop.postal_code,
      prop.PostalCode,
      prop.postalCode,
      wpMetaValue(wpMeta, "fave_property_zip"),
    ),
    PostalCode: firstString(
      prop.PostalCode,
      prop.postal_code,
      prop.postalCode,
      wpMetaValue(wpMeta, "fave_property_zip"),
    ),
    country: firstString(prop.country, fallbackCountry),
    latitude:
      prop.latitude ??
      prop.Latitude ??
      wpMetaValue(wpMeta, "houzez_geolocation_lat") ??
      fallbackCoords.lat,
    longitude:
      prop.longitude ??
      prop.Longitude ??
      wpMetaValue(wpMeta, "houzez_geolocation_long") ??
      fallbackCoords.lng,
    listing_id: firstString(
      prop.listing_id,
      wpMetaValue(wpMeta, "fave_mls-id", "fave_property_id"),
      key,
    ),
    property_id_code: firstString(
      prop.property_id_code,
      wpMetaValue(wpMeta, "fave_property_id", "property_id"),
    ),
    publish_status: firstString(prop.publish_status, wpPost.post_status),
    listing_url: firstString(
      prop.listing_url,
      wpMetaValue(wpMeta, "permalink"),
      wpPost.link,
    ),
    location: firstString(
      prop.location,
      prop.city,
      prop.City,
      fallbackCity,
    ),
    featured_image_url: firstString(
      prop.featured_image_url,
      wpMetaValue(wpMeta, "featured_image", "featured_image_url"),
      wpPost.featured_image_url,
    ),
    developer: firstString(
      prop.developer,
      wpMetaValue(wpMeta, "fave_property_developer", "developer"),
    ),
    occupancy_year:
      prop.occupancy_year ??
      wpMetaValue(wpMeta, "fave_property_occupancy", "occupancy"),
    year_built:
      prop.year_built ?? prop.YearBuilt ?? wpMetaValue(wpMeta, "year_built"),
    tax_annual_amount:
      prop.tax_annual_amount ?? wpMetaValue(wpMeta, "fave_taxes"),
    tax_year: prop.tax_year ?? wpMetaValue(wpMeta, "fave_tax-year"),
    garages:
      prop.garages ?? wpMetaValue(wpMeta, "fave_property_garage", "garages"),
    garage_size:
      prop.garage_size ??
      wpMetaValue(wpMeta, "fave_property_garage_size", "garage_size"),
    kitchens:
      prop.kitchens ??
      wpMetaValue(wpMeta, "fave_property_kitchens", "kitchens"),
    rooms: prop.rooms ?? wpMetaValue(wpMeta, "fave_property_rooms"),
    total_rooms:
      prop.total_rooms ?? wpMetaValue(wpMeta, "fave_property_rooms", "rooms"),
    basement: firstString(prop.basement, wpMetaValue(wpMeta, "fave_basement")),
    exterior_features: firstString(
      prop.exterior_features,
      wpMetaValue(wpMeta, "fave_exterior"),
    ),
    video_tour_url: firstString(
      prop.video_tour_url,
      prop.virtual_tour_url,
      wpMetaValue(wpMeta, "fave_video_url", "video_url"),
    ),
    modification_timestamp: firstString(
      prop.modification_timestamp,
      prop.ModificationTimestamp,
      wpPost.modified,
      wpPost.date,
    ),
  };

  return normalizeListingRecord(enriched, {
    forceListingKey: key,
    defaultStatus: "For Sale",
    defaultCity: "Unknown City",
    defaultType: "Property",
    defaultTitle: "Estate Listing",
  });
}
