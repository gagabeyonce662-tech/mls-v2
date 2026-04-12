import React, { useRef, useCallback, useEffect, useState } from "react";
import { PropertyCard } from "@/components/listing/PropertyCard";
import { Property } from "@/lib/api";
import { getPropertyKey } from "@/lib/propertyUtils";
import { colors } from "@/config/design-system";
import { cn } from "@/lib/utils";

interface PropertyGridLayoutProps {
  properties: Property[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isLoggedIn: boolean;
  interactions: any;
  currentCity?: string;
  emptyMessage?: React.ReactNode;
  variant?: "grid" | "row";
}

export function PropertyGridLayout({
  properties,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  isLoggedIn,
  interactions,
  currentCity,
  emptyMessage,
  variant = "grid",
}: PropertyGridLayoutProps) {
  const [loadedCards, setLoadedCards] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const {
    clickedProperty,
    selectedProperty,
    handlePropertyClick,
    handleToggleCompare,
    handleQuickView,
  } = interactions;

  // Gradually load cards with staggered animation
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      const timer = setTimeout(() => {
        const keysToLoad = properties
          .map((p) => getPropertyKey(p) || (p as any).listing_key)
          .filter(Boolean);

        keysToLoad.forEach((propertyKey, index) => {
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
  }, [properties, isLoading]);

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
    },
    [handleImageLoad],
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
        className={cn(
          "bg-white rounded-xl shadow-md overflow-hidden animate-pulse min-h-[300px]",
          variant === "row" && "min-w-[220px] max-w-[320px]"
        )}
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

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPropertyRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }, {
        rootMargin: '100px', // Trigger slightly before the end
        threshold: 0.1
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const containerClasses = variant === "row"
    ? "flex flex-row flex-nowrap overflow-x-auto gap-4 w-full"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-6 w-full";

  const itemClasses = variant === "row"
    ? "flex-1 min-w-[220px] max-w-[320px]"
    : "w-full";

  return (
    <>
      {isLoading && properties.length === 0 ? (
        <div className={containerClasses}>
          {renderSkeletons()}
        </div>
      ) : properties.length > 0 ? (
        <>
          <div className={containerClasses}>
            {properties.map((property: Property, index: number) => {
              const propertyKey =
                getPropertyKey(property) ||
                (property as any).listing_key ||
                (property as any).PropertyKey ||
                `grid-${index}`;

              return (
                <div
                  key={propertyKey}
                  ref={index === properties.length - 1 ? lastPropertyRef : null}
                  className={itemClasses}
                >
                  <PropertyCard
                    property={property}
                    propertyKey={propertyKey}
                    isLoggedIn={isLoggedIn}
                    isLocked={false}
                    isSelected={
                      interactions.isPropertySelected?.(propertyKey) ?? false
                    }
                    imageUrl={getPropertyImageUrl(property)}
                    imageLoaded={loadedImages.has(propertyKey)}
                    cardLoaded={loadedCards.has(propertyKey)}
                    isClicked={clickedProperty === propertyKey}
                    onCardClick={() => handlePropertyClick(property)}
                    onMouseEnter={() => { }} // We might not need prefetch if quick view is handling it
                    onCompare={() => handleToggleCompare(property)}
                    onQuickView={() => handleQuickView(property)}
                    onImageLoad={() => handleImageLoad(propertyKey)}
                    onImageError={(key, e) => handleImageError(key, e)}
                    formatPrice={formatPrice}
                  />
                </div>
              );
            })}
            {(isLoading || isFetchingNextPage) && renderSkeletons()}
          </div>

        </>
      ) : (
        emptyMessage || (
          <div className="text-center py-16 w-full">
            <p className="text-ds-body mb-4">No properties found.</p>
          </div>
        )
      )}
    </>
  );
}
