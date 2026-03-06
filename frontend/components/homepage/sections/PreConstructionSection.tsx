"use client";

import { useEffect, useState } from "react";
import { fetchPreConnProperties, Property } from "@/lib/api";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";
import { useOneRowListing } from "@/hooks/useOneRowListing";

export function PreConstructionSection() {
  /*
   * ──────────────────────────────────────────────────────────────────────────────
   * INTELLIGENT FETCHING LOGIC (DO NOT REMOVE)
   * This section implements Breakpoint-Aware Incremental Fetching.
   * ──────────────────────────────────────────────────────────────────────────────
   */
  const { openQuickView } = useQuickView();
  const { properties, totalCount, isLoading, requestedCount } =
    useOneRowListing((p) => fetchPreConnProperties(p));

  return (
    <PropertyGridSection
      title="Pre-Construction Properties"
      subtitle={`Exclusive pre-construction investment opportunities (${totalCount || properties.length})`}
      viewAllHref="/Precon"
      properties={properties}
      totalCount={totalCount}
      isLoading={isLoading}
      onQuickView={openQuickView}
      emptyTitle="No pre-construction properties found"
      emptySubtitle="Check back soon for new developments."
      oneRowOnly={true}
      limit={requestedCount}
    />
  );
}
