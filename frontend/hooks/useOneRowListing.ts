"use client";

import { useState, useEffect } from "react";
import type { Property } from "@/lib/api";
import {
  HOMEPAGE_ROW_COUNT_EVENT,
  HOMEPAGE_ROW_COUNT_PREF_KEY,
  parseHomepageRowCountPreference,
} from "@/lib/homepage/rowPreference";

/**
 * useOneRowListing Hook
 *
 * Provides "Intelligent Delta-Fetching" logic for homepage sections that only show one row.
 * Automatically handles screen breakpoints, delta-fetching to avoid over-fetching,
 * and caching of previously fetched items.
 *
 * @param fetchFn The API function to call. Must accept { limit, offset }.
 * @param dependencies Optional array of state that should trigger a full reset (e.g., province changes).
 */
export function useOneRowListing(
  fetchFn: (params: {
    limit: number;
    offset: number;
  }) => Promise<{ results: any[]; count: number }>,
  dependencies: any[] = [],
) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [requestedCount, setRequestedCount] = useState(0);
  const [preferredCount, setPreferredCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      const raw = window.localStorage.getItem(HOMEPAGE_ROW_COUNT_PREF_KEY);
      setPreferredCount(parseHomepageRowCountPreference(raw));
    };

    sync();
    window.addEventListener(HOMEPAGE_ROW_COUNT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOMEPAGE_ROW_COUNT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // 1. Breakpoint Sensor
  useEffect(() => {
    const calculateRequired = () => {
      if (typeof window === "undefined") return 4;
      const width = window.innerWidth;

      // BREAKPOINTS SYNCED WITH tailwind.config.ts & PropertyGridSection.tsx:
      // sm=640, md=768, lg=1024, 2xl=1536, 3xl=1800, 4xl=2200
      if (width >= 2200) return 12; // 4xl
      if (width >= 1800) return 8;  // 3xl
      if (width >= 1536) return 6;  // 2xl
      if (width >= 1024) return 4;  // lg + xl (1024–1535px)
      if (width >= 768) return 3;  // md
      if (width >= 640) return 2;  // sm
      return 2;                     // mobile
    };

    const applyPreference = (autoCount: number) => {
      if (preferredCount && preferredCount > 0) {
        return Math.min(autoCount, preferredCount);
      }
      return autoCount;
    };

    setRequestedCount(applyPreference(calculateRequired()));

    const handleResize = () => {
      const needed = calculateRequired();
      setRequestedCount(applyPreference(needed));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [preferredCount]);

  // 2. Clear cache when dependencies change (e.g. search query or province)
  useEffect(() => {
    setProperties([]);
    setTotalCount(0);
    setIsLoading(true);
    setIsError(false);
  }, dependencies);

  // 3. Intelligent Delta-Fetching
  useEffect(() => {
    // Wait for sensor to determine visible count
    if (requestedCount === 0) return;

    // Cache guard: Don't fetch if we already have enough items for this row width
    if (properties.length >= requestedCount) {
      return;
    }

    const fetchDelta = async () => {
      // Only show initial loading state if we have no data yet
      if (properties.length === 0) {
        setIsLoading(true);
      }

      try {
        const offset = properties.length;
        const limitNeeded = requestedCount - offset;

        const response = await fetchFn({
          limit: limitNeeded,
          offset: offset,
        });

        const newProperties = response.results || [];
        setProperties((prev) => [...prev, ...newProperties]);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error("Error in useOneRowListing Intelligent Fetching:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedCount, ...dependencies]);

  return {
    properties,
    totalCount,
    isLoading,
    isError,
    requestedCount,
  };
}
