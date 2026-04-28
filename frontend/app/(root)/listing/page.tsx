"use client";

import React, { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { colors } from "@/config/design-system";
import {
  useInfiniteFilteredProperties,
} from "@/hooks/react-query";
import { useUserAuth } from "@/contexts/UserAuthContext";

// Modular Components
import { CompareModal } from "@/components/listing/CompareModal";
import PropertyFilter from "@/components/PropertyFilter";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";
import { ExclusivePropertyFilterParams } from "@/lib/api";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { formatPrice } from "@/lib/propertyUtils";

import { useSearchParams } from "next/navigation";
import { useSearch } from "@/contexts/SearchContext";
import { ListingMapView } from "@/components/listing/ListingMapView";
import { MapToggleButton } from "@/components/listing/MapToggleButton";

export default function ListingsPage() {
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

  const searchParams = useSearchParams();
  const initialCity =
    searchParams.get("city") || searchParams.get("search") || "";

  // Filter state
  const [filterParams, setFilterParams] =
    useState<ExclusivePropertyFilterParams>({
      city: initialCity || undefined,
    });

  const currentCity = filterParams.city || "";
  const activeSearchTerm = filterParams.search || filterParams.city || "";

  // Use TanStack Query for infinite scroll
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteFilteredProperties(
    {
      ...filterParams,
      limit: 12,
    },
    {
      enabled: true,
    },
  );

  // Extract all properties from pages
  const allProperties = data?.pages.flatMap((page) => page.results) || [];
  const displayedProperties = allProperties;
  const primaryPageMeta = data?.pages?.[0];
  const fallbackMessage =
    primaryPageMeta?.fallback_applied
      ? primaryPageMeta?.fallback_stage === "nearby_suggestions" &&
        Array.isArray(primaryPageMeta?.suggested_locations) &&
        primaryPageMeta.suggested_locations.length > 0
        ? `No exact matches. Showing nearby results in ${primaryPageMeta.suggested_locations.slice(0, 3).join(", ")}.`
        : `No exact matches. Showing closest results${activeSearchTerm ? ` for "${activeSearchTerm}"` : ""}.`
      : null;

  const handleApplyFilters = useCallback(
    (newFilters: ExclusivePropertyFilterParams) => {
      setFilterParams(newFilters);
      // Note: react-query will automatically refetch when filterParams (queryKey) changes
    },
    [],
  );

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
              {currentCity
                ? `Properties in ${currentCity}`
                : "All Properties"}
            </h1>
            <p style={{ color: colors.body }}>
              {isLoading
                ? "Loading..."
                : `${displayedProperties.length} properties found`}
              {hasNextPage && !isLoading && " • Scroll to load more"}
            </p>
            {fallbackMessage && (
              <p className="mt-2 text-sm text-amber-700">{fallbackMessage}</p>
            )}
          </div>

          <div className="mb-4">
            <PropertyFilter
              variant="horizontal"
              onApplyFilters={handleApplyFilters}
              initialCity={initialCity}
            />
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
              properties={displayedProperties}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoggedIn={isLoggedIn}
              interactions={interactions}
              currentCity={currentCity}
            />
          ) : (
            <ListingMapView
              properties={displayedProperties}
              isLoading={isLoading}
            />
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

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0.7;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
