"use client";

import { useQuickView } from "@/contexts/QuickViewContext";
import NewlyListedListings from "@/components/homepage/NewlyListedListings";

export function NewlyListedSection() {
  const { openQuickView } = useQuickView();

  return (
    <NewlyListedListings
      searchQuery="Latest Properties"
      showLimit={8}
      onQuickView={openQuickView}
    />
  );
}
