// lib/api/types.ts

// --- Common Base Types ---

export interface PropertyMedia {
  media_url: string;
  media_category: string;
  is_preferred: boolean;
  order: number;
}

export interface PropertyRoom {
  room_type: string;
  room_level: string;
  room_length: string | null;
  room_width: string | null;
  room_dimensions: string;
}

/**
 * Main Property interface representing normalized MLS data.
 * This is the primary type used throughout the frontend.
 */
export interface Property {
  // Core Identifiers
  listing_key?: string;
  listing_id?: string;
  listing_url?: string;

  // Financials
  list_price?: number | string;
  total_actual_rent?: string;
  lease_amount?: string;
  lease_measure?: string;

  // Location Details
  unparsed_address?: string;
  address?: string; // Normalized
  city?: string;
  city_region?: string;
  province?: string;
  state_or_province?: string;
  postal_code?: string;
  latitude?: string | number;
  longitude?: string | number;
  location?: string; // Normalized
  project_name?: string;

  // Physical Stats
  property_sub_type?: string;
  category_type?: string;
  bedrooms_total?: number | string;
  bathrooms_total_integer?: number | string;
  building_area_total?: string | number | null;
  year_built?: string | number | null;
  lot_size_area?: number | null;
  lot_size_dimensions?: string | null;

  // Status & Metadata
  standard_status?: string;
  photos_count?: number;
  days_on_market?: number | null;
  modification_timestamp?: string;

  // Features
  cooling?: string;
  heating?: string;
  basement?: string;
  zoning?: string;
  parking_total?: number;
  parking_features?: string;
  construction_materials?: string;
  architectural_style?: string;
  utilities?: string;
  water_source?: string;
  sewer?: string;
  foundation?: string;
  roof?: string;
  interior_features?: string;
  exterior_features?: string;
  appliances?: string;

  // Remarks
  public_remarks?: string;
  private_remarks?: string | null;
  directions?: string | null;

  // Media & Rooms
  media?: PropertyMedia[];
  rooms?: PropertyRoom[];

  // --- External Data Support ---
  isFavorite?: boolean;

  // --- Legacy & Raw Data Support ---
  // These fields are often provided by the RETS/MLS source in PascalCase
  PropertyKey?: string;
  ListingKey?: string;
  ListPrice?: number;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  PropertySubType?: string;
  StandardStatus?: string;
  ModificationTimestamp?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  YearBuilt?: number | null;
  LivingArea?: number | null;
  PublicRemarks?: string;
  Photos?: any[]; // Legacy PhotoURL format
  Media?: PropertyMedia[]; // Legacy Media format
  Rooms?: PropertyRoom[]; // Legacy Rooms format

  // Catch-all for API flexibility and raw spread data
  [key: string]: any;
}

// --- Filter Parameters ---

export interface BaseFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  province?: string;
  postal_code?: string;
  property_sub_type?: string;
  property_type?: string;
  building_area_min?: number;
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  standard_status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PropertyFilterParams extends BaseFilterParams {
  property_subtype?: string; // Legacy naming support
  status?: string; // Legacy naming support
}

export interface ExclusivePropertyFilterParams extends BaseFilterParams {
  latitude_min?: number;
  latitude_max?: number;
  longitude_min?: number;
  longitude_max?: number;
  new_listings_days?: number;
}

export interface LeasePropertyFilterParams extends BaseFilterParams {
  new_listings_days?: number;
}

export interface PreConnPropertyFilterParams extends BaseFilterParams {
  // Currently identical to base but kept for domain clarity
}

export interface PropertyTypeOption {
  value: string;
  label: string;
  count?: number;
}

export type HomepageCategoryKind =
  | "newly_listed"
  | "exclusive"
  | "rental"
  | "precon"
  | "property_type";

export interface HomepageCategory {
  key: string;
  kind: HomepageCategoryKind;
  label: string;
  count: number;
  enabled: boolean;
  route: string;
  query?: Record<string, string>;
  source: "backend" | "fallback";
  order: number;
}

export interface HomepageCategoryCatalog {
  categories: HomepageCategory[];
  fetchedAt: string;
}

export interface FeedbackSubmissionPayload {
  page_url?: string;
  name?: string;
  email?: string;
  feedback_type: "general" | "bug" | "feature";
  message: string;
}

export type PropertyInquiryIntent = "buy" | "sell" | "rent" | "explore";

export interface PropertyInquiryPayload {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  intent?: PropertyInquiryIntent;
  message: string;
  preferred_locations?: string;
  property_types?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  bedrooms_min?: number | null;
  bathrooms_min?: number | null;
  timeline?: string;
  page_url?: string;
}

export interface School {
  name: string;
  operator: string;
  amenity: string;
  phone: string;
  website: string;
  address: string;
  distance_meters: number;
  distance_km: number;
  osm_id: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface NearestSchoolsResponse {
  user_location: { lat: number; lon: number };
  nearest_schools: School[];
  total_found: number;
  search_radius_m: number;
}

export interface MapAggregateCell {
  h3_index: string;
  resolution: number;
  center_lat: number;
  center_lng: number;
  property_count: number;
  updated_at?: string;
}

export interface MapAggregatesResponse {
  mode: "aggregates" | "listings";
  resolution: number | null;
  count?: number;
  results: MapAggregateCell[];
  message?: string;
}

export interface VlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface VlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  embed_url?: string;
  video_url?: string;
  video_file?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  author?: number;
  category: VlogCategory | null;
  tags: string[];
  status: string;
  publish_date?: string;
  created_at: string;
  updated_at: string;
  allow_comments: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  focus_keyword?: string;
  seo_canonical_url?: string;
  seo_noindex?: boolean;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image_url?: string;
}
