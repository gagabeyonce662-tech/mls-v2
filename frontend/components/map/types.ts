import { Property } from "@/lib/api/types";

export type PropertyMarker = {
  id: string;
  title: string;
  price?: string | number;
  lat: number;
  lng: number;
  raw?: Property;
};

export type AggregateCellMarker = {
  id: string;
  h3_index: string;
  resolution: number;
  property_count: number;
  lat: number;
  lng: number;
};

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  country_code?: string;
  address?: {
    country_code?: string;
  };
};
