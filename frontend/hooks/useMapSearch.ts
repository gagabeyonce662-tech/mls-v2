import { useState, useRef } from "react";
import { fetchFilteredProperties } from "@/lib/api";
import { AggregateCellMarker, PropertyMarker } from "@/components/map/types";
import { Property } from "@/lib/api/types";
import {
  fetchMapAggregatesForBBox,
  LISTING_ZOOM_MIN,
  LOW_ZOOM_MAX,
  MID_ZOOM_MAX,
  shouldUseAggregateMode,
} from "@/hooks/useMapAggregates";

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
  const activeRequestController = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef(0);
  /** Skip redundant map fetches when bbox+zoom+filters unchanged (belt-and-suspenders with server cache). */
  const lastMapFetchSignatureRef = useRef<string | null>(null);
  const lastMapFetchAtRef = useRef(0);
  const CLIENT_MAP_FETCH_DEDUPE_MS = 60_000;

  const buildMapFilterParams = () => {
    const params: Record<string, string | boolean> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof value === "boolean" && !value) return;
      if (key === "garage" || key === "sold_days" || key === "modified_since") return;
      params[key] = typeof value === "string" ? value.trim() : (value as boolean);
    });
    return params;
  };

  const beginLatestRequest = () => {
    requestSequenceRef.current += 1;
    const requestId = requestSequenceRef.current;
    if (activeRequestController.current) {
      activeRequestController.current.abort();
    }
    const controller = new AbortController();
    activeRequestController.current = controller;
    return { requestId, controller };
  };

  const isLatestRequest = (requestId: number) =>
    requestSequenceRef.current === requestId;

  const resetMapFetchDedupe = () => {
    lastMapFetchSignatureRef.current = null;
    lastMapFetchAtRef.current = 0;
  };

  /**
   * Map bbox listings: same universe as aggregate cells (local Property + filter API),
   * not the exclusive-only endpoint — keeps cluster counts consistent with pins.
   */
  async function fetchExclusivePropertiesForBBox(
    bbox: {
      latitude_min: number;
      latitude_max: number;
      longitude_min: number;
      longitude_max: number;
    },
    filtersForMap?: Record<string, string | boolean>,
    signal?: AbortSignal,
  ) {
    const effectiveFilters = filtersForMap ?? buildMapFilterParams();
    return await fetchFilteredProperties(
      {
        lat_min: bbox.latitude_min,
        lat_max: bbox.latitude_max,
        lng_min: bbox.longitude_min,
        lng_max: bbox.longitude_max,
        limit: 100,
        offset: 0,
        ...effectiveFilters,
      },
      signal ? { signal } : undefined,
    );
  }

  const applyFilters = async (L: any, mapRef: React.MutableRefObject<any>) => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setAggregateMarkers([]);
    setMapDataMode("listings");
    setSelectedPropertyId(null);
    setShowSearchThisArea(false);
    resetMapFetchDedupe();

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
    const mapFilters = buildMapFilterParams();
    const fetchSignature = JSON.stringify({
      z: zoom,
      b: [
        Math.round(bbox.latitude_min * 1e5) / 1e5,
        Math.round(bbox.latitude_max * 1e5) / 1e5,
        Math.round(bbox.longitude_min * 1e5) / 1e5,
        Math.round(bbox.longitude_max * 1e5) / 1e5,
      ],
      f: mapFilters,
    });
    const now = Date.now();
    if (
      lastMapFetchSignatureRef.current === fetchSignature &&
      now - lastMapFetchAtRef.current < CLIENT_MAP_FETCH_DEDUPE_MS
    ) {
      setShowSearchThisArea(false);
      return;
    }

    const { requestId, controller } = beginLatestRequest();

    setLoadingApi(true);
    setShowSearchThisArea(false);
    setApiError(null);
    let completedOk = false;
    try {
      if (shouldUseAggregateMode(zoom)) {
        try {
          const data = await fetchMapAggregatesForBBox(
            API_BASE_URL,
            bbox,
            zoom,
            mapFilters,
            controller.signal,
          );
          if (!isLatestRequest(requestId)) return;
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
        } catch (aggregateErr: any) {
          if (aggregateErr?.name === "AbortError") return;
          // Graceful fallback: if aggregate endpoint fails, still show listing markers.
          console.warn(
            "Map aggregate fetch failed; falling back to listing markers:",
            aggregateErr,
          );
          const data = await fetchExclusivePropertiesForBBox(
            bbox,
            mapFilters,
            controller.signal,
          );
          if (!isLatestRequest(requestId)) return;
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
          setApiError(
            "Density view is temporarily unavailable. Showing listing markers instead.",
          );
        }
      } else {
        const data = await fetchExclusivePropertiesForBBox(
          bbox,
          mapFilters,
          controller.signal,
        );
        if (!isLatestRequest(requestId)) return;
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
      completedOk = true;
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setApiError(err?.message || "Failed to load map data");
    } finally {
      if (isLatestRequest(requestId)) {
        setLoadingApi(false);
        if (completedOk) {
          lastMapFetchSignatureRef.current = fetchSignature;
          lastMapFetchAtRef.current = Date.now();
        }
      }
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
    resetMapFetchDedupe,
    fetchExclusivePropertiesForBBox,
    fetchMapAggregatesForBBox: (bbox: any, zoom: number) =>
      fetchMapAggregatesForBBox(API_BASE_URL, bbox, zoom),
    LOW_ZOOM_MAX,
    MID_ZOOM_MAX,
    LISTING_ZOOM_MIN,
  };
};
