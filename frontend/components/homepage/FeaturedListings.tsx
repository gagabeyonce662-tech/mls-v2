// components/homepage/FeaturedListings.tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { Property, PropertyFilterParams } from "@/lib/api";
import { useProperties } from "@/hooks/react-query";
import PropertyCard from "@/components/PropertyCard";

interface FeaturedListingsProps {
  filters?: PropertyFilterParams;
  properties?: Property[];
  searchQuery: string;
  isLoading?: boolean;
  onQuickView?: (property: Property) => void;
  totalCount?: number;
}

export default function FeaturedListings({
  filters,
  searchQuery,
  properties: propsProperties,
  isLoading: propsIsLoading,
  onQuickView,
  totalCount: propsTotalCount,
}: FeaturedListingsProps) {
  const {
    data: hookProperties = [],
    isLoading: hookIsLoading,
    isError,
    isFetching,
  } = useProperties(filters, {
    placeholderData: [],
    enabled: !propsProperties,
  });

  const properties = propsProperties || hookProperties;
  const totalCount = propsTotalCount !== undefined ? propsTotalCount : (hookProperties as any).count || properties.length;
  const isLoading =
    propsIsLoading !== undefined ? propsIsLoading : hookIsLoading;
  const showLoadingSkeletons =
    isLoading || (propsProperties ? false : isFetching);

  return (
    <div className="py-12">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              {searchQuery
                ? `Properties in ${searchQuery}`
                : "Featured Properties"}
            </h2>
            <p className="text-sm" style={{ color: colors.body }}>
              {showLoadingSkeletons
                ? "Finding properties..."
                : `${totalCount} properties found`}
            </p>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href="/listing"
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All Properties
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Error State */}
        {!propsProperties && isError && (
          <div className="text-center py-16">
            <div
              className="text-xl font-semibold mb-2"
              style={{ color: colors.heading }}
            >
              Error loading properties
            </div>
            <p style={{ color: colors.body }}>
              Please try again later or contact support.
            </p>
          </div>
        )}

        {/* Responsive Grid - Default 4 on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-6">
          {showLoadingSkeletons
            ? [...Array(8)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={`w-full rounded-2xl overflow-hidden animate-pulse ${i === 0 ? "block" :
                  i === 1 ? "hidden sm:block" :
                    i < 4 ? "hidden lg:block" :
                      i === 4 ? "hidden xl:block" :
                        i === 5 ? "hidden 2xl:block" :
                          "hidden 3xl:block"
                  }`}
                style={{ border: `1px solid ${colors.cardsBoarder}` }}
              >
                <div
                  className="h-56 w-full"
                  style={{ backgroundColor: colors.boarder }}
                />
                <div className="p-4 space-y-3 bg-white">
                  <div
                    className="h-5 w-1/2 rounded"
                    style={{ backgroundColor: colors.boarder }}
                  />
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ backgroundColor: colors.boarder }}
                  />
                  <div
                    className="h-3 w-full rounded"
                    style={{ backgroundColor: colors.boarder }}
                  />
                  <div
                    className="border-t my-2"
                    style={{ borderColor: colors.cardsBoarder }}
                  />
                  <div className="flex gap-4">
                    <div
                      className="h-4 w-14 rounded"
                      style={{ backgroundColor: colors.boarder }}
                    />
                    <div
                      className="h-4 w-14 rounded"
                      style={{ backgroundColor: colors.boarder }}
                    />
                  </div>
                </div>
              </div>
            ))
            : properties.length > 0
              ? properties
                .slice(0, 8)
                .map((property, index) => (
                  <div
                    key={property.listing_key || property.PropertyKey || `feat-${index}`}
                    className={`w-full ${index === 0 ? "block" :
                      index === 1 ? "hidden sm:block" :
                        index < 4 ? "hidden lg:block" :
                          index === 4 ? "hidden xl:block" :
                            index === 5 ? "hidden 2xl:block" :
                              "hidden 3xl:block"
                      }`}
                  >
                    <PropertyCard
                      property={property}
                      variant="featured"
                      index={index}
                      onQuickView={onQuickView}
                    />
                  </div>
                ))
              : !showLoadingSkeletons && (
                <div className="w-full text-center py-16">
                  <div
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.heading }}
                  >
                    No properties found
                  </div>
                  <p style={{ color: colors.body }}>
                    Try searching for a different city or check your spelling.
                  </p>
                </div>
              )}
        </div>

        {/* Mobile View All */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/listing"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All Properties
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
