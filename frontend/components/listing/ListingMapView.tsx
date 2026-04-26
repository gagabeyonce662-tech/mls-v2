"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, Maximize2 } from "lucide-react";
import { MapAggregateCell, Property } from "@/lib/api";
import { env } from "@/lib/env";
import {
  fetchMapAggregatesForBBox,
  LISTING_ZOOM_MIN,
  shouldUseAggregateMode,
} from "@/hooks/useMapAggregates";
import {
  formatPrice,
  getPrice,
  getLatitude,
  getLongitude,
  getPropertyKey,
  getAddress,
  getCity,
  getBedrooms,
  getBathrooms,
} from "@/lib/propertyUtils";
import { getCustomIcon, getSelectedIcon } from "@/components/map/MapIcons";
import StreetViewButton from "@/components/map/StreetViewButton";

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

interface ListingMapViewProps {
  properties: Property[];
  isLoading: boolean;
}

export const ListingMapView = ({
  properties,
  isLoading,
}: ListingMapViewProps) => {
  const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapDataMode, setMapDataMode] = useState<"aggregates" | "listings">(
    "listings",
  );
  const [aggregateMarkers, setAggregateMarkers] = useState<MapAggregateCell[]>(
    [],
  );

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Center map on the properties when they change
  useEffect(() => {
    if (mapRef.current && L && properties.length > 0) {
      try {
        const validCoords = properties
          .map((p) => {
            const lat = getLatitude(p);
            const lng = getLongitude(p);
            return lat === null || lng === null ? null : [lat, lng];
          })
          .filter(Boolean) as [number, number][];

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          mapRef.current.fitBounds(bounds.pad(0.1));
        }
      } catch (err) {
        console.error("Error fitting bounds:", err);
      }
    }
  }, [properties, L, mounted]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    let disposed = false;

    const syncMapDataMode = async () => {
      if (disposed) return;

      const zoom = map.getZoom?.() ?? LISTING_ZOOM_MIN;
      if (!shouldUseAggregateMode(zoom)) {
        setMapDataMode("listings");
        setAggregateMarkers([]);
        return;
      }

      try {
        const bounds = map.getBounds?.();
        if (!bounds) return;
        const data = await fetchMapAggregatesForBBox(
          API_BASE_URL,
          {
            latitude_min: bounds.getSouth(),
            latitude_max: bounds.getNorth(),
            longitude_min: bounds.getWest(),
            longitude_max: bounds.getEast(),
          },
          zoom,
        );
        if (disposed) return;

        const cells = (data?.results ?? [])
          .map((cell: any) => ({
            h3_index: String(cell.h3_index || ""),
            resolution: Number(cell.resolution ?? 0),
            center_lat: Number(cell.center_lat),
            center_lng: Number(cell.center_lng),
            property_count: Number(cell.property_count ?? 0),
            updated_at: cell.updated_at,
          }))
          .filter(
            (cell: MapAggregateCell) =>
              !Number.isNaN(cell.center_lat) &&
              !Number.isNaN(cell.center_lng) &&
              cell.property_count > 0,
          );

        setMapDataMode("aggregates");
        setAggregateMarkers(cells);
      } catch (error) {
        console.error("Failed to fetch map aggregates:", error);
        setMapDataMode("listings");
        setAggregateMarkers([]);
      }
    };

    map.on("moveend", syncMapDataMode);
    map.on("zoomend", syncMapDataMode);
    void syncMapDataMode();

    return () => {
      disposed = true;
      map.off("moveend", syncMapDataMode);
      map.off("zoomend", syncMapDataMode);
    };
  }, [API_BASE_URL, mounted]);

  if (!mounted || !L) {
    return (
      <div className="w-full h-[600px] bg-gray-50 flex flex-col items-center justify-center rounded-2xl border">
        <Loader2 className="w-8 h-8 animate-spin text-ds-primary mb-2" />
        <span className="text-sm text-gray-500 font-medium">
          Initializing Map...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] rounded-2xl overflow-hidden border shadow-inner relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
      <MapContainer
        center={[43.65, -79.38]}
        zoom={12}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {mapDataMode === "listings" &&
          properties.map((p, index) => {
          const lat = getLatitude(p);
          const lng = getLongitude(p);
          if (lat === null || lng === null) return null;

          const id = getPropertyKey(p);

            return (
              <Marker
                key={id}
                position={[lat, lng]}
                icon={selectedId === id ? getSelectedIcon(L) : getCustomIcon(L)}
                eventHandlers={{
                  click: () => setSelectedId(id),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <h3 className="font-bold text-gray-900 leading-tight mb-1">
                      {getAddress(p) || getCity(p)}
                    </h3>
                    <p className="text-ds-primary font-bold text-lg mb-2">
                      {formatPrice(getPrice(p))}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 border-t pt-2 mb-3">
                      <div className="flex justify-between">
                        <span>Beds:</span>{" "}
                        <span className="font-bold">
                          {getBedrooms(p) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Baths:</span>{" "}
                        <span className="font-bold">
                          {getBathrooms(p) || "N/A"}
                        </span>
                      </div>
                    </div>
                    <StreetViewButton lat={lat} lng={lng} />
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {mapDataMode === "aggregates" &&
          aggregateMarkers.map((cell) => (
            <CircleMarker
              key={cell.h3_index}
              center={[cell.center_lat, cell.center_lng]}
              radius={Math.min(24, Math.max(10, Math.log2(cell.property_count + 1) * 4))}
              pathOptions={{
                color: "#1d4ed8",
                fillColor: "#2563eb",
                fillOpacity: 0.45,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -2]} opacity={0.95}>
                <span className="font-semibold">
                  {cell.property_count} properties
                </span>
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Map Overlay Badge */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border text-[10px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {mapDataMode === "aggregates" ? "Area Density View" : "Live Search View"}
        </div>
      </div>
    </div>
  );
};
