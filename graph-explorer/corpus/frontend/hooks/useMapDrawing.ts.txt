// hooks/useMapDrawing.ts
import { useRef, useState } from "react";
import { colors } from "@/config/design-system";

export const useMapDrawing = (
  mapRef: React.MutableRefObject<any>,
  onFinishDrawing: (bbox: any) => Promise<void>,
) => {
  const [drawing, setDrawing] = useState(false);
  const rectLayerRef = useRef<any | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);

  const getLeaflet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).L;
  };

  const onMapMouseMove = (e: any) => {
    const L = getLeaflet();
    if (!drawStartRef.current || !mapRef.current || !L) return;

    const start = drawStartRef.current;
    const bounds = L.latLngBounds(
      [start.lat, start.lng],
      [e.latlng.lat, e.latlng.lng],
    );
    if (!rectLayerRef.current) {
      rectLayerRef.current = L.rectangle(bounds, {
        color: colors.primary,
        weight: 2,
        fillOpacity: 0.1,
        dashArray: "5, 10",
      }).addTo(mapRef.current);
    } else {
      rectLayerRef.current.setBounds(bounds);
    }
  };

  const onMapMouseUp = async (e: any) => {
    if (!mapRef.current) return;
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

    await onFinishDrawing(bbox);

    setDrawing(false);
    drawStartRef.current = null;
    mapRef.current.dragging.enable();
    mapRef.current.getContainer().style.cursor = "";
    mapRef.current.off("mousedown", onMapMouseDown);
  };

  const onMapMouseDown = (e: any) => {
    if (!mapRef.current) return;
    drawStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    mapRef.current.on("mousemove", onMapMouseMove);
    mapRef.current.on("mouseup", onMapMouseUp);
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch {}
      rectLayerRef.current = null;
    }
  };

  const enableDrawing = () => {
    if (!mapRef.current) return;
    setDrawing(true);
    drawStartRef.current = null;
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch {}
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
      } catch {}
      rectLayerRef.current = null;
    }
    mapRef.current.off("mousedown", onMapMouseDown);
    mapRef.current.off("mousemove", onMapMouseMove);
    mapRef.current.off("mouseup", onMapMouseUp);
    mapRef.current.dragging.enable();
    mapRef.current.getContainer().style.cursor = "";
  };

  const clearRect = () => {
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch {}
      rectLayerRef.current = null;
    }
    drawStartRef.current = null;
    setDrawing(false);
  };

  return {
    drawing,
    enableDrawing,
    disableDrawing,
    clearRect,
    rectLayerRef,
  };
};
