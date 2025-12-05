"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type Property = {
  id: number;
  title: string;
  price: string;
  lat: number;
  lng: number;
};

export default function MapOnlyPage() {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  const properties: Property[] = [
    {
      id: 1,
      title: "Modern Downtown Condo",
      price: "$2,750,000",
      lat: 45.4215,
      lng: -75.6972,
    },
    {
      id: 2,
      title: "Luxury Waterfront Villa",
      price: "$4,200,000",
      lat: 45.4235,
      lng: -75.695,
    },
    {
      id: 3,
      title: "Contemporary Family Home",
      price: "$1,850,000",
      lat: 45.4195,
      lng: -75.699,
    },
  ];

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  const customIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div className="h-screen w-screen">
      <MapContainer center={[45.4215, -75.6972]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {properties.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={customIcon}>
            <Popup>
              <div>
                <strong>{p.title}</strong>
                <br />
                {p.price}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
