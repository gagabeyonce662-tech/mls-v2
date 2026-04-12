"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, Maximize2 } from "lucide-react";
import { Property } from "@/lib/api/types";
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

interface ListingMapViewProps {
  properties: Property[];
  isLoading: boolean;
}

export const ListingMapView = ({
  properties,
  isLoading,
}: ListingMapViewProps) => {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

        {properties.map((p, index) => {
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
      </MapContainer>

      {/* Map Overlay Badge */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border text-[10px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Search View
        </div>
      </div>
    </div>
  );
};
