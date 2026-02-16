// lib/api/types.ts

export interface Property {
  PropertyKey: string;
  ListingKey: string;
  list_price?: string;
  listing_key?: string;
  ListPrice: number;
  City: string;
  city?: string;
  StateOrProvince: string;
  PropertySubType: string;
  BedroomsTotal: number;
  bedrooms_total?: number;
  BathroomsTotalInteger: number;
  bathrooms_total_integer?: number;
  StandardStatus: string;
  standard_status?: string;
  ModificationTimestamp: string;
  unparsed_address?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  public_remarks?: string;
  media?: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }>;
  rooms?: Array<{
    room_type: string;
    room_level: string;
    room_length: string | null;
    room_width: string | null;
    room_dimensions: string;
  }>;
  category_type?: string;
  photos_count?: number;
  listing_url?: string;
  building_area_total?: string | null;
  year_built?: string | null;

  // Comparison fields
  address?: string;
  location?: string;
  province?: string;
  postalCode?: string;
  cooling?: string;
  basement?: string;
  zoning?: string;
  parking_total?: number;
  parking_features?: string;
  total_actual_rent?: string;

  // Legacy fields
  Photos?: any[];
  Media?: any[];
  Rooms?: any[];
  LivingArea?: number | null;
  YearBuilt?: number | null;
  LotSizeArea?: number | null;
  GarageSpaces?: number | null;
  ElementarySchool?: string | null;
  MiddleSchool?: string | null;
  HighSchool?: string | null;
  School?: string | null;
  DirectionsToProperty?: string | null;
  PrivateRemarks?: string | null;
  Description?: string;
  OriginalListPrice?: number | null;
  DaysOnMarket?: number | null;
  CumulativeDaysOnMarket?: number | null;
  PropertyType?: string;
  Zoning?: string | null;
  LotSizeDimensions?: string | null;
  ConstructionMaterials?: string | null;
  Architectural_Style?: string | null;
  Heating?: string | null;
  Cooling?: string | null;
  Utilities?: string | null;
  WaterSource?: string | null;
  Sewer?: string | null;
  Foundation?: string | null;
  Roof?: string | null;
  InteriorFeatures?: string | null;
  ExteriorFeatures?: string | null;
  Appliances?: string | null;
  CountyOrParish?: string | null;
  Directions?: string | null;
  PublicRemarks?: string;
  PostalCode?: string;
  Latitude?: string;
  Longitude?: string;
  [key: string]: any;
}

export interface PropertyFilterParams {
  city?: string;
  province?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_subtype?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ExclusivePropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  latitude_min?: number;
  latitude_max?: number;
  longitude_min?: number;
  longitude_max?: number;
  building_area_min?: number;
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

export interface LeasePropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  building_area_min?: number;
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

export interface PreConnPropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
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
