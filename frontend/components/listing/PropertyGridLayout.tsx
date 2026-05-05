import React, { useRef, useCallback } from "react";
import PropertyCard from "@/components/PropertyCard";
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
  interactions,
  emptyMessage,
  variant = "grid",
}: PropertyGridLayoutProps) {
  const handleQuickView = interactions?.handleQuickView;

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
                    variant="featured"
                    index={index}
                    onQuickView={handleQuickView}
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
