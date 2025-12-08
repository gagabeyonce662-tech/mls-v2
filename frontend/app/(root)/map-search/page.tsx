"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";

// Dynamically import react-leaflet components (SSR safe)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const { useMap } = (() => {
  try {
    return require("react-leaflet");
  } catch {
    return { useMap: () => null };
  }
})();

type ApiProperty = {
  listing_key?: string;
  list_price?: number | string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
  public_remarks?: string;
  [key: string]: any;
};

type PropertyMarker = {
  id: string;
  title: string;
  price?: string | number;
  lat: number;
  lng: number;
  raw?: ApiProperty;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to open Street View
const openStreetView = (lat: number, lng: number, title?: string) => {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const streetViewWindow = window.open(url, "_blank");
  if (streetViewWindow) {
    streetViewWindow.focus();
  } else {
    alert("Please allow popups for this site to open Street View");
  }
};

// Helper to call exclusive-properties API with bbox params
async function fetchExclusivePropertiesForBBox(bbox: {
  latitude_min: number;
  latitude_max: number;
  longitude_min: number;
  longitude_max: number;
}) {
  const params = new URLSearchParams();
  Object.entries(bbox).forEach(([k, v]) => params.append(k, String(v)));
  const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/?${params.toString()}`;
  console.log("Fetching exclusive properties:", url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Exclusive API error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data;
}

// ---------------- PORTAL ----------------
function ResultsPortal({
  anchorRect,
  results,
  onSelect,
}: {
  anchorRect: DOMRect | null;
  results: NominatimResult[];
  onSelect: (r: NominatimResult) => void;
}) {
  if (typeof window === "undefined" || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    left: Math.max(8, anchorRect.left) + "px",
    top: anchorRect.bottom + window.scrollY + 6 + "px",
    width: Math.min(anchorRect.width, window.innerWidth - 16) + "px",
    maxHeight: "320px",
    overflow: "auto",
    background: "white",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 999999,
    border: "1px solid rgba(0,0,0,0.06)",
  };

  return ReactDOM.createPortal(
    <div style={style} role="listbox">
      {results.map((r) => (
        <button
          key={r.place_id}
          onClick={() => onSelect(r)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <div style={{ fontSize: 14 }}>{r.display_name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {`${r.lat.slice(0, 9)}, ${r.lon.slice(0, 9)}`}
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
}

// ---------------- MAP CONTROLLER ----------------
function MapController({ 
  onMapReady,
  onMapClick 
}: { 
  onMapReady: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    onMapReady(map);
    
    // Add click handler to the map
    map.on('click', (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
    
    return () => {
      map.off('click');
    };
  }, [map, onMapReady, onMapClick]);
  
  return null;
}

// ---------------- STREET VIEW BUTTON IN POPUP ----------------
function StreetViewButton({ lat, lng, title }: { lat: number; lng: number; title?: string }) {
  return (
    <button
      onClick={() => openStreetView(lat, lng, title)}
      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
      title="Open Street View in new tab"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
      </svg>
      Open Street View
    </button>
  );
}

export default function MapOnlyPage() {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any | null>(null);

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

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // click-away handling for portal
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!inputRef.current || inputRef.current.contains(e.target as Node)) {
        return;
      }
      const target = e.target as Node;
      setTimeout(() => {
        const portalContainer = document.querySelector("[role='listbox']");
        if (portalContainer && portalContainer.contains(target)) {
          return;
        }
        setResultsOpen(false);
      }, 0);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // update anchor rect for portal positioning
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

  // Handle map click for Street View
  const handleMapClick = (lat: number, lng: number) => {
    // Only open Street View if not in drawing mode
    if (!drawing) {
      openStreetView(lat, lng);
    }
  };

  // Nominatim search helpers
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

  // Input handlers
  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        selectResult(searchResults[0]);
        return;
      }
      const trimmed = searchQuery.trim();
      if (trimmed) {
        await fetchResults(trimmed);
      }
    } else if (e.key === "ArrowDown") {
      const portal = document.querySelector("[role='listbox']");
      const first = portal?.querySelector("button");
      (first as HTMLElement | null)?.focus();
    }
  };

  const onInputChange = async (value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    if (!value.trim()) {
      setSearchResults([]);
      setResultsOpen(false);
      return;
    }
    await fetchResults(value.trim());
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchError(null);
    setSearchResults([]);
    setResultsOpen(false);
  };

  // DRAWING: enable/disable draw mode
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

  // Rectangle event handlers
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

  // Clear rectangle and api markers
  const clearRectAndResults = () => {
    if (rectLayerRef.current) {
      try { rectLayerRef.current.remove(); } catch {}
      rectLayerRef.current = null;
    }
    setApiMarkers([]);
    setApiError(null);
    setLoadingApi(false);
  };

  const handleMapReady = (map: any) => {
    mapRef.current = map;
    try { map.scrollWheelZoom.enable(); } catch {}
  };

  const markerToShow = searchResult ? { 
    lat: searchResult.lat, 
    lng: searchResult.lng, 
    title: searchResult.display_name || "Search result" 
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Map Search — Draw Area & Query API</h1>
          
        </div>

        <div className="flex gap-2">
          {!drawing ? (
            <button
              onClick={enableDrawing}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Draw area
            </button>
          ) : (
            <button
              onClick={disableDrawing}
              className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Cancel drawing
            </button>
          )}
          <button
            onClick={clearRectAndResults}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Clear results
          </button>
        </div>
      </div>

      {/* API status */}
      <div className="mb-3 text-sm">
        {loadingApi && <span className="text-gray-600">Loading properties from API…</span>}
        {!loadingApi && apiError && <span className="text-red-600">API error: {apiError}</span>}
        {!loadingApi && !apiError && apiMarkers.length > 0 && (
          <span className="text-gray-700">{apiMarkers.length} properties loaded. Click on markers for details.</span>
        )}
        {!loadingApi && !apiError && apiMarkers.length === 0 && (
          <span className="text-gray-600">No properties loaded yet — draw an area to query the API.</span>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="mb-4 relative">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search place or address (e.g., Toronto, Queen St)"
            className="flex-1 px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            aria-label="Search places"
            autoComplete="off"
            onFocus={() => {
              setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
              if (searchResults.length > 0) setResultsOpen(true);
            }}
          />
          <button
            type="button"
            onClick={async () => {
              if (searchResults.length > 0) {
                selectResult(searchResults[0]);
                return;
              }
              const trimmed = searchQuery.trim();
              if (trimmed) await fetchResults(trimmed);
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            disabled={searching}
          >
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        <div className="mt-2 text-sm text-center text-gray-700">
          {searchError && <span className="text-red-600">{searchError}</span>}
          {!searchError && searchResult && <span>📍 Showing: {searchResult.display_name}</span>}
        </div>
      </div>

      {/* Portal results */}
      {resultsOpen && searchResults.length > 0 && (
        <ResultsPortal anchorRect={anchorRect} results={searchResults} onSelect={selectResult} />
      )}

      {/* MAP */}
      <div className="rounded-lg overflow-hidden shadow-md" style={{ height: "90vh", minHeight: 640 }}>
        <MapContainer center={[43.65, -79.385]} zoom={13} className="w-full h-full">
          <MapController onMapReady={handleMapReady} onMapClick={handleMapClick} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Render API markers with Street View button in popup */}
          {apiMarkers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={customIcon}>
              <Popup>
                <div>
                  <strong>{m.title}</strong>
                  <br />
                  {m.price ? `Price: ${m.price}` : null}
                  <br />
                  <small className="text-gray-500">
                    Coordinates: {m.lat.toFixed(6)}, {m.lng.toFixed(6)}
                  </small>
                  <StreetViewButton lat={m.lat} lng={m.lng} title={m.title} />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render search marker on top if present (no Street View button for search result) */}
          {markerToShow && (
            <Marker position={[markerToShow.lat, markerToShow.lng]} icon={customIcon}>
              <Popup>
                <div>
                  <strong>📍 {markerToShow.title}</strong>
                  <br />
                  <small className="text-gray-500">
                    Coordinates: {markerToShow.lat.toFixed(6)}, {markerToShow.lng.toFixed(6)}
                  </small>
                  <StreetViewButton lat={markerToShow.lat} lng={markerToShow.lng} title={markerToShow.title} />
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Instructions */}
 
    </div>
  );
}