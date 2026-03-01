"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Layout components
import Header from "@/components/Header";
import { ResultsPortal } from "@/components/map/SearchPortal";
import MapController from "@/components/map/MapController";
import StreetViewButton from "@/components/map/StreetViewButton";
import { MapSidebar } from "@/components/map/MapSidebar";
import { MapOverlayControls } from "@/components/map/MapOverlayControls";
import { SearchThisAreaButton } from "@/components/map/SearchThisAreaButton";

// Hooks & state
import { useMapSearch } from "@/hooks/useMapSearch";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { getCustomIcon, getSelectedIcon } from "@/components/map/MapIcons";
import { formatPrice } from "@/lib/helpers";

// Types
import { PropertyMarker } from "@/components/map/types";
import { Property } from "@/lib/api/types";

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

export default function MapOnlyPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://staging.vsell4u.ca";
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom Hooks
  const {
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
  } = useMapSearch(API_BASE_URL);

  const {
    searchQuery,
    searchResults,
    searchResult,
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
    if (mapRef.current) {
      mapRef.current.flyTo([res.lat, res.lng], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  });

  // Special handler for drawing finish
  const onFinishDrawing = async (bbox: any) => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setSelectedPropertyId(null);
    try {
      const data = await fetchExclusivePropertiesForBBox(bbox);
      const results = data?.results ?? [];
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

  const { drawing, enableDrawing, disableDrawing, clearRect } = useMapDrawing(
    mapRef,
    onFinishDrawing,
  );

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
  }, []);

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
  }, [resultsOpen, searchQuery]);

  useEffect(() => {
    return () => {
      try {
        if (mapRef.current && typeof mapRef.current.remove === "function") {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (err) {
        console.warn("Error while removing leaflet map on unmount:", err);
      }
    };
  }, []);

  if (!mounted || !L) {
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

  const handleMapReady = (map: any) => {
    mapRef.current = map;
    try {
      map.scrollWheelZoom.enable();
      map.on("moveend", () => {
        if (!loadingApi && !drawing) setShowSearchThisArea(true);
      });
    } catch {}
  };

  const clearAll = () => {
    clearRect();
    setApiMarkers([]);
    setApiError(null);
    setLoadingApi(false);
    setSelectedPropertyId(null);
    setShowSearchThisArea(false);
  };

  const handleViewOnMap = (property: PropertyMarker) => {
    setSelectedPropertyId(property.id);
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
        if (mapRef.current)
          mapRef.current.flyTo([lat, lon], 14, {
            animate: true,
            duration: 1.2,
          });
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Header />

      <main
        className="flex-1 relative flex flex-col"
        style={{ paddingTop: "var(--navbar-height, 64px)" }}
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
              onToggleDrawing={drawing ? disableDrawing : enableDrawing}
              onClearAll={clearAll}
              loading={loadingApi}
            />

            <SearchThisAreaButton
              loading={loadingApi}
              onClick={() => handleSearchThisArea(mapRef)}
            />
            <MapContainer
              center={[43.65, -79.385]}
              zoom={13}
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <MapController
                onMapReady={handleMapReady}
                onMapClick={() => setSelectedPropertyId(null)}
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
                  eventHandlers={{ click: () => setSelectedPropertyId(m.id) }}
                >
                  <Popup>
                    <div className="max-w-xs p-1">
                      <h3 className="font-bold text-ds-heading text-base leading-tight mb-1">
                        {m.title}
                      </h3>
                      <p className="text-ds-primary font-extrabold text-lg mb-2">
                        {formatPrice(m.price)}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ds-body border-t border-gray-100 pt-2 pb-3">
                        <div className="flex justify-between">
                          <span>Beds:</span>{" "}
                          <span className="font-bold">
                            {m.raw?.bedrooms_total || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Baths:</span>{" "}
                          <span className="font-bold">
                            {m.raw?.bathrooms_total_integer || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>{" "}
                          <span className="font-bold">
                            {m.raw?.property_sub_type || "N/A"}
                          </span>
                        </div>
                      </div>
                      <StreetViewButton lat={m.lat} lng={m.lng} />
                    </div>
                  </Popup>
                </Marker>
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
              apiMarkers={apiMarkers}
              selectedPropertyId={selectedPropertyId}
              onViewOnMap={handleViewOnMap}
              onViewStreetView={handleViewStreetView}
            />
          </div>
        </div>

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
