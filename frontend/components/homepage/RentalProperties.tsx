// components/homepage/RentalProperties.tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import PropertyCard from "@/components/PropertyCard";

interface RentalPropertiesProps {
  searchQuery?: string;
  properties: any[];
  isLoading: boolean;
  onQuickView?: (property: any) => void;
  totalCount?: number;
}

export default function RentalProperties({
  searchQuery,
  properties,
  isLoading,
  onQuickView,
  totalCount,
}: RentalPropertiesProps) {
  const showLoadingSkeletons = isLoading;

  return (
    <div className="py-12">
      <div className="w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              Rental Properties
            </h2>
            <p className="text-sm" style={{ color: colors.body }}>
              {showLoadingSkeletons
                ? "Finding rental properties..."
                : `Find your perfect rental property (${totalCount || properties.length} available)`}
            </p>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href="/listing/rental"
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All Rentals
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

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
                    key={property.listing_key || property.PropertyKey || `rental-${index}`}
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
                    No rental properties found
                  </div>
                  <p style={{ color: colors.body }}>
                    Check back soon for new rental listings.
                  </p>
                </div>
              )}
        </div>

        {/* Mobile View All */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/listing/rental"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All Rentals ({properties.length})
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
