// components/map/MapComponents.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import L from "leaflet";

// Dynamically import react-leaflet components (SSR safe)
export const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

export const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

export const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

export const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

// Map Controller Component
export const MapController = ({ 
  onMapReady,
  onMapClick 
}: { 
  onMapReady: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}) => {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  
  React.useEffect(() => {
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
};

// Street View Button Component
export const StreetViewButton = ({ 
  lat, 
  lng, 
  title 
}: { 
  lat: number; 
  lng: number; 
  title?: string;
}) => {
  const openStreetView = (lat: number, lng: number, title?: string) => {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
    const streetViewWindow = window.open(url, "_blank");
    if (streetViewWindow) {
      streetViewWindow.focus();
    } else {
      alert("Please allow popups for this site to open Street View");
    }
  };

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
};

// Custom Icons
export const getCustomIcon = () => {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};

export const getSelectedIcon = () => {
  return L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};