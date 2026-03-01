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
}

export default function NewlyListedListings({
  searchQuery = "",
  showLimit = 6,
}: NewlyListedListingsProps) {
  const [properties, setProperties] = useState<Property[]>([]);
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
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            <p style={{ color: colors.body }}>
              {isLoading
                ? "Finding new listings..."
                : `${properties.length} new properties available`}
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [...Array(showLimit)].map((_, i) => (
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
                  .slice(0, showLimit)
                  .map((property, index) => (
                    <PropertyCard
                      key={
                        property.listing_key ||
                        property.PropertyKey ||
                        `new-${index}`
                      }
                      property={property}
                      variant="new"
                      index={index}
                    />
                  ))
              : !isLoading && (
                  <div className="col-span-3 text-center py-16">
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
