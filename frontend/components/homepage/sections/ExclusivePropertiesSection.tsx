"use client";

import { useEffect, useState, useRef } from "react";
import { fetchExclusiveProperties, Property } from "@/lib/api";
import { useProvince } from "@/contexts/ProvinceContext";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";
import { useOneRowListing } from "@/hooks/useOneRowListing";

export function ExclusivePropertiesSection() {
  /*
   * ──────────────────────────────────────────────────────────────────────────────
   * INTELLIGENT FETCHING LOGIC (DO NOT REMOVE)
   * This section implements Breakpoint-Aware Incremental Fetching.
   *
   * 1. Sensor: We detect the "Requested Count" based on screen width.
   * 2. Reset Logic: If the province changes, we wipe the cache and start over.
   * 3. Delta-Fetching: If the screen expands, we fetch only the missing items.
   * ──────────────────────────────────────────────────────────────────────────────
   */
  const { selectedProvince, getProvinceName } = useProvince();
  const { openQuickView } = useQuickView();
  const [subtitleText, setSubtitleText] = useState("Exclusive Properties");
  const isFallbackRef = useRef(false);

  // Reset fallback state when province changes
  useEffect(() => {
    isFallbackRef.current = false;
  }, [selectedProvince]);

  const { properties, totalCount, isLoading, requestedCount } =
    useOneRowListing(
      async (params) => {
        const provinceName = getProvinceName(selectedProvince);
        const provinceMapping: any = {
          Ontario: "ON",
          Quebec: "QC",
          "British Columbia": "BC",
          Alberta: "AB",
          Manitoba: "MB",
          Saskatchewan: "SK",
          "Nova Scotia": "NS",
          "New Brunswick": "NB",
          "Newfoundland and Labrador": "NL",
          "Prince Edward Island": "PE",
          "Northwest Territories": "NT",
          Nunavut: "NU",
          Yukon: "YT",
        };

        let code =
          provinceName === "All Provinces"
            ? undefined
            : provinceMapping[provinceName];

        // If we are already in fallback mode (for delta-fetches), ignore the code
        if (isFallbackRef.current) {
          code = undefined;
        }

        let response = await fetchExclusiveProperties({
          province: code,
          ...params,
        });

        // Update Subtitle side-effect & Trigger Fallback
        if (params.offset === 0) {
          if ((!response.results || response.results.length === 0) && code) {
            // Activate fallback
            isFallbackRef.current = true;
            response = await fetchExclusiveProperties({ ...params });
            setSubtitleText(
              `No exclusive properties found in ${provinceName}. Showing all exclusive properties.`,
            );
          } else {
            setSubtitleText(
              code && !isFallbackRef.current
                ? `Exclusive in ${provinceName}`
                : "Exclusive Properties",
            );
          }
        }

        return response;
      },
      [selectedProvince],
    );

  return (
    <PropertyGridSection
      title="Exclusive Properties"
      subtitle={subtitleText}
      viewAllHref="/listing"
      properties={properties}
      totalCount={totalCount}
      isLoading={isLoading}
      onQuickView={openQuickView}
      oneRowOnly={true}
      limit={requestedCount}
    />
  );
}
