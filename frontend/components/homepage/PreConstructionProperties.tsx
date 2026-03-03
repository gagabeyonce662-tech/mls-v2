// components/homepage/PreConstructionProperties.tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import PropertyCard from "@/components/PropertyCard";

interface PreConstructionPropertiesProps {
  searchQuery?: string;
  properties: any[];
  isLoading: boolean;
  onQuickView?: (property: any) => void;
  totalCount?: number;
}

export default function PreConstructionProperties({
  searchQuery,
  properties,
  isLoading,
  onQuickView,
  totalCount,
}: PreConstructionPropertiesProps) {
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
              {searchQuery
                ? `Pre-Construction in ${searchQuery}`
                : "Pre-Construction Properties"}
            </h2>
            <p style={{ color: colors.body }}>
              {showLoadingSkeletons
                ? "Searching for projects..."
                : `Exclusive pre-construction investment opportunities (${totalCount || properties.length})`}
            </p>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href="/Precon"
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showLoadingSkeletons
            ? [...Array(4)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-2xl overflow-hidden animate-pulse"
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
                .slice(0, 4)
                .map((property, index) => (
                  <PropertyCard
                    key={
                      property.listing_key ||
                      property.PropertyKey ||
                      `precon-${index}`
                    }
                    property={property}
                    variant="featured"
                    index={index}
                    onQuickView={onQuickView}
                  />
                ))
              : !showLoadingSkeletons && (
                <div className="col-span-3 text-center py-16">
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: colors.heading }}
                  >
                    No pre-construction properties found
                  </h2>
                  <p className="text-sm" style={{ color: colors.body }}>
                    Check back soon for new developments.
                  </p>
                </div>
              )}
        </div>

        {/* Mobile View All */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/Precon"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All Pre-Construction
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
