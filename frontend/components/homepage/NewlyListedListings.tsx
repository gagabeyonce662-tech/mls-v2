// components/homepage/NewlyListedListings.tsx
"use client";

import { Calendar } from "lucide-react";
import { colors } from "@/config/design-system";
import { fetchNewlyListedProperties, type Property } from "@/lib/api";
import { useOneRowListing } from "@/hooks/useOneRowListing";
import { PropertyGridSection } from "../shared/PropertyGridSection";

interface NewlyListedListingsProps {
  searchQuery?: string;
  showLimit?: number;
  onQuickView?: (property: Property) => void;
}

export default function NewlyListedListings({
  searchQuery = "",
  showLimit = 8,
  onQuickView,
}: NewlyListedListingsProps) {
  /*
   * ──────────────────────────────────────────────────────────────────────────────
   * INTELLIGENT FETCHING LOGIC (DO NOT REMOVE)
   * This section implements Breakpoint-Aware Incremental Fetching.
   *
   * 1. Sensor: We detect the "Requested Count" based on the current screen width.
   * 2. Cache-Respect: If the screen shrinks, we use the existing cached properties.
   * 3. Delta-Fetching: If the screen expands and requires more cards than we have,
   *    we fetch ONLY the missing items using offsets, avoiding redundant data transfer.
   * ──────────────────────────────────────────────────────────────────────────────
   */
  const { properties, totalCount, isLoading, isError, requestedCount } =
    useOneRowListing(
      (params) =>
        fetchNewlyListedProperties({
          ...params,
          search:
            searchQuery && searchQuery !== "Latest Properties"
              ? searchQuery
              : undefined,
        }),
      [searchQuery],
    );

  return (
    <PropertyGridSection
      title={searchQuery || "Newly Listed Properties"}
      subtitle={
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: colors.primary }} />
          <span>
            {isLoading
              ? "Finding new listings..."
              : `${totalCount} new properties available`}
          </span>
        </div>
      }
      viewAllHref="/new-listings"
      viewAllLabel="View All New Listings"
      properties={properties}
      isLoading={isLoading}
      isError={isError}
      totalCount={totalCount}
      onQuickView={onQuickView}
      variant="new"
      limit={requestedCount}
      oneRowOnly={true}
    />
  );
}
