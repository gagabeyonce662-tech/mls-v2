// lib/api/types.ts

// --- Sub-types for Property ---

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

export interface Property {
  // Core Identifiers
  PropertyKey: string;
  ListingKey: string;
  listing_key?: string;
  listing_url?: string;

  // Financials
  ListPrice: number;
  list_price?: string;
  OriginalListPrice?: number | null;
  total_actual_rent?: string;

  // Location Details
  City: string;
  city?: string;
  StateOrProvince: string;
  province?: string;
  PostalCode?: string;
  postal_code?: string;
  unparsed_address?: string;
  address?: string; // Normalized
  location?: string; // Normalized
  Latitude?: string;
  Longitude?: string;
  latitude?: string;
  longitude?: string;

  // Physical Stats
  PropertySubType: string;
  PropertyType?: string;
  category_type?: string;
  BedroomsTotal: number;
  bedrooms_total?: number;
  BathroomsTotalInteger: number;
  bathrooms_total_integer?: number;
  building_area_total?: string | null;
  LivingArea?: number | null;
  YearBuilt?: number | null;
  year_built?: string | null;
  LotSizeArea?: number | null;
  LotSizeDimensions?: string | null;

  // Status & Metadata
  StandardStatus: string;
  standard_status?: string;
  ModificationTimestamp: string;
  photos_count?: number;
  DaysOnMarket?: number | null;
  CumulativeDaysOnMarket?: number | null;

  // Features
  Cooling?: string | null;
  cooling?: string;
  Heating?: string | null;
  basement?: string;
  zoning?: string;
  Zoning?: string | null;
  parking_total?: number;
  parking_features?: string;
  ConstructionMaterials?: string | null;
  Architectural_Style?: string | null;
  Utilities?: string | null;
  WaterSource?: string | null;
  Sewer?: string | null;
  Foundation?: string | null;
  Roof?: string | null;
  InteriorFeatures?: string | null;
  ExteriorFeatures?: string | null;
  Appliances?: string | null;

  // Remarks
  public_remarks?: string;
  PublicRemarks?: string;
  PrivateRemarks?: string | null;
  Description?: string;
  DirectionsToProperty?: string | null;
  Directions?: string | null;

  // Schools
  School?: string | null;
  ElementarySchool?: string | null;
  MiddleSchool?: string | null;
  HighSchool?: string | null;

  // Media & Rooms (Normalized)
  media?: PropertyMedia[];
  rooms?: PropertyRoom[];
  Media?: PropertyMedia[]; // Legacy
  Rooms?: PropertyRoom[]; // Legacy
  Photos?: any[]; // Legacy

  // Catch-all for API flexibility
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
  video_file?: string;
  thumbnail?: string;
  author?: number;
  category: VlogCategory | null;
  tags: string[];
  status: string;
  publish_date?: string;
  created_at: string;
  updated_at: string;
  allow_comments: boolean;
}
