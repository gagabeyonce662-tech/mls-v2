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
import { useCompare } from "@/contexts/CompareContext";
import { useWatched } from "@/contexts/WatchedContext";

// Modular Components
import { PropertyCard } from "@/components/listing/PropertyCard";
import { CompareModal } from "@/components/listing/CompareModal";
import PropertyFilter from "@/components/PropertyFilter";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";
import { ExclusivePropertyFilterParams } from "@/lib/api";
import { SearchProvider } from "@/contexts/SearchContext";

import { useSearchParams } from "next/navigation";

export default function ListingsPage() {
  const router = useRouter();
  const { user } = useUserAuth();
  const isLoggedIn = !!user;

  // Quick View State
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewProperty, setQuickViewProperty] = useState<any>(null);

  const handleQuickView = useCallback((property: any) => {
    setQuickViewProperty(property);
    setShowQuickView(true);
  }, []);

  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "";

  // Filter state
  const [filterParams, setFilterParams] =
    useState<ExclusivePropertyFilterParams>({
      city: initialCity || undefined,
    });

  const currentCity = filterParams.city || "";

  // Compare state from context
  const {
    compareList,
    addToCompare,
    removeFromCompare,
    isPropertySelected,
    getPropertyKey,
  } = useCompare();

  const { addToHistory } = useWatched();

  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Loading and animation states
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadedCards, setLoadedCards] = useState<Set<string>>(new Set());
  const [clickedProperty, setClickedProperty] = useState<string | null>(null);

  // Get the prefetch function
  const prefetchProperty = usePrefetchProperty();

  const handleImageLoad = useCallback((propertyKey: string) => {
    setLoadedImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(propertyKey);
      return newSet;
    });
  }, []);

  const handleImageError = useCallback(
    (propertyKey: string, e: React.SyntheticEvent<HTMLImageElement>) => {
      handleImageLoad(propertyKey);
      e.currentTarget.style.display = "none";
    },
    [handleImageLoad],
  );

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

  // Gradually load cards with staggered animation
  useEffect(() => {
    if (!isLoading && allProperties.length > 0) {
      const timer = setTimeout(() => {
        const propertyKeys = allProperties.map((property) =>
          getPropertyKey(property),
        );
        propertyKeys.forEach((propertyKey, index) => {
          setTimeout(
            () => {
              setLoadedCards((prev) => {
                const newSet = new Set(prev);
                newSet.add(propertyKey);
                return newSet;
              });
            },
            50 + index * 50,
          );
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [allProperties, isLoading, getPropertyKey]);

  const [prevParamsStr, setPrevParamsStr] = useState(
    JSON.stringify(filterParams),
  );
  if (JSON.stringify(filterParams) !== prevParamsStr) {
    setPrevParamsStr(JSON.stringify(filterParams));
    setLoadedCards(new Set());
    setLoadedImages(new Set());
  }

  const handleApplyFilters = useCallback(
    (newFilters: ExclusivePropertyFilterParams) => {
      setFilterParams(newFilters);
      // Note: react-query will automatically refetch when filterParams (queryKey) changes
    },
    [],
  );

  const getPropertyImageUrl = (property: any) => {
    try {
      const candidates = [
        property?.media,
        property?.Media,
        property?.photos,
        property?.Photos,
      ];

      for (const field of candidates) {
        if (!field) continue;
        if (Array.isArray(field) && field.length > 0) {
          const first = field[0];
          if (first && typeof first === "object") {
            if (first.media_url) return first.media_url;
            if (first.MediaURL) return first.MediaURL;
            if (first.PhotoURL) return first.PhotoURL;
          }
          if (typeof first === "string") return first;
        } else if (typeof field === "object") {
          if (field.media_url) return field.media_url;
          if (field.MediaURL) return field.MediaURL;
        }
      }

      const fallbackFields = [
        property?.photo_url,
        property?.thumbnail_url,
        property?.image_url,
      ].filter(Boolean);

      if (fallbackFields.length > 0) {
        return fallbackFields[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handlePropertyClick = (property: any) => {
    setClickedProperty(getPropertyKey(property));
    addToHistory(property); // Track viewing
    const alreadySelected = isPropertySelected(getPropertyKey(property));

    if (compareList.length > 0) {
      if (alreadySelected) {
        removeFromCompare(getPropertyKey(property));
      } else {
        addToCompare(property);
      }
      setTimeout(() => setClickedProperty(null), 300);
      return;
    }

    setSelectedProperty(property);
    setShowCompareModal(true);
    setTimeout(() => setClickedProperty(null), 300);
  };

  const handleCompareSelect = () => {
    if (!selectedProperty) return;
    addToCompare(selectedProperty);
    setShowCompareModal(false);
    setSelectedProperty(null);
  };

  const handleViewFromModal = () => {
    if (!selectedProperty) return;
    addToHistory(selectedProperty); // Track viewing
    setShowCompareModal(false);
    router.push(`/listing/${getPropertyKey(selectedProperty)}`);
    setSelectedProperty(null);
  };

  // handleViewFromModal and others remain untouched here

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPropertyRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const formatPrice = (price: any) => {
    const numPrice =
      typeof price === "string"
        ? parseFloat(price.replace(/[^0-9.-]+/g, ""))
        : price || 0;

    if (numPrice === 0) return "Price on Request";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

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
    <SearchProvider>
      <div className="min-h-screen bg-white">
        <Header />

        <div className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              />
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2
                  className="w-16 h-16 animate-spin"
                  style={{ color: colors.primary }}
                />
                <span className="mt-4" style={{ color: colors.body }}>
                  Loading properties...
                </span>
              </div>
            )}

            {isError && (
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allProperties.map((property, index) => {
                const propertyKey = getPropertyKey(property);
                return (
                  <div
                    key={propertyKey}
                    ref={
                      index === allProperties.length - 1
                        ? lastPropertyRef
                        : null
                    }
                  >
                    <PropertyCard
                      property={property}
                      propertyKey={propertyKey}
                      isLoggedIn={isLoggedIn}
                      isLocked={!isLoggedIn && index >= 8}
                      isSelected={isPropertySelected(propertyKey)}
                      imageUrl={getPropertyImageUrl(property)}
                      imageLoaded={loadedImages.has(propertyKey)}
                      cardLoaded={loadedCards.has(propertyKey)}
                      isClicked={clickedProperty === propertyKey}
                      onCardClick={handlePropertyClick}
                      onMouseEnter={prefetchProperty}
                      onQuickView={handleQuickView}
                      onImageLoad={handleImageLoad}
                      onImageError={handleImageError}
                      formatPrice={formatPrice}
                    />
                  </div>
                );
              })}
              {(isLoading || isFetchingNextPage) && renderSkeletons()}
            </div>

            {!hasNextPage && allProperties.length > 0 && (
              <div className="text-center py-8">
                <p style={{ color: colors.body }}>
                  {currentCity
                    ? `Showing all ${allProperties.length} properties in ${currentCity}`
                    : `End of results - ${allProperties.length} properties loaded`}
                </p>
              </div>
            )}
          </div>
        </div>

        <CompareModal
          show={showCompareModal}
          selectedProperty={selectedProperty}
          onClose={() => setShowCompareModal(false)}
          onViewDetails={handleViewFromModal}
          onAddToCompare={handleCompareSelect}
          formatPrice={formatPrice}
        />

        <PropertyQuickViewModal
          show={showQuickView}
          property={quickViewProperty}
          onClose={() => setShowQuickView(false)}
        />

        <Footer />

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
    </SearchProvider>
  );
}
