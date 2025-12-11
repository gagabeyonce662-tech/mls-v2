// hooks/useMapDrawing.ts
import { useRef, useState } from "react";
import L from "leaflet";

export const useMapDrawing = (mapRef: React.MutableRefObject<any>) => {
  const [drawing, setDrawing] = useState(false);
  const rectLayerRef = useRef<any | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);

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
      rectLayerRef.current = L.rectangle(bounds, { 
        color: "#3b82f6", 
        weight: 2, 
        fillOpacity: 0.08 
      }).addTo(mapRef.current);
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

    return { drawStartRef, drawing, setDrawing };
  };

  const clearRect = () => {
    if (rectLayerRef.current) {
      try { rectLayerRef.current.remove(); } catch {}
      rectLayerRef.current = null;
    }
    drawStartRef.current = null;
    setDrawing(false);
  };

  return {
    drawing,
    enableDrawing,
    disableDrawing,
    onMapMouseUp,
    clearRect,
    rectLayerRef,
    drawStartRef
  };
};