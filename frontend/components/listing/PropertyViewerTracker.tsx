// frontend/components/listing/PropertyViewerTracker.tsx
// this component is responsible for tracking when a user views a property listing. It adds the property to the user's watch history and sends a beacon to the server for telemetry purposes.
"use client";

import { useEffect, useRef } from "react";
import { useWatched } from "@/contexts/WatchedContext";
import {
  getOrCreateListingSessionId,
  postListingViewBeacon,
} from "@/lib/listingTelemetry";
import { getPropertyKey } from "@/lib/propertyUtils";

export function PropertyViewerTracker({ property }: { property: any }) {
  const { addToHistory } = useWatched();
  const trackedRef = useRef(false);
  const beaconRef = useRef(false);

  useEffect(() => {
    if (property && !trackedRef.current) {
      addToHistory(property);
      trackedRef.current = true;
    }
  }, [property, addToHistory]);

  useEffect(() => {
    if (!property || beaconRef.current) return;
    const key = getPropertyKey(property);
    if (!key) return;
    const session = getOrCreateListingSessionId();
    if (!session) return;
    postListingViewBeacon(key, session);
    beaconRef.current = true;
  }, [property]);

  return null;
}
