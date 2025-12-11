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
import FilterBar from "@/components/map/FilterBar";
import { fetchFilteredProperties } from "@/lib/api";
import { ApiProperty, PropertyMarker, NominatimResult } from "@/components/map/types";

// dynamic react-leaflet components (SSR safe)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function MapOnlyPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any | null>(null);

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

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // helpers: debounce, formatPrice, fetchExclusivePropertiesForBBox, etc.
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

  // Nominatim search helpers (unchanged)
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
      if (!data || data.length === 0) {
        setSearchError("No results found.");
      }
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

  // click-away handling for portal, updateRect, unmount cleanup - same as before
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

  // applyFilters (unchanged)
  const applyFilters = async () => {
    setLoadingApi(true);
    setApiError(null);
    setApiMarkers([]);

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
        } catch {}
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // Drawing handlers (unchanged)
  const enableDrawing = () => {
    if (!mapRef.current) return;
    setDrawing(true);
    drawStartRef.current = null;
    if (rectLayerRef.current) {
      try { rectLayerRef.current.remove(); } catch {}
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
      try { rectLayerRef.current.remove(); } catch {}
      rectLayerRef.current = null;
    }
    mapRef.current.off("mousedown", onMapMouseDown);
    mapRef.current.off("mousemove", onMapMouseMove);
    mapRef.current.off("mouseup", onMapMouseUp);
    mapRef.current.dragging.enable();
    mapRef.current.getContainer().style.cursor = "";
  };

  // (rest of the drawing + map/marker logic unchanged)...
  // For brevity I have preserved the rest of your component logic unchanged from your previous file.
  // (Select result handlers, onMapMouseDown/Move/Up, clearRectAndResults, handleMapReady, marker rendering, etc.)
  // Inserted below exactly as in your existing file:

  const onMapMouseDown = (e: any) => {
    drawStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    mapRef.current.on("mousemove", onMapMouseMove);
    mapRef.current.on("mouseup", onMapMouseUp);
    if (rectLayerRef.current) {
      try { rectLayerRef.current.remove(); } catch {}
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
            title: (p.city ? `${p.city}` : (p.public_remarks ? String(p.public_remarks).slice(0, 40) : "Property")) ?? "Property",
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
        } catch {}
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
      try { rectLayerRef.current.remove(); } catch {}
      rectLayerRef.current = null;
    }
    setApiMarkers([]);
    setApiError(null);
    setLoadingApi(false);
    setSelectedPropertyId(null);
  };

  const handleMapReady = (map: any) => {
    mapRef.current = map;
    try { map.scrollWheelZoom.enable(); } catch {}
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
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`, "_blank");
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
    <div className="w-full px-4 pt-[140px] pb-6 pt-24">
      <Header />

      {/* Single top container: merged visual header */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow p-3 flex flex-wrap items-center gap-4">
          {/* FilterBar rendered transparent (no card) so it visually lives inside the parent */}
          <div className="flex-1 min-w-[360px]">
            <FilterBar filters={filters} setFilters={setFilters} onApply={applyFilters} transparent />
          </div>

          {/* Search + Draw controls grouped on the right */}
          <div className="flex items-center gap-3">
            <div className="min-w-[320px]">
              <SearchBox inputRef={inputRef} value={searchQuery} onChange={onInputChange} onKeyDown={onKeyDown} onClear={clearSearch} />
            </div>

            {!drawing ? (
              <button onClick={enableDrawing} className="px-4 py-2 bg-white shadow-sm rounded-md hover:bg-gray-50 border border-gray-200 flex items-center gap-2" title="Draw area to search">
                <span className="text-lg">✏️</span>
                <span className="hidden md:inline text-black">Draw Area</span>
              </button>
            ) : (
              <button onClick={disableDrawing} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2" title="Cancel drawing">
                <span className="text-lg">✖</span>
                <span className="hidden md:inline">Cancel</span>
              </button>
            )}

            {(apiMarkers.length > 0 || rectLayerRef.current) && (
              <button onClick={clearRectAndResults} className="px-3 py-2 bg-white shadow-sm rounded-md hover:bg-gray-50 border border-gray-200" title="Clear results">
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* status/messages and map remain exactly the same as your previous implementation */}
      {/* ... (rest of file continues unchanged - map, markers, popups, sidebar) */}
      {/* For brevity, rest of file is unchanged from your previous version and should work as before. */}
      {/* If you need the full file with no ellipses, tell me and I'll paste it verbatim. */}
      {/* (Everything after the top container is unchanged.) */}

      {/* status / messages */}
      {(searchError || searchResult || loadingApi || apiError || apiMarkers.length > 0) && (
        <div className="mb-4 text-center">
          {searchError && <div className="text-sm text-red-600">{searchError}</div>}
          {!searchError && searchResult && <div className="text-sm text-gray-700">📍 {searchResult.display_name}</div>}
          {loadingApi && <div className="text-sm text-gray-600">Loading properties...</div>}
          {!loadingApi && apiError && <div className="text-sm text-red-600">Error: {apiError}</div>}
          {!loadingApi && !apiError && apiMarkers.length > 0 && <div className="text-sm text-gray-700">{apiMarkers.length} properties found</div>}
        </div>
      )}

      {resultsOpen && searchResults.length > 0 && <ResultsPortal anchorRect={anchorRect} results={searchResults} onSelect={selectResult} />}

      <div className="flex gap-6">
        {/* Map container */}
        <div className="relative flex-1 rounded-lg shadow-lg border border-gray-200" style={{ height: "80vh", zIndex: 0, overflow: "visible" }}>
          <MapContainer key="main-map" center={[43.65, -79.385]} zoom={13} className="w-full h-full">
            <MapController onMapReady={handleMapReady} onMapClick={(lat, lng) => { if (!drawing) window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, "_blank"); }} />
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

        {/* Property cards sidebar */}
        {apiMarkers.length > 0 && (
          <div className="w-1/3">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Properties ({apiMarkers.length})</h2>
                <span className="text-sm text-gray-500">{selectedPropertyId ? "1 selected" : "Click to select"}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Click on a property card or marker to select it</p>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "75vh" }}>
              {apiMarkers.map((property) => (
                <PropertyCard key={property.id} property={property} onViewOnMap={() => handleViewOnMap(property)} onViewStreetView={() => handleViewStreetView(property)} isSelected={selectedPropertyId === property.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
