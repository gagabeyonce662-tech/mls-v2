components / listing / PropertyGridLayout.tsx;
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";

import PropertyCard from "@/components/PropertyCard";
import type { Property } from "@/lib/api";
import { getPropertyKey } from "@/lib/propertyUtils";
import { cn } from "@/lib/utils";

interface PropertyGridLayoutProps {
  properties: Property[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  isLoggedIn: boolean;
  interactions: {
    handleQuickView?: (property: Property) => void;
  };
  currentCity?: string;
  emptyMessage?: ReactNode;
  variant?: "grid" | "row";
  cardLayout?: "default" | "compact";
}

interface PropertyGridSkeletonProps {
  variant: "grid" | "row";
}

function PropertyGridSkeleton({ variant }: PropertyGridSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white",
        variant === "row" && "min-w-[280px] max-w-[340px]",
      )}
    >
      <div className="aspect-[16/10] animate-pulse bg-gray-200" />

      <div className="space-y-4 p-4">
        <div className="h-6 w-2/5 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
          <div className="h-5 animate-pulse rounded bg-gray-200" />
          <div className="h-5 animate-pulse rounded bg-gray-200" />
          <div className="h-5 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
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
  cardLayout = "default",
}: PropertyGridLayoutProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const handleQuickView = interactions?.handleQuickView;

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const lastPropertyRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || isLoading || isFetchingNextPage) {
        return;
      }

      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const firstEntry = entries[0];

          if (
            firstEntry?.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            void fetchNextPage();
          }
        },
        {
          rootMargin: "300px",
          threshold: 0.01,
        },
      );

      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading],
  );

  const containerClasses =
    variant === "row"
      ? "flex w-full flex-nowrap gap-5 overflow-x-auto pb-3"
      : [
          "grid w-full grid-cols-1 gap-5",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "2xl:grid-cols-4",
        ].join(" ");

  const itemClasses =
    variant === "row" ? "min-w-[280px] max-w-[340px] flex-1" : "min-w-0";

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, index) => (
      <PropertyGridSkeleton
        key={`property-grid-skeleton-${index}`}
        variant={variant}
      />
    ));

  if (isLoading && properties.length === 0) {
    return (
      <div className={containerClasses}>
        {renderSkeletons(variant === "row" ? 4 : 8)}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <>
        {emptyMessage || (
          <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No properties found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try changing the location, price range, or property type.
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={containerClasses}>
      {properties.map((property, index) => {
        const propertyKey =
          getPropertyKey(property) ||
          (property as Record<string, unknown>).listing_key ||
          (property as Record<string, unknown>).PropertyKey ||
          `property-grid-${index}`;

        const isLastProperty = index === properties.length - 1;

        return (
          <div
            key={String(propertyKey)}
            ref={isLastProperty ? lastPropertyRef : null}
            className={itemClasses}
          >
            <PropertyCard
              property={property}
              variant="featured"
              layoutMode={cardLayout}
              index={index}
              onQuickView={handleQuickView}
            />
          </div>
        );
      })}

      {isFetchingNextPage && renderSkeletons(variant === "row" ? 2 : 4)}
    </div>
  );
}
