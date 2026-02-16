import { useState, useCallback } from "react";
import { fetchFilteredProperties, mapPropertyFromAPI } from "@/lib/api";
import { PropertyMarker, ApiProperty } from "@/components/map/types";

export const useMapSearch = (API_BASE_URL: string) => {
  const [filters, setFilters] = useState<any>({
    price_min: "",
    price_max: "",
    bedrooms: "",
    bathrooms: "",
    city: "",
    province: "",
    postal_code: "",
    property_type: "",
    status: "",
    has_lease: false,
    has_photos: false,
    search: "",
    keywords: "",
    sold_days: "",
    modified_since: "",
    garage: "",
  });

  const [apiMarkers, setApiMarkers] = useState<PropertyMarker[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  async function fetchExclusivePropertiesForBBox(bbox: {
    latitude_min: number;
    latitude_max: number;
    longitude_min: number;
    longitude_max: number;
  }) {
    const params = new URLSearchParams();
    Object.entries(bbox).forEach(([k, v]) => params.append(k, String(v)));
    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Exclusive API error ${res.status}: ${txt}`);
    }
    return await res.json();
  }

  const applyFilters = async (L: any, mapRef: React.MutableRefObject<any>) => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setSelectedPropertyId(null);
    setShowSearchThisArea(false);

    try {
      const data = await fetchFilteredProperties(filters);

      const markers = (data.results ?? [])
        .map((p: ApiProperty, idx: number) => {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return {
            id: String(p.listing_key || idx),
            title: p.unparsed_address || p.city || "Property",
            price: p.list_price,
            lat,
            lng,
            raw: p,
          } as PropertyMarker;
        })
        .filter(Boolean) as PropertyMarker[];

      setApiMarkers(markers);

      if (mapRef.current && markers.length > 0) {
        try {
          const bounds = L.latLngBounds(
            markers.map((m: any) => [m.lat, m.lng]),
          );
          mapRef.current.fitBounds(bounds.pad(0.2));
        } catch {}
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  const handleSearchThisArea = async (mapRef: React.MutableRefObject<any>) => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    const bbox = {
      latitude_min: bounds.getSouth(),
      latitude_max: bounds.getNorth(),
      longitude_min: bounds.getWest(),
      longitude_max: bounds.getEast(),
    };

    setLoadingApi(true);
    setShowSearchThisArea(false);
    try {
      const data = await fetchExclusivePropertiesForBBox(bbox);
      const markers = (data.results ?? [])
        .map((p: any, idx: number) => ({
          id: String(p.listing_key || idx),
          title: p.unparsed_address || p.city || "Property",
          price: p.list_price,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          raw: p,
        }))
        .filter((m: any) => !isNaN(m.lat) && !isNaN(m.lng));

      setApiMarkers(markers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApi(false);
    }
  };

  return {
    filters,
    setFilters,
    apiMarkers,
    setApiMarkers,
    loadingApi,
    setLoadingApi,
    apiError,
    setApiError,
    selectedPropertyId,
    setSelectedPropertyId,
    showSearchThisArea,
    setShowSearchThisArea,
    applyFilters,
    handleSearchThisArea,
    fetchExclusivePropertiesForBBox,
  };
};
