import { Property } from "@/lib/api/types";

export type PropertyMarker = {
  id: string;
  title: string;
  price?: string | number;
  lat: number;
  lng: number;
  raw?: Property;
};

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};
