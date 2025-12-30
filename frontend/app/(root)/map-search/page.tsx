// pages/MapOnlyPage.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { ResultsPortal } from "@/components/map/SearchPortal";
import MapController from "@/components/map/MapController";
import StreetViewButton from "@/components/map/StreetViewButton";
import PropertyCard from "@/components/map/PropertyCard";

import SearchBox from "@/components/map/SearchBox";
import { fetchFilteredProperties } from "@/lib/api";
import { ApiProperty, PropertyMarker, NominatimResult } from "@/components/map/types";

// dynamic react-leaflet components (SSR safe)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

// SIMPLIFIED FilterBar - inline implementation
function SimpleFilterBar({
  filters,
  setFilters,
  onApply,
}: {
  filters: any;
  setFilters: (updater: any) => void;
  onApply: () => Promise<void> | void;
}) {
  const update = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-md">
      <div className="flex items-center gap-3 p-2 overflow-x-auto">
        <div className="flex flex-col min-w-[100px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={filters.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option value="">All</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[70px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Beds</label>
          <input
            type="number"
            value={filters.bedrooms ?? ""}
            onChange={(e) => update("bedrooms", e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-full"
            min={0}
            placeholder="Any"
          />
        </div>

        <div className="flex flex-col min-w-[70px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Baths</label>
          <input
            type="number"
            value={filters.bathrooms ?? ""}
            onChange={(e) => update("bathrooms", e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-full"
            min={0}
            placeholder="Any"
          />
        </div>

        <div className="flex flex-col min-w-[100px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Price Min</label>
          <input
            type="number"
            value={filters.price_min ?? ""}
            onChange={(e) => update("price_min", e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-full"
            placeholder="Min"
            min={0}
          />
        </div>

        <div className="flex flex-col min-w-[100px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Price Max</label>
          <input
            type="number"
            value={filters.price_max ?? ""}
            onChange={(e) => update("price_max", e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-full"
            placeholder="Max"
            min={0}
          />
        </div>

        <div className="flex flex-col min-w-[150px] flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1">Keywords</label>
          <input
            type="text"
            value={filters.keywords ?? ""}
            onChange={(e) => update("keywords", e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="pool, renovated..."
          />
        </div>

        <button
          onClick={() =>
            setFilters((prev: any) => ({
              ...prev,
              price_min: "",
              price_max: "",
              bedrooms: "",
              bathrooms: "",
              property_type: "",
              garage: "",
              keywords: "",
            }))
          }
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
        >
          Reset
        </button>

        <button
          onClick={onApply}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
          title="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <span className="text-sm">Search</span>
        </button>
      </div>
    </div>
  );
}

export default function MapOnlyPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://staging.vsell4u.ca";

  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; display_name?: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [drawing, setDrawing] = useState(false);
  const rectLayerRef = useRef<any | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  function debounce(fn: (...args: any[]) => void, delay: number) {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  const formatPrice = (price: string | number | undefined) => {
    if (price === undefined || price === null || price === "") return "Price not available";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (Number.isNaN(numPrice)) return String(price);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

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

  // Nominatim search
  const fetchResults = async (q: string) => {
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
      const data = (await res.json()) as NominatimResult[];
      setSearchResults(data ?? []);
      setResultsOpen(true);
      if (!data || data.length === 0) setSearchError("No results found.");
      setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
    } catch (err) {
      console.error(err);
      setSearchError("Failed to fetch results. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const debouncedSearch = useRef(
    debounce((value: string) => {
      if (value.trim().length > 0) {
        fetchResults(value.trim());
      } else {
        setSearchResults([]);
        setResultsOpen(false);
      }
    }, 400)
  ).current;

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!inputRef.current || inputRef.current.contains(e.target as Node)) return;
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  const customIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const selectedIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const applyFilters = async () => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setSelectedPropertyId(null);

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
          const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
          mapRef.current.fitBounds(bounds.pad(0.2));
        } catch { }
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // Drawing handlers
  const enableDrawing = () => {
    if (!mapRef.current) return;
    setDrawing(true);
    drawStartRef.current = null;
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch { }
      rectLayerRef.current = null;
    }

    mapRef.current.dragging.disable();
    mapRef.current.on("mousedown", onMapMouseDown);
    mapRef.current.getContainer().style.cursor = "crosshair";
  };

  const disableDrawing = () => {
    if (!mapRef.current) return;
    setDrawing(false);
    drawStartRef.current = null;
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch { }
      rectLayerRef.current = null;
    }
    mapRef.current.off("mousedown", onMapMouseDown);
    mapRef.current.off("mousemove", onMapMouseMove);
    mapRef.current.off("mouseup", onMapMouseUp);
    mapRef.current.dragging.enable();
    mapRef.current.getContainer().style.cursor = "";
  };

  const onMapMouseDown = (e: any) => {
    drawStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    mapRef.current.on("mousemove", onMapMouseMove);
    mapRef.current.on("mouseup", onMapMouseUp);
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch { }
      rectLayerRef.current = null;
    }
  };

  const onMapMouseMove = (e: any) => {
    if (!drawStartRef.current) return;
    const start = drawStartRef.current;
    const bounds = L.latLngBounds([start.lat, start.lng], [e.latlng.lat, e.latlng.lng]);
    if (!rectLayerRef.current) {
      rectLayerRef.current = L.rectangle(bounds, { color: "#3b82f6", weight: 2, fillOpacity: 0.08 }).addTo(mapRef.current);
    } else {
      rectLayerRef.current.setBounds(bounds);
    }
  };

  const onMapMouseUp = async (e: any) => {
    mapRef.current.off("mousemove", onMapMouseMove);
    mapRef.current.off("mouseup", onMapMouseUp);

    if (!drawStartRef.current) {
      setDrawing(false);
      return;
    }
    const start = drawStartRef.current;
    const end = { lat: e.latlng.lat, lng: e.latlng.lng };
    const latMin = Math.min(start.lat, end.lat);
    const latMax = Math.max(start.lat, end.lat);
    const lngMin = Math.min(start.lng, end.lng);
    const lngMax = Math.max(start.lng, end.lng);

    const bbox = {
      latitude_min: Number(latMin.toFixed(6)),
      latitude_max: Number(latMax.toFixed(6)),
      longitude_min: Number(lngMin.toFixed(6)),
      longitude_max: Number(lngMax.toFixed(6)),
    };

    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);
    setSelectedPropertyId(null);
    try {
      const data = await fetchExclusivePropertiesForBBox(bbox);
      const results = data?.results ?? [];
      const markers: PropertyMarker[] = results
        .map((p: ApiProperty, idx: number) => {
          const latRaw = p.latitude ?? p.Latitude ?? p.lat ?? p.coords?.lat;
          const lonRaw = p.longitude ?? p.Longitude ?? p.lon ?? p.coords?.lng;
          const lat = latRaw !== undefined ? Number(latRaw) : NaN;
          const lng = lonRaw !== undefined ? Number(lonRaw) : NaN;
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return {
            id: String(p.listing_key ?? p.listingKey ?? p.PropertyKey ?? idx),
            title: (p.city ? `${p.city}` : p.public_remarks ? String(p.public_remarks).slice(0, 40) : "Property") ?? "Property",
            price: p.list_price ?? p.ListPrice,
            lat,
            lng,
            raw: p,
          } as PropertyMarker;
        })
        .filter(Boolean) as PropertyMarker[];

      setApiMarkers(markers);
      if (markers.length > 0) {
        try {
          const group = markers.map((m) => [m.lat, m.lng]);
          const bounds = L.latLngBounds(group as any);
          mapRef.current.fitBounds(bounds.pad(0.2));
        } catch { }
      }
      setLoadingApi(false);
    } catch (err: any) {
      console.error("Failed to fetch exclusive properties:", err);
      setApiError(err.message || "Failed to fetch properties");
      setLoadingApi(false);
    } finally {
      setDrawing(false);
      drawStartRef.current = null;
      mapRef.current.dragging.enable();
      mapRef.current.getContainer().style.cursor = "";
      mapRef.current.off("mousedown", onMapMouseDown);
      mapRef.current.off("mousemove", onMapMouseMove);
      mapRef.current.off("mouseup", onMapMouseUp);
    }
  };

  const clearRectAndResults = () => {
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch { }
      rectLayerRef.current = null;
    }
    setApiMarkers([]);
    setApiError(null);
    setLoadingApi(false);
    setSelectedPropertyId(null);
  };

  const handleMapReady = (map: any) => {
    mapRef.current = map;
    try {
      map.scrollWheelZoom.enable();
    } catch { }
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
      "_blank"
    );
  };

  const markerToShow = searchResult ? { lat: searchResult.lat, lng: searchResult.lng, title: searchResult.display_name || "Search result" } : null;

  const selectResult = (r: NominatimResult) => {
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setSearchError("Invalid coordinates from geocoder");
      return;
    }
    setSearchResult({ lat, lng: lon, display_name: r.display_name });
    setResultsOpen(false);
    setSearchResults([]);
    setSearchError(null);

    if (mapRef.current) {
      try {
        mapRef.current.flyTo([lat, lon], 14, { animate: true, duration: 1.2 });
      } catch (err) {
        console.error("Failed to move map:", err);
      }
    }
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        selectResult(searchResults[0]);
        return;
      }
      const trimmed = searchQuery.trim();
      if (trimmed) await fetchResults(trimmed);
    } else if (e.key === "ArrowDown") {
      const portal = document.querySelector("[role='listbox']");
      const first = portal?.querySelector("button");
      (first as HTMLElement | null)?.focus();
    }
  };

  const onInputChange = (value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    setResultsOpen(true);
    setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
    setSearchResults([]);
    setResultsOpen(false);
  };

  return (
    <div className="w-full px-4 pt-24 pb-6">
      <Header />

      <div className="flex flex-col gap-6">
        {/* Status messages */}
        {(searchError || searchResult || loadingApi || apiError || apiMarkers.length > 0) && (
          <div className="text-center">
            {searchError && <div className="text-sm text-red-600">{searchError}</div>}
            {!searchError && searchResult && <div className="text-sm text-gray-700">📍 {searchResult.display_name}</div>}
            {loadingApi && <div className="text-sm text-gray-600">Loading properties...</div>}
            {!loadingApi && apiError && <div className="text-sm text-red-600">Error: {apiError}</div>}
            {!loadingApi && !apiError && apiMarkers.length > 0 && (
              <div className="text-sm text-gray-700 font-medium">{apiMarkers.length} properties found</div>
            )}
          </div>
        )}

        {/* MAP CONTAINER */}
        <div className="relative" style={{ height: "65vh", minHeight: "400px" }}>
          {/* Map wrapper */}
          <div ref={mapContainerRef} className="absolute inset-0 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <MapContainer key="main-map" center={[43.65, -79.385]} zoom={13} className="w-full h-full">
              <MapController
                onMapReady={handleMapReady}
                onMapClick={(lat, lng) => {
                  if (!drawing) window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, "_blank");
                }}
              />
              <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

              {apiMarkers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]} icon={selectedPropertyId === m.id ? selectedIcon : customIcon} eventHandlers={{ click: () => setSelectedPropertyId(m.id) }}>
                  <Popup>
                    <div className="max-w-xs">
                      <strong className="text-lg">{m.title}</strong>
                      <br />
                      <div className="my-2"><span className="font-semibold">Price:</span> {formatPrice(m.price)}</div>
                      <div className="text-sm text-gray-600">
                        <div><span className="font-medium">Bedrooms:</span> {m.raw?.bedrooms_total || "N/A"}</div>
                        <div><span className="font-medium">Bathrooms:</span> {m.raw?.bathrooms_total_integer || "N/A"}</div>
                        <div><span className="font-medium">Property Type:</span> {m.raw?.property_sub_type || "N/A"}</div>
                        <div><span className="font-medium">Status:</span> {m.raw?.standard_status || "N/A"}</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Coordinates: {m.lat.toFixed(6)}, {m.lng.toFixed(6)}</div>
                      <StreetViewButton lat={m.lat} lng={m.lng} />
                    </div>
                  </Popup>
                </Marker>
              ))}

              {markerToShow && (
                <Marker position={[markerToShow.lat, markerToShow.lng]} icon={customIcon}>
                  <Popup>
                    <div>
                      <strong>📍 {markerToShow.title}</strong>
                      <br />
                      <small className="text-gray-500">Coordinates: {markerToShow.lat.toFixed(6)}, {markerToShow.lng.toFixed(6)}</small>
                      <StreetViewButton lat={markerToShow.lat} lng={markerToShow.lng} />
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* CONTROLS SECTION - Below map */}
        <div className="bg-white shadow-2xl border border-gray-300 rounded-xl p-4 -mt-4 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Search box */}
            <div className="w-full md:w-auto">
              <SearchBox
                inputRef={inputRef}
                value={searchQuery}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                onClear={clearSearch}
              />
            </div>

            {/* SIMPLE FilterBar - Inline implementation */}
            <div className="flex-1 w-full">
              <SimpleFilterBar
                filters={filters}
                setFilters={setFilters}
                onApply={applyFilters}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!drawing ? (
                <button
                  onClick={enableDrawing}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  title="Draw area"
                >
                  <span className="flex items-center gap-1">
                    <span>✏️</span>
                    <span>Draw Area</span>
                  </span>
                </button>
              ) : (
                <button
                  onClick={disableDrawing}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                  title="Cancel drawing"
                >
                  <span className="flex items-center gap-1">
                    <span>✖</span>
                    <span>Cancel</span>
                  </span>
                </button>
              )}

              <button
                onClick={clearRectAndResults}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                title="Clear results"
              >
                <span className="flex items-center gap-1">
                  <span>🗑️</span>
                  <span>Clear</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Search results portal */}
        {resultsOpen && searchResults.length > 0 && <ResultsPortal anchorRect={anchorRect} results={searchResults} onSelect={selectResult} />}

        {/* Property cards grid */}
        {apiMarkers.length > 0 && (
          <div className="mt-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Properties ({apiMarkers.length})</h2>
                <span className="text-sm text-gray-500">{selectedPropertyId ? "1 selected" : "Click a property to select"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {apiMarkers.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewOnMap={() => handleViewOnMap(property)}
                  onViewStreetView={() => handleViewStreetView(property)}
                  isSelected={selectedPropertyId === property.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}