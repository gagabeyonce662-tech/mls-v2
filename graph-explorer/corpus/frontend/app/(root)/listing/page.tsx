"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { colors } from "@/config/design-system";
import {
  useInfiniteExclusiveProperties,
  usePrefetchProperty,
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
    handleCompareSelect,
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

  // Use TanStack Query for infinite scroll
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
      limit: 12,
    },
    {
      enabled: true,
    },
  );

  // Extract all properties from pages
  const allProperties = data?.pages.flatMap((page) => page.results) || [];

  const handleApplyFilters = useCallback(
    (newFilters: ExclusivePropertyFilterParams) => {
      setFilterParams(newFilters);
      // Note: react-query will automatically refetch when filterParams (queryKey) changes
    },
    [],
  );

  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse min-h-[300px]"
      >
        <div
          className="h-48 w-full"
          style={{ backgroundColor: colors.boarder }}
        />
        <div className="p-4 space-y-3">
          <div
            className="h-4 w-3/4 rounded"
            style={{ backgroundColor: colors.boarder }}
          />
          <div
            className="h-6 w-1/2 rounded"
            style={{ backgroundColor: colors.boarder }}
          />
          <div className="flex gap-4 mt-3">
            <div
              className="h-3 w-12 rounded"
              style={{ backgroundColor: colors.boarder }}
            />
            <div
              className="h-3 w-12 rounded"
              style={{ backgroundColor: colors.boarder }}
            />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-32 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              {currentCity
                ? `Exclusive Properties in ${currentCity}`
                : "All Exclusive Properties"}
            </h1>
            <p style={{ color: colors.body }}>
              {isLoading
                ? "Loading..."
                : `${allProperties.length} properties found`}
              {hasNextPage && !isLoading && " • Scroll to load more"}
            </p>
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
              properties={allProperties}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoggedIn={isLoggedIn}
              interactions={interactions}
              currentCity={currentCity}
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
