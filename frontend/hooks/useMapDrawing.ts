// hooks/useMapDrawing.ts
import { useRef, useState } from "react";
import { colors } from "@/config/design-system";

type LatLngPoint = { lat: number; lng: number };
type DrawingMode = "rectangle" | "polygon";
type DrawingCompletePayload = {
  mode: DrawingMode;
  bbox: {
    latitude_min: number;
    latitude_max: number;
    longitude_min: number;
    longitude_max: number;
  };
  polygon?: LatLngPoint[];
};

export const useMapDrawing = (
  mapRef: React.MutableRefObject<any>,
  leaflet: any,
  onFinishDrawing: (payload: DrawingCompletePayload) => Promise<void>,
) => {
  const [drawing, setDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode | null>(null);
  const [hasActiveShape, setHasActiveShape] = useState(false);
  const [polygonPointCount, setPolygonPointCount] = useState(0);
  const drawingModeRef = useRef<DrawingMode | null>(null);
  const rectLayerRef = useRef<any | null>(null);
  const polygonLayerRef = useRef<any | null>(null);
  const polygonPreviewLineRef = useRef<any | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const polygonPointsRef = useRef<LatLngPoint[]>([]);
  const previousDoubleClickZoomEnabledRef = useRef<boolean | null>(null);

  const clearLayers = () => {
    if (rectLayerRef.current) {
      try {
        rectLayerRef.current.remove();
      } catch {}
      rectLayerRef.current = null;
    }
    if (polygonLayerRef.current) {
      try {
        polygonLayerRef.current.remove();
      } catch {}
      polygonLayerRef.current = null;
    }
    if (polygonPreviewLineRef.current) {
      try {
        polygonPreviewLineRef.current.remove();
      } catch {}
      polygonPreviewLineRef.current = null;
    }
  };

  const restoreMapInteractions = () => {
    if (!mapRef.current) return;
    mapRef.current.dragging.enable();
    if (previousDoubleClickZoomEnabledRef.current === true) {
      mapRef.current.doubleClickZoom.enable();
    }
    mapRef.current.getContainer().style.cursor = "";
  };

  const teardownListeners = () => {
    if (!mapRef.current) return;
    mapRef.current.off("mousedown", onMapMouseDown);
    mapRef.current.off("mousemove", onMapMouseMove);
    mapRef.current.off("mouseup", onMapMouseUp);
    mapRef.current.off("click", onPolygonMapClick);
    mapRef.current.off("mousemove", onPolygonMouseMove);
    mapRef.current.off("dblclick", onPolygonDoubleClick);
    mapRef.current.off("contextmenu", onPolygonContextMenu);
  };

  const toBBox = (points: LatLngPoint[]) => {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    return {
      latitude_min: Number(Math.min(...lats).toFixed(6)),
      latitude_max: Number(Math.max(...lats).toFixed(6)),
      longitude_min: Number(Math.min(...lngs).toFixed(6)),
      longitude_max: Number(Math.max(...lngs).toFixed(6)),
    };
  };

  const onMapMouseMove = (e: any) => {
    if (drawingModeRef.current !== "rectangle") return;
    if (!drawStartRef.current || !mapRef.current) return;
    if (!leaflet) return;

    const start = drawStartRef.current;
    const bounds = leaflet.latLngBounds(
      [start.lat, start.lng],
      [e.latlng.lat, e.latlng.lng],
    );
    if (!rectLayerRef.current) {
      rectLayerRef.current = leaflet.rectangle(bounds, {
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
    if (drawingModeRef.current !== "rectangle" || !mapRef.current) return;
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

    const bbox = toBBox([
      { lat: latMin, lng: lngMin },
      { lat: latMax, lng: lngMax },
    ]);
    const polygon = [
      { lat: latMin, lng: lngMin },
      { lat: latMax, lng: lngMin },
      { lat: latMax, lng: lngMax },
      { lat: latMin, lng: lngMax },
      { lat: latMin, lng: lngMin },
    ];

    await onFinishDrawing({ mode: "rectangle", bbox, polygon });

    setDrawing(false);
    setDrawingMode(null);
    setHasActiveShape(true);
    drawStartRef.current = null;
    teardownListeners();
    restoreMapInteractions();
  };

  const onMapMouseDown = (e: any) => {
    if (drawingModeRef.current !== "rectangle") return;
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

  const redrawPolygonLayer = () => {
    if (!mapRef.current) return;
    if (!leaflet) return;
    if (polygonLayerRef.current) {
      try {
        polygonLayerRef.current.remove();
      } catch {}
      polygonLayerRef.current = null;
    }
    if (polygonPointsRef.current.length >= 2) {
      polygonLayerRef.current = leaflet.polygon(
        polygonPointsRef.current.map((p) => [p.lat, p.lng]),
        {
          color: colors.primary,
          weight: 2,
          fillOpacity: 0.12,
          dashArray: "5, 8",
        },
      ).addTo(mapRef.current);
    }
  };

  const onPolygonMapClick = (e: any) => {
    if (drawingModeRef.current !== "polygon") return;
    polygonPointsRef.current = [
      ...polygonPointsRef.current,
      { lat: e.latlng.lat, lng: e.latlng.lng },
    ];
    setPolygonPointCount(polygonPointsRef.current.length);
    redrawPolygonLayer();
  };

  const onPolygonMouseMove = (e: any) => {
    if (drawingModeRef.current !== "polygon" || !mapRef.current) return;
    if (polygonPointsRef.current.length === 0) return;
    if (!leaflet) return;
    const points = polygonPointsRef.current.map((p) => [p.lat, p.lng]);
    const preview = [...points, [e.latlng.lat, e.latlng.lng]];
    if (!polygonPreviewLineRef.current) {
      polygonPreviewLineRef.current = leaflet.polyline(preview, {
        color: colors.primary,
        weight: 2,
        opacity: 0.7,
        dashArray: "5, 10",
      }).addTo(mapRef.current);
      return;
    }
    polygonPreviewLineRef.current.setLatLngs(preview);
  };

  const completePolygonDrawing = async () => {
    if (drawingModeRef.current !== "polygon") return;
    const points = polygonPointsRef.current;
    if (points.length < 3) {
      disableDrawing();
      return;
    }
    const closedRing = [...points, points[0]];
    const bbox = toBBox(points);
    if (polygonPreviewLineRef.current) {
      try {
        polygonPreviewLineRef.current.remove();
      } catch {}
      polygonPreviewLineRef.current = null;
    }
    await onFinishDrawing({
      mode: "polygon",
      bbox,
      polygon: closedRing.map((p) => ({
        lat: Number(p.lat.toFixed(6)),
        lng: Number(p.lng.toFixed(6)),
      })),
    });
    redrawPolygonLayer();
    setDrawing(false);
    setDrawingMode(null);
    setHasActiveShape(true);
    polygonPointsRef.current = [];
    setPolygonPointCount(0);
    teardownListeners();
    restoreMapInteractions();
  };

  const onPolygonDoubleClick = async (e: any) => {
    e.originalEvent?.preventDefault?.();
    e.originalEvent?.stopPropagation?.();
    await completePolygonDrawing();
  };

  const onPolygonContextMenu = async (e: any) => {
    e.originalEvent?.preventDefault?.();
    await completePolygonDrawing();
  };

  const enableDrawing = (mode: DrawingMode) => {
    if (!mapRef.current) return;
    teardownListeners();
    clearLayers();
    setHasActiveShape(false);
    setDrawing(true);
    setDrawingMode(mode);
    drawingModeRef.current = mode;
    drawStartRef.current = null;
    polygonPointsRef.current = [];
    setPolygonPointCount(0);

    previousDoubleClickZoomEnabledRef.current =
      mapRef.current.doubleClickZoom.enabled();
    mapRef.current.dragging.disable();
    mapRef.current.doubleClickZoom.disable();
    if (mode === "rectangle") {
      mapRef.current.on("mousedown", onMapMouseDown);
    } else {
      mapRef.current.on("click", onPolygonMapClick);
      mapRef.current.on("mousemove", onPolygonMouseMove);
      mapRef.current.on("dblclick", onPolygonDoubleClick);
      mapRef.current.on("contextmenu", onPolygonContextMenu);
    }
    mapRef.current.getContainer().style.cursor = "crosshair";
  };

  const disableDrawing = () => {
    if (!mapRef.current) return;
    setDrawing(false);
    setDrawingMode(null);
    drawingModeRef.current = null;
    drawStartRef.current = null;
    polygonPointsRef.current = [];
    setPolygonPointCount(0);
    clearLayers();
    teardownListeners();
    restoreMapInteractions();
  };

  const clearShape = () => {
    clearLayers();
    drawStartRef.current = null;
    polygonPointsRef.current = [];
    setPolygonPointCount(0);
    setDrawingMode(null);
    drawingModeRef.current = null;
    setDrawing(false);
    setHasActiveShape(false);
    teardownListeners();
    restoreMapInteractions();
  };

  return {
    drawing,
    drawingMode,
    hasActiveShape,
    polygonPointCount,
    enableDrawing,
    disableDrawing,
    finishPolygonDrawing: completePolygonDrawing,
    clearShape,
    rectLayerRef,
    polygonLayerRef,
  };
};
