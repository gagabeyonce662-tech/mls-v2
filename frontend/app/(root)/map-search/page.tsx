"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

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
  property_sub_type?: string;
  city?: string;
  postal_code?: string;
  unparsed_address?: string;
  bedrooms_total?: number | string;
  bathrooms_total_integer?: number | string;
  building_area_total?: number | string;
  listing_id?: string;
  city_region?: string;
  year_built?: number | string;
  public_remarks?: string;
  listing_url?: string;
  category_type?: string;
  state_or_province?: string;
  latitude?: string | number;
  longitude?: string | number;
  photos_count?: number;
  standard_status?: string;
  media?: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }>;
  rooms?: Array<{
    room_type: string;
    room_level: string;
    room_length?: string;
    room_width?: string;
    room_dimensions?: string;
  }>;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
          <div style={{ fontSize: 14, color: "#111" }}>{r.display_name}</div>
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

function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------------- PROPERTY CARD COMPONENT ----------------
function PropertyCard({ 
  property, 
  onViewOnMap,
  onViewStreetView,
  isSelected
}: { 
  property: PropertyMarker; 
  onViewOnMap: () => void;
  onViewStreetView: () => void;
  isSelected: boolean;
}) {
  const formatPrice = (price: string | number | undefined) => {
    if (!price) return "Price not available";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return String(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatSquareFeet = (sqft: string | number | undefined) => {
    if (!sqft) return "N/A";
    const numSqft = typeof sqft === 'string' ? parseFloat(sqft) : sqft;
    if (isNaN(numSqft)) return String(sqft);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numSqft) + " sqft";
  };

  const getPropertyPhoto = () => {
    const raw = property.raw || {};
    if (raw.media && raw.media.length > 0) {
      // Try to find preferred photo first, otherwise use first photo
      const preferredPhoto = raw.media.find(m => m.is_preferred);
      if (preferredPhoto) return preferredPhoto.media_url;
      return raw.media[0].media_url;
    }
    return null;
  };

  const getPropertyDetails = () => {
    const raw = property.raw || {};
    return {
      address: raw.unparsed_address || raw.city || property.title || "Address not available",
      city: raw.city || "N/A",
      cityRegion: raw.city_region || "N/A",
      postalCode: raw.postal_code || "N/A",
      bedrooms: raw.bedrooms_total || "N/A",
      bathrooms: raw.bathrooms_total_integer || "N/A",
      squareFeet: raw.building_area_total,
      propertyType: raw.property_sub_type || "Unknown",
      yearBuilt: raw.year_built,
      status: raw.standard_status || "Unknown",
      listingId: raw.listing_id || "N/A",
      listingKey: raw.listing_key || "N/A",
      province: raw.state_or_province || "N/A",
      remarks: raw.public_remarks || "",
      photosCount: raw.photos_count || 0,
      category: raw.category_type || "N/A",
      listingUrl: raw.listing_url,
    };
  };

  const details = getPropertyDetails();
  const propertyPhoto = getPropertyPhoto();

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
      onClick={onViewOnMap}
    >
      {/* Property Image */}
      {propertyPhoto ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={propertyPhoto} 
            alt={details.address}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNMjAwIDE1MEMyMjMuODYgMTUwIDI0MyAxMzAuODYgMjQzIDEwN0MyNDMgODMuMTQgMjIzLjg2IDY0IDIwMCA2NEMxNzYuMTQgNjQgMTU3IDgzLjE0IDE1NyAxMDdDMTU3IDEzMC44NiAxNzYuMTQgMTUwIDIwMCAxNTBaTTIwMCAxODBDMTUwLjI5IDE4MCAxMDggMjIyLjI5IDEwOCAyNzJIMjkyQzI5MiAyMjIuMjkgMjQ5LjcxIDE4MCAyMDAgMTgwWiIgZmlsbD0iI0NEQ0RDRCIvPjwvc3ZnPg==';
            }}
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {details.photosCount} photos
          </div>
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${details.category === 'exclusive' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
              {details.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Property Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">
            {details.address}
          </h3>
          <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded ml-2 whitespace-nowrap">
            {details.status}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{details.city}, {details.cityRegion}, {details.province}</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(property.price)}
          </div>
        </div>

        {/* Property Features Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{details.bedrooms} bed</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>{details.bathrooms} bath</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
            <span>{formatSquareFeet(details.squareFeet)}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>{details.yearBuilt || "N/A"}</span>
          </div>
        </div>

        {/* Property Type */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {details.propertyType}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap();
            }}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 flex items-center justify-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            View on Map
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewStreetView();
            }}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            Street View
          </button>
        </div>

        {/* Listing Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Listing ID: {details.listingId}</span>
            {details.listingUrl && (
              <a 
                href={details.listingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
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

  // State to track selected property
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

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

  // Selected property icon (different color)
  const selectedIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
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

  // Clear rectangle and api markers
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

  // Handle property card actions
  const handleViewOnMap = (property: PropertyMarker) => {
    setSelectedPropertyId(property.id);
    if (mapRef.current) {
      mapRef.current.flyTo([property.lat, property.lng], 16, { 
        animate: true, 
        duration: 1.2 
      });
    }
  };

  const handleViewStreetView = (property: PropertyMarker) => {
    openStreetView(property.lat, property.lng, property.title);
  };

  const markerToShow = searchResult ? { 
    lat: searchResult.lat, 
    lng: searchResult.lng, 
    title: searchResult.display_name || "Search result" 
  } : null;

  return (
    <div className="w-full px-4 pt-[140px] pb-6 pt-24">
      <Header />
      {/* Search + Draw + Clear Row */}
     <div className="mt-4 mb-6 flex items-center gap-4 justify-center">

        {/* Smaller Search Box */}
        <div className="relative w-72">
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search place…"
            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            autoComplete="off"
            onFocus={() => {
              setAnchorRect(inputRef.current?.getBoundingClientRect() ?? null);
              if (searchResults.length > 0) setResultsOpen(true);
            }}
          />
          {/* <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button> */}
        </div>

        {/* Draw Area */}
        {!drawing ? (
          <button
            onClick={enableDrawing}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Draw Area
          </button>
        ) : (
          <button
            onClick={disableDrawing}
            className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Cancel
          </button>
        )}

        {/* Clear Results */}
        <button
          onClick={clearRectAndResults}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          Clear Results
        </button>
      </div>

      {/* Search status */}
      <div className="text-sm text-gray-700 mb-4">
        {searchError && <span className="text-red-600">{searchError}</span>}
        {!searchError && searchResult && <span>📍 Showing: {searchResult.display_name}</span>}
      </div>

      {/* API status */}
      <div className="mb-3 text-sm">
        {loadingApi && <span className="text-gray-600">Loading properties from API…</span>}
        {!loadingApi && apiError && <span className="text-red-600">API error: {apiError}</span>}
        {!loadingApi && !apiError && apiMarkers.length > 0 && (
          <span className="text-gray-700">{apiMarkers.length} properties found. Click on cards or markers to select.</span>
        )}
        {!loadingApi && !apiError && apiMarkers.length === 0 && (
          <span className="text-gray-600 flex justify-center">No properties loaded yet — draw an area to query the API.</span>
        )}
      </div>

      {/* Portal results */}
      {resultsOpen && searchResults.length > 0 && (
        <ResultsPortal anchorRect={anchorRect} results={searchResults} onSelect={selectResult} />
      )}

      {/* MAIN CONTENT: Map + Property Cards */}
      <div className="flex gap-6">
        {/* Map - Takes 2/3 of width when properties exist, full width otherwise */}
       <div 
          className="flex-1 rounded-lg overflow-hidden shadow-md"
          style={{ height: "80vh", minHeight: 640 }}
        >
          <MapContainer center={[43.65, -79.385]} zoom={13} className="w-full h-full">
            <MapController onMapReady={handleMapReady} onMapClick={handleMapClick} />
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render API markers with different icon for selected property */}
            {apiMarkers.map((m) => (
              <Marker 
                key={m.id} 
                position={[m.lat, m.lng]} 
                icon={selectedPropertyId === m.id ? selectedIcon : customIcon}
                eventHandlers={{
                  click: () => setSelectedPropertyId(m.id),
                }}
              >
                <Popup>
                  <div className="max-w-xs">
                    <strong className="text-lg">{m.title}</strong>
                    <br />
                    <div className="my-2">
                      <span className="font-semibold">Price:</span> {formatPrice(m.price)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div><span className="font-medium">Bedrooms:</span> {m.raw?.bedrooms_total || "N/A"}</div>
                      <div><span className="font-medium">Bathrooms:</span> {m.raw?.bathrooms_total_integer || "N/A"}</div>
                      <div><span className="font-medium">Property Type:</span> {m.raw?.property_sub_type || "N/A"}</div>
                      <div><span className="font-medium">Status:</span> {m.raw?.standard_status || "N/A"}</div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Coordinates: {m.lat.toFixed(6)}, {m.lng.toFixed(6)}
                    </div>
                    <StreetViewButton lat={m.lat} lng={m.lng} title={m.title} />
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render search marker on top if present */}
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

        {/* Property Cards - Takes 1/3 of width when properties exist */}
        {apiMarkers.length > 0 && (
          <div className="w-1/3">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Properties ({apiMarkers.length})</h2>
                <span className="text-sm text-gray-500">
                  {selectedPropertyId ? "1 selected" : "Click to select"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Click on a property card or marker to select it
              </p>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "75vh" }}>
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

      {/* Instructions */}
   
    </div>
  );
}

// Helper function to format price (used in popup)
const formatPrice = (price: string | number | undefined) => {
  if (!price) return "Price not available";
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return String(price);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};