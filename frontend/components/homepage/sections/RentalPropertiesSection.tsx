"use client";

import { useEffect, useState } from "react";
import { fetchLeaseProperties, Property } from "@/lib/api";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";
import { useOneRowListing } from "@/hooks/useOneRowListing";

export function RentalPropertiesSection() {
  /*
   * ──────────────────────────────────────────────────────────────────────────────
   * INTELLIGENT FETCHING LOGIC (DO NOT REMOVE)
   * This section implements Breakpoint-Aware Incremental Fetching.
   * ──────────────────────────────────────────────────────────────────────────────
   */
  const { openQuickView } = useQuickView();
  const { properties, totalCount, isLoading, requestedCount } =
    useOneRowListing((p) =>
      fetchLeaseProperties({
        ...p,
        has_photos: true,
      }),
    );
  return (
    <PropertyGridSection
      title="Rental Properties"
      subtitle={`Find your perfect rental property (${totalCount || properties.length} available)`}
      viewAllHref="/listing/rental"
      viewAllLabel="View All Rentals"
      properties={properties}
      totalCount={totalCount}
      isLoading={isLoading}
      onQuickView={openQuickView}
      emptyTitle="No rental properties found"
      emptySubtitle="Check back soon for new rental listings."
      oneRowOnly={true}
      limit={requestedCount}
    />
  );
}
