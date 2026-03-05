"use client";

import { useSearch } from "@/contexts/SearchContext";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";

export function SearchResultsSection() {
    const { searchQuery, searchResults, isSearching, filteredProperties, filterLabel } = useSearch();
    const { openQuickView } = useQuickView();

    // Determine which results to show
    // If there are searchResults from the hero, we show those.
    // If there are filteredProperties from the filter bar, we show those if no global search is active?
    // Actually, the page.tsx logic showed searchResults if searchQuery was present.

    // page.tsx logic:
    // {searchQuery && (
    //   <FeaturedListings properties={searchResults} ... />
    // )}

    // We'll follow that. If searchQuery exists, it's global search.
    // If filterLabel/filteredProperties exist, it's the filter results.

    const properties = searchResults.length > 0 ? searchResults : filteredProperties;
    const query = searchQuery || filterLabel;
    const isLoading = isSearching;

    if (!query && properties.length === 0) return null;

    return (
        <PropertyGridSection
            title={query ? `Properties in ${query}` : "Search Results"}
            viewAllHref="/listing"
            properties={properties}
            isLoading={isLoading}
            onQuickView={openQuickView}
        />
    );
}
