"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyFilter from "@/components/PropertyFilter";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { ListingMapView } from "@/components/listing/ListingMapView";
import { MapToggleButton } from "@/components/listing/MapToggleButton";
import { CompareModal } from "@/components/listing/CompareModal";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { useInfiniteExclusiveProperties } from "@/hooks/react-query";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { colors } from "@/config/design-system";
import { formatPrice } from "@/lib/propertyUtils";
import { searchParamsToFilters } from "@/lib/searchParams";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const interactions = usePropertyInteractions();
  const {
    showQuickView,
    selectedProperty,
    showCompareModal,
    handleViewFromModal,
    closeCompareModal,
    closeQuickView,
  } = interactions;
  const { viewMode, toggleViewMode } = useSearch();

  const filterParams = useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams],
  );

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteExclusiveProperties(
    {
      ...filterParams,
      limit: filterParams.limit || 12,
    },
    {
      enabled: true,
    },
  );

  const allProperties = data?.pages.flatMap((page) => page.results) || [];
  const headingCity = filterParams.city?.trim();
  const primaryPageMeta = data?.pages?.[0];
  const fallbackMessage =
    primaryPageMeta?.fallback_applied
      ? primaryPageMeta?.fallback_stage === "nearby_suggestions" &&
        Array.isArray(primaryPageMeta?.suggested_locations) &&
        primaryPageMeta.suggested_locations.length > 0
        ? `No exact matches. Showing nearby results in ${primaryPageMeta.suggested_locations.slice(0, 3).join(", ")}.`
        : "No exact matches. Showing closest available results."
      : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="root-content-offset pb-16 pt-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              {headingCity
                ? `Search Results in ${headingCity}`
                : "Search Results"}
            </h1>
            <p style={{ color: colors.body }}>
              {isLoading ? "Loading..." : `${allProperties.length} properties found`}
              {hasNextPage && !isLoading && " • Scroll to load more"}
            </p>
            {fallbackMessage && (
              <p className="mt-2 text-sm text-amber-700">{fallbackMessage}</p>
            )}
          </div>

          <div className="mb-4">
            <PropertyFilter variant="horizontal" initialCity={headingCity} />
          </div>

          {isError ? (
            <div className="text-center py-16">
              <div
                className="text-xl font-semibold mb-2"
                style={{ color: colors.heading }}
              >
                Error loading properties
              </div>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 rounded-lg transition-colors hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.cards,
                }}
              >
                Retry
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <PropertyGridLayout
              properties={allProperties}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoggedIn={isLoggedIn}
              interactions={interactions}
              currentCity={headingCity || ""}
            />
          ) : (
            <ListingMapView properties={allProperties} isLoading={isLoading} />
          )}
        </div>
      </div>

      <CompareModal
        show={showCompareModal}
        selectedProperty={selectedProperty}
        onClose={closeCompareModal}
        onViewDetails={handleViewFromModal}
        onAddToCompare={() => {
          if (selectedProperty) {
            interactions.handleToggleCompare(selectedProperty);
          }
          closeCompareModal();
        }}
        formatPrice={formatPrice}
      />

      <PropertyQuickViewModal
        show={showQuickView}
        property={selectedProperty}
        onClose={closeQuickView}
      />

      <Footer />
      <MapToggleButton viewMode={viewMode} onToggle={toggleViewMode} />
    </div>
  );
}
