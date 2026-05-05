"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { env } from "@/lib/env";

// Layout components
import Header from "@/components/Header";
import { ResultsPortal } from "@/components/map/SearchPortal";
import MapController from "@/components/map/MapController";
import StreetViewButton from "@/components/map/StreetViewButton";
import { MapSidebar } from "@/components/map/MapSidebar";
import { MapOverlayControls } from "@/components/map/MapOverlayControls";
import { SearchThisAreaButton } from "@/components/map/SearchThisAreaButton";
import MapPropertyCard from "@/components/map/MapPropertyCard";
import MobilePropertyBottomSheet from "@/components/map/MobilePropertyBottomSheet";

// Hooks & state
import { useMapSearch } from "@/hooks/useMapSearch";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getCustomIcon, getSelectedIcon } from "@/components/map/MapIcons";

// Types
import { AggregateCellMarker, PropertyMarker } from "@/components/map/types";
import { getDrillTargetZoom } from "@/hooks/useMapAggregates";
import { Property } from "@/lib/api/types";
import { useWatched } from "@/contexts/WatchedContext";
import { isPointInPolygon, type LatLngPoint } from "@/lib/map/polygon";

// Dynamic leaflet imports
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false },
);
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), {
  ssr: false,
});

const DEFAULT_CENTER: [number, number] = [43.65, -79.385];
const DEFAULT_ZOOM = 9;
const FALLBACK_PARAM_ZOOM = 14;
const AUTO_ZOOM_OUT_REFRESH_DEBOUNCE_MS = 700;

function LoadingShell() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-ds-primary" />
        <p className="text-ds-body font-medium">
          Preparing immersive map experience...
        </p>
      </div>
    </div>
  );
}

type ParsedMapParams = {
  initialCenter: [number, number];
  initialZoom: number;
  hasUrlCoords: boolean;
  targetListingId: string | null;
};

function parseMapParams(searchParams: URLSearchParams | null): ParsedMapParams {
  const fallback: ParsedMapParams = {
    initialCenter: DEFAULT_CENTER,
    initialZoom: DEFAULT_ZOOM,
    hasUrlCoords: false,
    targetListingId: null,
  };
  if (!searchParams) return fallback;

  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const zoomRaw = searchParams.get("zoom");
  const idRaw = searchParams.get("id");
  const trimmedId = idRaw ? idRaw.trim() : "";
  const targetListingId = trimmedId.length > 0 ? trimmedId : null;

  const lat = latRaw !== null && latRaw !== "" ? Number(latRaw) : NaN;
  const lng = lngRaw !== null && lngRaw !== "" ? Number(lngRaw) : NaN;
  const coordsValid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!coordsValid) {
    return { ...fallback, targetListingId };
  }

  let zoom = FALLBACK_PARAM_ZOOM;
  if (zoomRaw !== null && zoomRaw !== "") {
    const parsedZoom = Number(zoomRaw);
    if (Number.isFinite(parsedZoom)) {
      const clamped = Math.round(parsedZoom);
      if (clamped >= 1 && clamped <= 20) {
        zoom = clamped;
      }
    }
  }

  return {
    initialCenter: [lat, lng],
    initialZoom: zoom,
    hasUrlCoords: true,
    targetListingId,
  };
}

function MapOnlyPageInner() {
  const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
  const searchParams = useSearchParams();
  const { initialCenter, initialZoom, hasUrlCoords, targetListingId } = useMemo(
    () => parseMapParams(searchParams),
    [searchParams],
  );
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialSearchDone = useRef(false);
  const autoSelectAppliedRef = useRef(false);
  const previousZoomRef = useRef<number | null>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );
  const handleSearchThisAreaRef = useRef<(mapRef: React.MutableRefObject<any>) => Promise<void>>(
    async () => {},
  );
  const interactionStateRef = useRef({
    loadingApi: false,
    drawing: false,
    hasActiveShape: false,
    mapDataMode: "listings" as "aggregates" | "listings",
  });
  const [selectedAggregateId, setSelectedAggregateId] = useState<string | null>(
    null,
  );
  const isMobile = useIsMobile();

  // Custom Hooks
  const {
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
    LISTING_ZOOM_MIN,
  } = useMapSearch(API_BASE_URL);

  const { addToHistory } = useWatched();

  const selectedMarker = useMemo<PropertyMarker | null>(() => {
    if (!selectedPropertyId) return null;
    return apiMarkers.find((m) => m.id === selectedPropertyId) ?? null;
  }, [apiMarkers, selectedPropertyId]);

  /** After geocode flyTo finishes, load listings (or aggregates) for the new viewport. */
  const flyToGeocodeResultAndFetchArea = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;
      const onMoveEnd = () => {
        void handleSearchThisArea(mapRef);
      };
      map.once("moveend", onMoveEnd);
      try {
        map.flyTo([lat, lng], 14, {
          animate: true,
          duration: 1.2,
        });
      } catch {
        map.off("moveend", onMoveEnd);
      }
    },
    [handleSearchThisArea],
  );

  const {
    searchQuery,
    searching,
    searchResults,
    searchResult,
    searchError,
    resultsOpen,
    anchorRect,
    onInputChange,
    clearSearch,
    selectResult,
    setResultsOpen,
    setSearchResult,
    setSearchError,
    setSearchResults,
    setAnchorRect,
  } = useGeocoding(inputRef, (res) => {
    flyToGeocodeResultAndFetchArea(res.lat, res.lng);
  });

  // Special handler for drawing finish
  const onFinishDrawing = async ({
    mode,
    bbox,
    polygon,
  }: {
    mode: "rectangle" | "polygon";
    bbox: {
      latitude_min: number;
      latitude_max: number;
      longitude_min: number;
      longitude_max: number;
    };
    polygon?: LatLngPoint[];
  }) => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setAggregateMarkers([]);
    setMapDataMode("listings");
    setSelectedPropertyId(null);
    try {
      const data = await fetchExclusivePropertiesForBBox(bbox);
      let results = data?.results ?? [];
      if (mode === "polygon" && polygon && polygon.length >= 4) {
        results = results.filter((p: Property) => {
          const latRaw = p.latitude ?? p.Latitude ?? p.lat ?? p.coords?.lat;
          const lonRaw = p.longitude ?? p.Longitude ?? p.lon ?? p.coords?.lng;
          const lat = latRaw !== undefined ? Number(latRaw) : NaN;
          const lng = lonRaw !== undefined ? Number(lonRaw) : NaN;
          if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
          return isPointInPolygon({ lat, lng }, polygon);
        });
      }
      const markers: PropertyMarker[] = results
        .map((p: Property, idx: number) => {
          const latRaw = p.latitude ?? p.Latitude ?? p.lat ?? p.coords?.lat;
          const lonRaw = p.longitude ?? p.Longitude ?? p.lon ?? p.coords?.lng;
          const lat = latRaw !== undefined ? Number(latRaw) : NaN;
          const lng = lonRaw !== undefined ? Number(lonRaw) : NaN;
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return {
            id: String(p.listing_key ?? p.listingKey ?? p.PropertyKey ?? idx),
            title:
              (p.city
                ? `${p.city}`
                : p.public_remarks
                  ? String(p.public_remarks).slice(0, 40)
                  : "Property") ?? "Property",
            price: p.list_price ?? p.ListPrice,
            lat,
            lng,
            raw: p,
          } as PropertyMarker;
        })
        .filter(Boolean) as PropertyMarker[];

      setApiMarkers(markers);
      if (markers.length > 0 && mapRef.current) {
        try {
          const group = markers.map((m) => [m.lat, m.lng]);
          const bounds = L.latLngBounds(group as any);
          mapRef.current.fitBounds(bounds.pad(0.2));
        } catch {}
      }
      setLoadingApi(false);
    } catch (err: any) {
      console.error("Failed to fetch exclusive properties:", err);
      setApiError(err.message || "Failed to fetch properties");
      setLoadingApi(false);
    }
  };

  const {
    drawing,
    drawingMode,
    hasActiveShape,
    polygonPointCount,
    enableDrawing,
    disableDrawing,
    finishPolygonDrawing,
    clearShape,
  } = useMapDrawing(mapRef, L, onFinishDrawing);

  useEffect(() => {
    handleSearchThisAreaRef.current = handleSearchThisArea;
  }, [handleSearchThisArea]);

  useEffect(() => {
    interactionStateRef.current = {
      loadingApi,
      drawing,
      hasActiveShape,
      mapDataMode,
    };
  }, [loadingApi, drawing, hasActiveShape, mapDataMode]);

  useEffect(() => {
    return () => {
      if (autoRefreshTimerRef.current) {
        window.clearTimeout(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, []);

  // Lifecycles
  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!inputRef.current || inputRef.current.contains(e.target as Node))
        return;
      const target = e.target as Node;
      setTimeout(() => {
        const portalContainer = document.querySelector("[role='listbox']");
        if (portalContainer && portalContainer.contains(target)) return;
        setResultsOpen(false);
      }, 0);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [setResultsOpen]);

  useEffect(() => {
    if (mapDataMode === "listings") {
      setSelectedAggregateId(null);
    }
  }, [mapDataMode]);

  // Auto-select the property whose listing_key matches the URL `id` once area
  // markers load. Runs only once per page load — user clicks elsewhere stick.
  useEffect(() => {
    if (autoSelectAppliedRef.current) return;
    if (!targetListingId) return;
    if (!apiMarkers || apiMarkers.length === 0) return;
    const match = apiMarkers.find((m) => m.id === targetListingId);
    if (!match) return;
    autoSelectAppliedRef.current = true;
    setSelectedPropertyId(targetListingId);
  }, [apiMarkers, targetListingId, setSelectedPropertyId]);

  useEffect(() => {
    function updateRect() {
      const el = inputRef.current;
      setAnchorRect(el ? el.getBoundingClientRect() : null);
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [resultsOpen, searchQuery, setAnchorRect]);

  if (!mounted || !L) {
    return <LoadingShell />;
  }

  const handleMapReady = (map: any) => {
    mapRef.current = map;
    try {
      // Belt-and-suspenders: ensure URL-supplied coords are applied even if
      // MapContainer's initial props were stale due to HMR or a race.
      if (hasUrlCoords) {
        try {
          map.setView(initialCenter, initialZoom, { animate: false });
        } catch {}
      }
      map.scrollWheelZoom.enable();
      // Pan/zoom alone does NOT call the backend — only reveals "Properties in this area".
      // Data loads on initial handleSearchThisArea, that button click, or aggregate drill moveend.
      map.on("moveend", () => {
        const state = interactionStateRef.current;
        if (!state.loadingApi && !state.drawing && !state.hasActiveShape) {
          setShowSearchThisArea(true);
        }
      });
      map.on("zoomend", () => {
        const currentZoom = map.getZoom?.() ?? DEFAULT_ZOOM;
        const previousZoom = previousZoomRef.current;
        previousZoomRef.current = currentZoom;
        const state = interactionStateRef.current;

        if (!state.loadingApi && !state.drawing && !state.hasActiveShape) {
          setShowSearchThisArea(true);
        }

        const zoomedOut = previousZoom !== null && currentZoom < previousZoom;
        const droppedBelowListingZoom = currentZoom < LISTING_ZOOM_MIN;
        const shouldAutoRefreshToAggregates =
          zoomedOut &&
          droppedBelowListingZoom &&
          state.mapDataMode === "listings" &&
          !state.loadingApi &&
          !state.drawing &&
          !state.hasActiveShape;

        if (!shouldAutoRefreshToAggregates) return;

        if (autoRefreshTimerRef.current) {
          window.clearTimeout(autoRefreshTimerRef.current);
        }
        autoRefreshTimerRef.current = window.setTimeout(() => {
          const latestState = interactionStateRef.current;
          if (
            latestState.loadingApi ||
            latestState.drawing ||
            latestState.hasActiveShape
          ) {
            return;
          }
          void handleSearchThisAreaRef.current(mapRef);
        }, AUTO_ZOOM_OUT_REFRESH_DEBOUNCE_MS);
      });
      // Auto-load properties for the initial viewport — only once
      if (!initialSearchDone.current) {
        initialSearchDone.current = true;
        void handleSearchThisAreaRef.current({ current: map });
      }
    } catch {}
  };

  const clearAll = () => {
    clearShape();
    setApiMarkers([]);
    setAggregateMarkers([]);
    setMapDataMode("listings");
    setApiError(null);
    setLoadingApi(false);
    setSelectedPropertyId(null);
    setSelectedAggregateId(null);
    setShowSearchThisArea(false);
    resetMapFetchDedupe();
  };

  const handleViewOnMap = (property: PropertyMarker) => {
    setSelectedPropertyId(property.id);
    if (property.raw) {
      addToHistory(property.raw);
    }
    if (mapRef.current) {
      mapRef.current.flyTo([property.lat, property.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  const handleViewStreetView = (property: PropertyMarker) => {
    window.open(
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`,
      "_blank",
    );
  };

  const onSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        const r = searchResults[0];
        const lat = Number(r.lat);
        const lon = Number(r.lon);
        setSearchResult({ lat, lng: lon, display_name: r.display_name });
        setResultsOpen(false);
        setSearchResults([]);
        flyToGeocodeResultAndFetchArea(lat, lon);
        return;
      }
    }
  };

  const markerToShow = searchResult
    ? {
        lat: searchResult.lat,
        lng: searchResult.lng,
        title: searchResult.display_name || "Search result",
      }
    : null;

  const onAggregateCellClick = (cell: AggregateCellMarker) => {
    if (!mapRef.current || mapDataMode !== "aggregates") return;
    const map = mapRef.current;
    const currentZoom = map.getZoom?.() ?? 0;
    const targetZoom = getDrillTargetZoom(currentZoom);
    if (targetZoom === null) {
      return;
    }
    setSelectedAggregateId(cell.id);
    setSelectedPropertyId(null);
    setLoadingApi(true);
    setShowSearchThisArea(false);
    const onMoveEnd = () => {
      void handleSearchThisArea(mapRef);
    };
    map.once("moveend", onMoveEnd);
    try {
      map.flyTo([cell.lat, cell.lng], targetZoom, {
        animate: true,
        duration: 1.0,
      });
    } catch {
      map.off("moveend", onMoveEnd);
      setLoadingApi(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Header />

      <main
        className="flex-1 relative flex flex-col"
      >
        <div className="flex-1 relative overflow-hidden">
          <div className="w-full h-full relative bg-ds-card">
            <MapOverlayControls
              searchQuery={searchQuery}
              onInputChange={onInputChange}
              onKeyDown={onSearchKeyDown}
              clearSearch={clearSearch}
              inputRef={inputRef}
              filters={filters}
              setFilters={setFilters}
              applyFilters={() => applyFilters(L, mapRef)}
              drawing={drawing}
              drawingMode={drawingMode}
              onStartRectangleDrawing={() => enableDrawing("rectangle")}
              onStartPolygonDrawing={() => enableDrawing("polygon")}
              onCancelDrawing={disableDrawing}
              onClearAll={clearAll}
              loading={loadingApi}
            />

            <SearchThisAreaButton
              loading={loadingApi}
              onClick={() => handleSearchThisArea(mapRef)}
              visible={showSearchThisArea}
            />
            {(apiError || searchError || searching) && (
              <div className="absolute top-32 lg:top-20 left-3 right-3 lg:left-4 lg:right-[400px] z-[46] lg:z-[1002] space-y-2 pointer-events-none">
                {searching ? (
                  <div className="pointer-events-auto rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                    Looking up locations...
                  </div>
                ) : null}
                {searchError ? (
                  <div className="pointer-events-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
                    {searchError}
                  </div>
                ) : null}
                {apiError ? (
                  <div className="pointer-events-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm">
                    Could not update listings right now. Please try “Properties in this area” again.
                  </div>
                ) : null}
              </div>
            )}
            {drawing && drawingMode === "polygon" && (
              <div className="absolute top-32 lg:top-20 left-0 right-0 lg:right-[380px] xl:left-[380px] z-[45] lg:z-[1001] flex justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={() => void finishPolygonDrawing()}
                  disabled={loadingApi || polygonPointCount < 3}
                  className="pointer-events-auto bg-white text-ds-primary shadow-2xl border border-ds-card-border hover:bg-gray-50 rounded-full px-4 py-1.5 lg:px-6 lg:py-2 flex items-center gap-2 h-auto disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs lg:text-sm"
                >
                  Finish Polygon
                  <span className="text-[10px] lg:text-xs font-medium text-ds-body">
                    ({polygonPointCount}/5 points)
                  </span>
                </button>
              </div>
            )}
            <MapContainer
              center={initialCenter}
              zoom={initialZoom}
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <MapController
                onMapReady={handleMapReady}
                onMapClick={() => {
                  setSelectedPropertyId(null);
                  setSelectedAggregateId(null);
                }}
              />
              <TileLayer
                attribution="&copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {apiMarkers.map((m) => (
                <Marker
                  key={m.id}
                  position={[m.lat, m.lng]}
                  icon={
                    selectedPropertyId === m.id
                      ? getSelectedIcon(L)
                      : getCustomIcon(L)
                  }
                  eventHandlers={{
                    click: () => {
                      setSelectedPropertyId(m.id);
                      if (m.raw) addToHistory(m.raw);
                    },
                  }}
                >
                  {!isMobile && (
                    <Popup
                      maxWidth={300}
                      minWidth={260}
                      closeButton
                      autoPan
                    >
                      <MapPropertyCard marker={m} compact />
                    </Popup>
                  )}
                </Marker>
              ))}

              {mapDataMode === "aggregates" &&
                aggregateMarkers.map((cell) => (
                  <CircleMarker
                    key={cell.id}
                    center={[cell.lat, cell.lng]}
                    radius={Math.min(24, Math.max(10, Math.log2(cell.property_count + 1) * 4))}
                    pathOptions={{
                      color:
                        selectedAggregateId === cell.id ? "#0f172a" : "#1d4ed8",
                      fillColor:
                        selectedAggregateId === cell.id ? "#1e40af" : "#2563eb",
                      fillOpacity:
                        selectedAggregateId === cell.id ? 0.65 : 0.45,
                      weight: selectedAggregateId === cell.id ? 2.5 : 1.5,
                    }}
                    eventHandlers={{
                      click: () => onAggregateCellClick(cell),
                    }}
                  >
                    <Tooltip
                      permanent
                      interactive={false}
                      direction="center"
                      offset={[0, 0]}
                      opacity={1}
                      className="map-aggregate-count-tooltip pointer-events-none"
                    >
                      <span className="font-semibold text-[11px] text-slate-900">
                        {cell.property_count} properties
                      </span>
                    </Tooltip>
                  </CircleMarker>
                ))}

              {markerToShow && (
                <Marker
                  position={[markerToShow.lat, markerToShow.lng]}
                  icon={getCustomIcon(L)}
                >
                  <Popup>
                    <div className="p-1">
                      <strong className="block mb-1">
                        📍 {markerToShow.title}
                      </strong>
                      <StreetViewButton
                        lat={markerToShow.lat}
                        lng={markerToShow.lng}
                      />
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            <MapSidebar
              apiMarkers={mapDataMode === "listings" ? apiMarkers : []}
              selectedPropertyId={selectedPropertyId}
              onViewOnMap={handleViewOnMap}
              onViewStreetView={handleViewStreetView}
              loading={loadingApi}
              emptyMessage={
                mapDataMode === "aggregates"
                  ? "Zoom in to explore individual listings in this area."
                  : undefined
              }
            />
          </div>
        </div>

        {isMobile && (
          <MobilePropertyBottomSheet
            marker={selectedMarker}
            onClose={() => setSelectedPropertyId(null)}
          />
        )}

        {mapDataMode === "aggregates" && (
          <div className="absolute bottom-6 right-6 z-[520] rounded-xl border border-blue-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold text-slate-800">
              Area density mode
            </p>
            <p className="text-xs text-slate-600">
              Zoom in to level {LISTING_ZOOM_MIN}+ for listing markers
            </p>
          </div>
        )}

        {resultsOpen && searchResults.length > 0 && (
          <ResultsPortal
            anchorRect={anchorRect}
            results={searchResults}
            onSelect={selectResult}
          />
        )}
      </main>
    </div>
  );
}

export default function MapOnlyPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <MapOnlyPageInner />
    </Suspense>
  );
}
