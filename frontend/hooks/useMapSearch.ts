import { useState, useCallback } from "react";
import {
  fetchFilteredProperties,
  mapPropertyFromAPI,
  fetchAPI,
} from "@/lib/api";
import { AggregateCellMarker, PropertyMarker } from "@/components/map/types";
import { Property } from "@/lib/api/types";

const LOW_ZOOM_MAX = 9;
const MID_ZOOM_MAX = 12;
const LISTING_ZOOM_MIN = 13;

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
  const [aggregateMarkers, setAggregateMarkers] = useState<AggregateCellMarker[]>(
    [],
  );
  const [mapDataMode, setMapDataMode] = useState<"aggregates" | "listings">(
    "listings",
  );
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
    params.append("limit", "100"); // Increase default for map view
    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/?${params.toString()}`;

    return await fetchAPI<any>(url, { cache: "no-store" });
  }

  async function fetchMapAggregatesForBBox(
    bbox: {
      latitude_min: number;
      latitude_max: number;
      longitude_min: number;
      longitude_max: number;
    },
    zoom: number,
  ) {
    const params = new URLSearchParams();
    Object.entries(bbox).forEach(([k, v]) => params.append(k, String(v)));
    params.append("zoom", String(zoom));

    const url = `${API_BASE_URL}/api/mls/properties/map-aggregates/?${params.toString()}`;
    return await fetchAPI<any>(url, { cache: "no-store" });
  }

  const applyFilters = async (L: any, mapRef: React.MutableRefObject<any>) => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setAggregateMarkers([]);
    setMapDataMode("listings");
    setSelectedPropertyId(null);
    setShowSearchThisArea(false);

    try {
      const data = await fetchFilteredProperties(filters);

      const markers = (data.results ?? [])
        .map((p: Property, idx: number) => {
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
    const zoom = mapRef.current.getZoom?.() ?? LISTING_ZOOM_MIN;

    setLoadingApi(true);
    setShowSearchThisArea(false);
    try {
      if (zoom < LISTING_ZOOM_MIN) {
        const data = await fetchMapAggregatesForBBox(bbox, zoom);
        const aggregates = (data.results ?? [])
          .map((cell: any, idx: number) => ({
            id: String(cell.h3_index || idx),
            h3_index: String(cell.h3_index || idx),
            resolution: Number(cell.resolution ?? 0),
            property_count: Number(cell.property_count ?? 0),
            lat: Number(cell.center_lat),
            lng: Number(cell.center_lng),
          }))
          .filter(
            (cell: any) =>
              !isNaN(cell.lat) && !isNaN(cell.lng) && cell.property_count > 0,
          );

        setMapDataMode("aggregates");
        setAggregateMarkers(aggregates);
        setApiMarkers([]);
      } else {
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

        setMapDataMode("listings");
        setApiMarkers(markers);
        setAggregateMarkers([]);
      }
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
    aggregateMarkers,
    setAggregateMarkers,
    mapDataMode,
    setMapDataMode,
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
    fetchMapAggregatesForBBox,
    LOW_ZOOM_MAX,
    MID_ZOOM_MAX,
    LISTING_ZOOM_MIN,
  };
};
