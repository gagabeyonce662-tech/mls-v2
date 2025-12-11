// types/property.ts
export type ApiProperty = {
  listing_key?: string;
  list_price?: number | string;
  property_sub_type?: string;
  city?: string;
  postal_code?: string;
  unparsed_address?: string;
  bedrooms_total?: number | string;
  bathrooms_total_integer?: number | string;
  building_area_total?: number | string;
  listing_id?: string;
  city_region?: string;
  year_built?: number | string;
  public_remarks?: string;
  listing_url?: string;
  category_type?: string;
  state_or_province?: string;
  latitude?: string | number;
  longitude?: string | number;
  photos_count?: number;
  standard_status?: string;
  media?: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }>;
  rooms?: Array<{
    room_type: string;
    room_level: string;
    room_length?: string;
    room_width?: string;
    room_dimensions?: string;
  }>;
  [key: string]: any;
};

export type PropertyMarker = {
  id: string;
  title: string;
  price?: string | number;
  lat: number;
  lng: number;
  raw?: ApiProperty;
};

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};