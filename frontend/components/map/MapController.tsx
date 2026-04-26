// components/MapController.tsx
import { useEffect } from "react";

const { useMap } = (() => {
  try {
    // dynamic require fallback to avoid SSR crash
    return require("react-leaflet");
  } catch {
    return { useMap: () => null };
  }
})();

export default function MapController({
  onMapReady,
  onMapClick,
}: {
  onMapReady: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    onMapReady(map);
    const handleMapClick = (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, onMapReady, onMapClick]);

  return null;
}
