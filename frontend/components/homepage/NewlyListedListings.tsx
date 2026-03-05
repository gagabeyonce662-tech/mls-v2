// components/homepage/NewlyListedListings.tsx
"use client";

import Link from "next/link";
import { ChevronRight, Calendar } from "lucide-react";
import { colors } from "@/config/design-system";
import { fetchNewlyListedProperties, type Property } from "@/lib/api";
import { useState, useEffect } from "react";
import PropertyCard from "@/components/PropertyCard";

interface NewlyListedListingsProps {
  searchQuery?: string;
  showLimit?: number;
  onQuickView?: (property: Property) => void;
}

export default function NewlyListedListings({
  searchQuery = "",
  showLimit = 6,
  onQuickView,
}: NewlyListedListingsProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchNewlyListedProperties({
          limit: showLimit,
          search:
            searchQuery && searchQuery !== "Latest Properties"
              ? searchQuery
              : undefined,
        });
        setProperties(response.results || []);
        setTotalCount(response.count || (response.results || []).length);
      } catch (error) {
        console.error("Error fetching newly listed properties:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showLimit, searchQuery]);

  return (
    <div className="pt-8 pb-12">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center overflow-x-auto justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
              <h2
                className="text-2xl font-bold"
                style={{ color: colors.heading }}
              >
                {searchQuery || "Newly Listed Properties"}
              </h2>
            </div>
            <p className="text-sm" style={{ color: colors.body }}>
              {isLoading
                ? "Finding new listings..."
                : `${totalCount} new properties available`}
            </p>
          </div>

          {!isLoading && properties.length > 0 && (
            <Link
              href="/new-listings"
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All New Listings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Error State */}
        {isError && (
          <div className="text-center py-16">
            <div
              className="text-xl font-semibold mb-2"
              style={{ color: colors.heading }}
            >
              Error loading newly listed properties
            </div>
            <p style={{ color: colors.body }}>
              Please try again later or contact support.
            </p>
          </div>
        )}

        {/* Responsive Grid - Default 4 on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-6">
          {isLoading
            ? [...Array(8)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className={`w-full rounded-2xl overflow-hidden animate-pulse ${i === 0 ? "block" :
                  i === 1 ? "hidden sm:block" :
                    i < 4 ? "hidden lg:block" :
                      i < 6 ? "hidden 2xl:block" :
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
                    key={
                      property.listing_key ||
                      property.PropertyKey ||
                      `new-${index}`
                    }
                    className={`w-full ${index === 0 ? "block" :
                        index === 1 ? "hidden sm:block" :
                          index < 4 ? "hidden lg:block" :
                            index < 6 ? "hidden 2xl:block" :
                              "hidden 3xl:block"
                      }`}
                  >
                    <PropertyCard
                      property={property}
                      variant="new"
                      index={index}
                      onQuickView={onQuickView}
                    />
                  </div>
                ))
              : !isLoading && (
                <div className="w-full text-center py-16">
                  <div
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.heading }}
                  >
                    No newly listed properties found
                  </div>
                  <p style={{ color: colors.body }}>
                    Check back soon for new property listings.
                  </p>
                </div>
              )}
        </div>

        {/* Mobile View All */}
        {!isLoading && properties.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/new-listings"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              View All New Listings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
