"use client";

import { useSearch } from "@/contexts/SearchContext";
import { PropertyGridSection } from "@/components/shared/PropertyGridSection";
import { useQuickView } from "@/contexts/QuickViewContext";
import { useOneRowListing } from "@/hooks/useOneRowListing";
import { searchProperties } from "@/lib/api";

export function SearchResultsSection() {
  const { searchQuery, filteredProperties, filterLabel } = useSearch();
  const { openQuickView } = useQuickView();

  const query = searchQuery || filterLabel;

  const { properties, totalCount, isLoading, isError, requestedCount } =
    useOneRowListing(
      async (params) => {
        if (!query) return { results: [], count: 0 };

        // If we have manual filter injected results, use them
        // otherwise fetch using the search query
        const results = searchQuery
          ? await searchProperties(searchQuery)
          : filteredProperties;

        return {
          results: results.slice(params.offset, params.offset + params.limit),
          count: results.length,
        };
      },
      [searchQuery, filteredProperties, filterLabel],
    );

  if (!query && properties.length === 0) return null;

  return (
    <PropertyGridSection
      title={query ? `Properties in ${query}` : "Search Results"}
      viewAllHref={`/listing?search=${encodeURIComponent(query)}`}
      properties={properties}
      isLoading={isLoading}
      isError={isError}
      totalCount={totalCount}
      onQuickView={openQuickView}
      oneRowOnly={true}
      limit={requestedCount}
    />
  );
}
