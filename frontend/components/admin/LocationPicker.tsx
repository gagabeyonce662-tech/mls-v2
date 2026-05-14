"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import MapController from "@/components/map/MapController";
import { useGeocoding } from "@/hooks/useGeocoding";
import type { NominatimResult } from "@/components/map/types";

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

const DEFAULT_CENTER: [number, number] = [43.6532, -79.3832];
const DEFAULT_ZOOM = 12;
const COORDINATE_DECIMALS = 6;

type LocationPickerProps = {
  latitude?: string | number | null;
  longitude?: string | number | null;
  address?: string | null;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
  onAddressChange?: (address: string) => void;
};

function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidLatitude(value: number | null): value is number {
  return value !== null && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null): value is number {
  return value !== null && value >= -180 && value <= 180;
}

function formatCoordinate(value: number): string {
  return value.toFixed(COORDINATE_DECIMALS);
}

export default function LocationPicker({
  latitude,
  longitude,
  address,
  onCoordinatesChange,
  onAddressChange,
}: LocationPickerProps) {
  const mapRef = useRef<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  const hasValidCoords = isValidLatitude(lat) && isValidLongitude(lng);

  const [searchHasFocus, setSearchHasFocus] = useState(false);

  const mapCenter = useMemo<[number, number]>(
    () => (hasValidCoords ? [lat, lng] : DEFAULT_CENTER),
    [hasValidCoords, lat, lng],
  );

  const coordinateError = useMemo(() => {
    if (latitude === "" && longitude === "") return "";
    if (lat !== null && !isValidLatitude(lat)) {
      return "Latitude must be between -90 and 90.";
    }
    if (lng !== null && !isValidLongitude(lng)) {
      return "Longitude must be between -180 and 180.";
    }
    if ((lat === null) !== (lng === null)) {
      return "Set both latitude and longitude, or leave both empty.";
    }
    return "";
  }, [latitude, longitude, lat, lng]);

  const setCoords = useCallback(
    (nextLat: number, nextLng: number) => {
      onCoordinatesChange(formatCoordinate(nextLat), formatCoordinate(nextLng));
      if (mapRef.current) {
        mapRef.current.flyTo([nextLat, nextLng], Math.max(mapRef.current.getZoom(), 14), {
          animate: true,
          duration: 0.8,
        });
      }
    },
    [onCoordinatesChange],
  );

  const onGeocodeSelected = useCallback(
    (result: { lat: number; lng: number; display_name: string }) => {
      setCoords(result.lat, result.lng);
      onAddressChange?.(result.display_name);
    },
    [onAddressChange, setCoords],
  );

  const {
    searchQuery,
    searching,
    searchResults,
    searchError,
    resultsOpen,
    onInputChange,
    selectResult,
    setResultsOpen,
  } = useGeocoding(searchInputRef, onGeocodeSelected);

  const showResults =
    searchHasFocus && resultsOpen && (searchResults.length > 0 || Boolean(searchError));

  const handleMapClick = useCallback(
    (nextLat: number, nextLng: number) => {
      setCoords(nextLat, nextLng);
    },
    [setCoords],
  );

  const handleMarkerDragEnd = useCallback(
    (event: any) => {
      const marker = event?.target;
      if (!marker || !marker.getLatLng) return;
      const { lat: draggedLat, lng: draggedLng } = marker.getLatLng();
      setCoords(draggedLat, draggedLng);
    },
    [setCoords],
  );

  const useBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Silently ignore geolocation errors and keep manual selection available.
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [setCoords]);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800">Location Picker</h3>
        <button
          type="button"
          onClick={useBrowserLocation}
          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Use My Location
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => setSearchHasFocus(true)}
          onBlur={() => {
            setSearchHasFocus(false);
            setTimeout(() => setResultsOpen(false), 120);
          }}
          placeholder="Search address or place"
          className="w-full rounded-lg border px-9 py-2 text-sm"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onInputChange("")}
            className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {showResults ? (
          <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white shadow-lg">
            {searching ? (
              <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>
            ) : null}
            {!searching && searchResults.length > 0
              ? searchResults.map((item: NominatimResult) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectResult(item);
                      setResultsOpen(false);
                    }}
                    className="flex w-full items-start gap-2 border-b px-3 py-2 text-left text-xs hover:bg-gray-50 last:border-b-0"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </button>
                ))
              : null}
            {!searching && searchError ? (
              <div className="px-3 py-2 text-xs text-red-600">{searchError}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="h-72 overflow-hidden rounded-lg border">
        <MapContainer
          center={mapCenter}
          zoom={hasValidCoords ? 15 : DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            onMapReady={(map) => {
              mapRef.current = map;
            }}
            onMapClick={handleMapClick}
          />
          {hasValidCoords ? (
            <Marker
              position={[lat, lng]}
              draggable={true}
              eventHandlers={{
                dragend: handleMarkerDragEnd,
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-gray-600">latitude</span>
          <input
            value={String(latitude ?? "")}
            onChange={(e) => onCoordinatesChange(e.target.value, String(longitude ?? ""))}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="43.653200"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-gray-600">longitude</span>
          <input
            value={String(longitude ?? "")}
            onChange={(e) => onCoordinatesChange(String(latitude ?? ""), e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="-79.383200"
          />
        </label>
      </div>

      {coordinateError ? (
        <p className="text-xs text-red-600">{coordinateError}</p>
      ) : hasValidCoords ? (
        <p className="text-xs text-gray-600">
          Selected: {formatCoordinate(lat)}, {formatCoordinate(lng)}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Click on the map, drag the marker, or search an address to set location.
        </p>
      )}

      {address ? (
        <p className="text-xs text-gray-500 line-clamp-2">Address: {String(address)}</p>
      ) : null}
    </div>
  );
}
