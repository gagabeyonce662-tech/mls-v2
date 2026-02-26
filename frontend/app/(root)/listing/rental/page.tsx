"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bed,
  Bath,
  Maximize,
  Heart,
  Loader2,
  ArrowLeft,
  Search,
  X,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { colors } from "@/config/design-system";
import {
  useInfiniteLeaseProperties,
  useLeaseProperties,
  type Property,
} from "@/hooks/react-query";

// Helper function to fix media field in properties
const fixPropertyMedia = (property: any): Property => {
  // Ensure media is always an array
  let mediaArray: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }> = [];

  if (property.media) {
    if (Array.isArray(property.media)) {
      // Already an array
      mediaArray = property.media;
    } else if (typeof property.media === "object" && property.media !== null) {
      // Single media object
      if (property.media.media_url) {
        mediaArray = [
          {
            media_url: property.media.media_url,
            media_category: property.media.media_category || "Property Photo",
            is_preferred:
              property.media.is_preferred !== undefined
                ? property.media.is_preferred
                : true,
            order:
              property.media.order !== undefined ? property.media.order : 0,
          },
        ];
      }
    }
  }

  // Create fixed property
  return {
    ...property,
    media: mediaArray,
    // Ensure Photos array exists for legacy compatibility
    Photos: mediaArray.map((m) => ({
      PhotoURL: m.media_url,
      MediaCategory: m.media_category,
      IsPreferred: m.is_preferred,
      Order: m.order,
    })),
    // Ensure Media array exists for legacy compatibility
    Media: mediaArray,
  };
};

export default function RentalListingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("All Rental Properties");
  const [isSearching, setIsSearching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPropertyRef = useRef<HTMLDivElement | null>(null);

  // AUTH: Replace this with your real auth state
  const isLoggedIn = false;

  // Use React Query hook for infinite loading with city filter
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = useInfiniteLeaseProperties(
    currentCity ? { city: currentCity } : undefined,
  );

  // Calculate all properties from infinite query pages with fixed media
  const properties = React.useMemo(() => {
    if (!infiniteData?.pages) return [];

    const allProperties = infiniteData.pages.flatMap(
      (page) => page.results || [],
    );

    // Fix the media field for each property
    return allProperties.map((property) => fixPropertyMedia(property));
  }, [infiniteData]);

  // Enhanced function to get property image URL
  const getPropertyImageUrl = (property: Property | any) => {
    try {
      // First try to get from fixed media array
      if (Array.isArray(property.media) && property.media.length > 0) {
        const mediaItem = property.media[0];
        if (mediaItem && mediaItem.media_url) {
          return mediaItem.media_url;
        }
      }

      // Fallback to legacy Photos array
      if (Array.isArray(property.Photos) && property.Photos.length > 0) {
        const photo = property.Photos[0];
        if (photo && photo.PhotoURL) {
          return photo.PhotoURL;
        }
      }

      // Fallback to raw media object (in case fixPropertyMedia wasn't applied)
      if (
        property.media &&
        typeof property.media === "object" &&
        !Array.isArray(property.media)
      ) {
        if (property.media.media_url) {
          return property.media.media_url;
        }
      }

      // Try to construct URL from listing_id
      if (property.listing_id) {
        return `https://ddfcdn.realtor.ca/listing/TS638995365813630000/reb82/highres/0/${property.listing_id}_1.jpg`;
      }

      // Try listing_key as fallback
      if (property.listing_key) {
        return `https://ddfcdn.realtor.ca/listing/TS638995365813630000/reb82/highres/0/${property.listing_key}_1.jpg`;
      }

      return null;
    } catch (e) {
      console.error("Error getting property image:", e);
      return null;
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setCurrentCity("");
      setSearchQuery("All Rental Properties");
    } else {
      setIsSearching(true);
      setCurrentCity(searchTerm.trim());
      setSearchQuery(`Rental Properties in ${searchTerm.trim()}`);
    }
    // Trigger refetch with new filter
    setTimeout(() => {
      refetch();
      setIsSearching(false);
    }, 100);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search and show all rental properties
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentCity("");
    setSearchQuery("All Rental Properties");
    // Trigger refetch without filter
    setTimeout(() => refetch(), 100);
  };

  // Load more properties when scrolled to bottom
  const loadMoreProperties = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, isSearching, fetchNextPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetching &&
          !isFetchingNextPage &&
          !isSearching
        ) {
          loadMoreProperties();
        }
      },
      { threshold: 0.1 },
    );

    if (lastPropertyRef.current) {
      observer.observe(lastPropertyRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isSearching,
    loadMoreProperties,
  ]);

  const getPropertyKey = (property: Property) => {
    return (
      property.listing_key ||
      property.PropertyKey ||
      `property-${property.city}-${property.ListPrice}`
    );
  };

  // Format price as monthly rent
  const formatMonthlyPrice = (price: number) => {
    if (!price || price === 0) return "Price on request";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format lease amount (per square foot)
  const formatLeaseAmount = (property: Property | any) => {
    if (property.lease_amount) {
      const amount = parseFloat(property.lease_amount);
      return `$${amount.toFixed(2)}/sq ft`;
    }
    return "Lease amount not specified";
  };

  // Get display price
  const getDisplayPrice = (property: Property | any) => {
    // For rentals, we might want to show lease_amount instead of list_price
    if (property.lease_amount) {
      return parseFloat(property.lease_amount);
    }
    return property.list_price
      ? parseFloat(property.list_price)
      : property.ListPrice || 0;
  };

  // Calculate loading states
  const isLoading = isQueryLoading || isSearching;
  const isLoadingMore = isFetchingNextPage;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Link
                href="/"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {searchQuery}
            </h1>
            <p className="text-gray-600">
              {properties.length > 0
                ? `Found ${properties.length} rental propert${properties.length === 1 ? "y" : "ies"}`
                : "Browse available rental properties across Canada"}
            </p>
          </div>

          {/* Simple Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search rental properties by city (e.g., Toronto, Vancouver, Ottawa)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                  disabled={isSearching}
                />

                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                    disabled={isSearching}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Quick Search Examples */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {["Toronto", "Vancouver", "Ottawa", "Montreal", "Calgary"].map(
                (city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSearchTerm(city);
                      setTimeout(() => handleSearch(), 100);
                    }}
                    disabled={isSearching}
                    className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {city}
                  </button>
                ),
              )}
              <button
                onClick={clearSearch}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Show All
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="text-red-600 font-medium mb-2">
                Error loading rental properties
              </div>
              <p className="text-gray-600 mb-4">
                Please try again later or contact support if the problem
                persists.
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isSearching) && (
            <div className="flex items-center justify-center py-16">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: colors.primary }}
              />
              <span className="ml-3 text-gray-600">
                {isSearching
                  ? "Searching rental properties..."
                  : "Loading rental properties..."}
              </span>
            </div>
          )}

          {/* Properties Grid */}
          {!isLoading && !error && properties.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property, index) => {
                  const propertyKey = getPropertyKey(property);
                  const displayPrice = getDisplayPrice(property);
                  const displayCity =
                    property.city || property.City || "Unknown City";
                  const displayPropertyType =
                    property.category_type ||
                    property.PropertySubType ||
                    "Retail Property";
                  const rawBedCount =
                    property.bedrooms_total || property.BedroomsTotal;
                  const bedCount =
                    typeof rawBedCount === "string"
                      ? parseFloat(rawBedCount) || 0
                      : rawBedCount || 0;

                  const rawBathCount =
                    property.bathrooms_total_integer ||
                    property.BathroomsTotalInteger;
                  const bathCount =
                    typeof rawBathCount === "string"
                      ? parseFloat(rawBathCount) || 0
                      : rawBathCount || 0;

                  const status =
                    property.standard_status ||
                    property.StandardStatus ||
                    "Active";
                  const leaseAmount = property.lease_amount
                    ? parseFloat(String(property.lease_amount))
                    : null;

                  const isLastProperty = index === properties.length - 1;
                  const imageUrl = getPropertyImageUrl(property);

                  // locked view: after the first 8 items, show blurred photo + CTA when NOT logged in
                  const locked = !isLoggedIn && index >= 8;

                  return (
                    <div
                      key={propertyKey}
                      ref={isLastProperty ? lastPropertyRef : null}
                    >
                      {locked ? (
                        // Locked card (not clickable)
                        <div className="bg-white rounded-xl shadow-md overflow-hidden block relative">
                          {/* Image container */}
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Rental property in ${displayCity}`}
                                className="w-full h-full object-cover filter blur-md scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "";
                                  target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 filter blur-md">
                                <div className="text-sm font-medium">
                                  No image found
                                </div>
                              </div>
                            )}

                            {/* translucent overlay to dim the blurred image and hold CTA */}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
                              <div className="text-center space-y-3 pointer-events-none">
                                {/* Buttons - allow pointer events only for buttons */}
                                <div className="mt-2 flex gap-3 justify-center pointer-events-auto">
                                  <Link
                                    href="/login"
                                    className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-gray-100"
                                  >
                                    Login
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Favorite icon still visible but disabled */}

                            <div className="absolute bottom-4 left-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  status === "Active"
                                    ? "bg-green-500 text-white"
                                    : status === "Pending"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-gray-500 text-white"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>

                          {/* Card body (small preview, read-only) */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {displayPropertyType} in {displayCity}
                            </h3>
                            <div className="flex items-center text-lg font-bold text-blue-600 mb-1">
                              <DollarSign className="w-5 h-5" />
                              {leaseAmount ? (
                                <span>{formatLeaseAmount(property)}</span>
                              ) : (
                                <span>{formatMonthlyPrice(displayPrice)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-gray-600 text-sm">
                              {bedCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  <span>{bedCount}</span>
                                </div>
                              )}
                              {bathCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  <span>{bathCount}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Maximize className="w-4 h-4" />
                                <span className="text-xs">
                                  {property.StateOrProvince}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Normal clickable card
                        <Link
                          href={`/listing/rental/${propertyKey}`}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow block"
                        >
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Rental property in ${displayCity}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "";
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent
                                      .querySelectorAll(".no-image-fallback")
                                      .forEach(
                                        (el) =>
                                          ((el as HTMLElement).style.display =
                                            "flex"),
                                      );
                                  }
                                }}
                              />
                            ) : (
                              <div className="no-image-fallback w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <div className="text-sm font-medium">
                                  No image found
                                </div>
                              </div>
                            )}

                            <div className="absolute bottom-4 left-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  status === "Active"
                                    ? "bg-green-500 text-white"
                                    : status === "Pending"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-gray-500 text-white"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {displayPropertyType} in {displayCity}
                            </h3>
                            <div className="flex items-center text-lg font-bold text-blue-600 mb-1">
                              <DollarSign className="w-5 h-5" />
                              {leaseAmount ? (
                                <span>{formatLeaseAmount(property)}</span>
                              ) : (
                                <span>{formatMonthlyPrice(displayPrice)}</span>
                              )}
                            </div>
                            {property.unparsed_address && (
                              <p className="text-sm text-gray-500 mb-2 truncate">
                                {property.unparsed_address}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-gray-600 text-sm">
                              {bedCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  <span>{bedCount}</span>
                                </div>
                              )}
                              {bathCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  <span>{bathCount}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Maximize className="w-4 h-4" />
                                <span className="text-xs">
                                  {property.StateOrProvince}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="w-6 h-6 animate-spin mr-2"
                    style={{ color: colors.primary }}
                  />
                  <span className="text-gray-600">
                    Loading more rental properties...
                  </span>
                </div>
              )}

              {/* End of Results */}
              {!hasNextPage && !isLoadingMore && properties.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {currentCity
                      ? `Showing all rental properties in ${currentCity}`
                      : isLoggedIn
                        ? "You have reached the end of the results"
                        : "Login to see more rental listings"}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && properties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                {currentCity
                  ? `No rental properties found in "${currentCity}"`
                  : "No rental properties available"}
              </div>
              <p className="text-gray-600 mb-4">
                {currentCity
                  ? "Try searching for a different city"
                  : "Check back later for new rental properties"}
              </p>
              {currentCity && (
                <button
                  onClick={clearSearch}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show All Rental Properties
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
