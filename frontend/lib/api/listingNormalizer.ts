import type { Property, PropertyMedia } from "./types";

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
]);

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

function toCleanString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
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

function extractCandidateStrings(value: unknown, out: string[], depth = 0): void {
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

function getRawMediaCandidates(prop: JsonMap, wpMeta: JsonMap, wpPost: JsonMap): string[] {
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

export function normalizeListingRecord(
  rawProp: unknown,
  options: NormalizeListingOptions = {},
): Property {
  const prop = ((rawProp as JsonMap) || {}) as JsonMap;
  const wpMeta = parseJsonLike(prop.wp_meta_json);
  const wpPost = parseJsonLike(prop.wp_post_json);

  const normalizedCity =
    firstString(prop.city, prop.City, prop.location, options.defaultCity) || "Unknown City";
  const normalizedProvince = firstString(
    prop.state_or_province,
    prop.StateOrProvince,
    prop.province,
    wpMeta.fave_property_state,
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
      wpMeta.fave_property_type,
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
    prop.list_price ?? prop.ListPrice ?? wpMeta.fave_property_price ?? wpMeta.sale_or_rent_price;
  const rawBeds = prop.bedrooms_total ?? prop.BedroomsTotal ?? wpMeta.fave_property_bedrooms;
  const rawBaths =
    prop.bathrooms_total_integer ??
    prop.BathroomsTotalInteger ??
    wpMeta.fave_property_bathrooms;
  const rawSqft =
    prop.building_area_total ??
    prop.LivingArea ??
    prop.living_area ??
    wpMeta.fave_property_size;

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
    state_or_province: firstString(prop.state_or_province, normalizedProvince),
    StateOrProvince: firstString(prop.StateOrProvince, normalizedProvince),
    province: firstString(prop.province, normalizedProvince),
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
      prop.total_actual_rent == null ? undefined : String(prop.total_actual_rent),
    public_remarks: description,
    PublicRemarks: description,
    property_description: firstString(prop.property_description, description),
    rooms: Array.isArray(prop.rooms)
      ? prop.rooms
      : Array.isArray(prop.Rooms)
        ? prop.Rooms
        : [],
    Rooms: Array.isArray(prop.rooms)
      ? prop.rooms
      : Array.isArray(prop.Rooms)
        ? prop.Rooms
        : [],
    media,
    Media: media,
    featured_image_url: firstString(prop.featured_image_url, primaryImage),
    primary_image_url: firstString(prop.primary_image_url, primaryImage),
    image_filename: imageFilename,
    image_names: media
      .map((item) => (item as unknown as JsonMap).image_filename)
      .filter((x): x is string => typeof x === "string" && x.length > 0),
  } as Property;
}
