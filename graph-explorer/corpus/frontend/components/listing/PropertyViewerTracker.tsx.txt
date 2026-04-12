"use client";

import { useEffect, useRef } from "react";
import { useWatched } from "@/contexts/WatchedContext";

export function PropertyViewerTracker({ property }: { property: any }) {
  const { addToHistory } = useWatched();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (property && !trackedRef.current) {
      addToHistory(property);
      trackedRef.current = true;
    }
  }, [property, addToHistory]);

  return null;
}
