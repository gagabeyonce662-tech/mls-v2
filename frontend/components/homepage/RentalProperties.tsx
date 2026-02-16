"use client";

import Link from "next/link";
import { Bed, Bath, Loader2, ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { usePrefetchProperty } from "@/hooks/react-query";
import { useState, useEffect } from "react";

interface RentalPropertiesProps {
  searchQuery?: string;
  properties: any[]; // Add this
  isLoading: boolean; // Add this
}

export default function RentalProperties({
  searchQuery,
  properties, // Use props from homepage
  isLoading, // Use props from homepage
}: RentalPropertiesProps) {
  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadedCards, setLoadedCards] = useState<Set<string>>(new Set());

  // REMOVE: Internal data fetching with useAllLeaseProperties()
  // Get the prefetch function
  const prefetchProperty = usePrefetchProperty();

  // Gradually load cards with staggered animation
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      const timer = setTimeout(() => {
        const propertyKeys = properties
          .slice(0, 6)
          .map((property) => getPropertyKey(property));

        propertyKeys.forEach((propertyKey, index) => {
          setTimeout(
            () => {
              setLoadedCards((prev) => {
                const newSet = new Set(prev);
                newSet.add(propertyKey);
                return newSet;
              });
            },
            100 + index * 100,
          ); // Staggered delay
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [properties, isLoading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyKey = (property: any) => {
    return (
      property.listing_key ||
      property.PropertyKey ||
      `property-${property.city || property.City || "unknown"}-${
        property.ListPrice || property.list_price || "0"
      }`
    );
  };

  const getDisplayPrice = (property: any) => {
    const possible =
      property.list_price ??
      property.ListPrice ??
      property.ListPriceNumeric ??
      0;

    if (typeof possible === "string") {
      const parsed = parseFloat(possible.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof possible === "number") return possible;
    return 0;
  };

  const getDisplayCity = (property: any) => {
    return property.city || property.City || "Unknown City";
  };

  const getDisplayPropertyType = (property: any) => {
    return (
      property.category_type || property.PropertySubType || "Rental Property"
    );
  };

  const getBedCount = (property: any) => {
    return property.bedrooms_total ?? property.BedroomsTotal ?? 0;
  };

  const getBathCount = (property: any) => {
    return (
      property.bathrooms_total_integer ?? property.BathroomsTotalInteger ?? 0
    );
  };

  const getStatus = (property: any) => {
    return property.standard_status || property.StandardStatus || "For Rent";
  };

  const getPrice = (property: any) => {
    // Try to get lease amount first, then fall back to regular price
    const leaseAmount = property.lease_amount || property.LeaseAmount;
    if (leaseAmount) {
      return formatPrice(
        typeof leaseAmount === "string" ? parseFloat(leaseAmount) : leaseAmount,
      );
    }

    const displayPrice = getDisplayPrice(property);
    return displayPrice > 0 ? formatPrice(displayPrice) : "Price on request";
  };

  const getThumbnail = (property: any): string | null => {
    const candidateFields = [
      property.photos,
      property.Photos,
      property.media,
      property.Media,
      property.images,
      property.Images,
    ];

    for (const field of candidateFields) {
      if (!field) continue;

      if (Array.isArray(field) && field.length > 0) {
        const first = field[0];
        if (typeof first === "string" && first.trim() !== "") return first;
        if (typeof first === "object" && first !== null) {
          const possibleKeys = [
            "url",
            "media_url",
            "MediaURL",
            "MediaUrl",
            "src",
            "thumbnail",
            "thumbnailUrl",
            "ImageURL",
            "imageUrl",
          ];
          for (const k of possibleKeys) {
            if (first[k]) return first[k];
          }
        }
      }

      if (typeof field === "object" && !Array.isArray(field)) {
        const possibleKeys = [
          "url",
          "media_url",
          "MediaURL",
          "MediaUrl",
          "src",
          "thumbnail",
          "thumbnailUrl",
          "ImageURL",
          "imageUrl",
        ];
        for (const k of possibleKeys) {
          if (field[k]) return field[k];
        }
      }

      if (typeof field === "string" && field.trim() !== "") {
        return field;
      }
    }

    return null;
  };

  const handlePropertyClick = (propertyKey: string) => {
    setClickedProperty(propertyKey);
  };

  const handleImageLoad = (propertyKey: string) => {
    setLoadedImages((prev) => new Set(prev).add(propertyKey));
  };

  const isCardLoaded = (property: any) => {
    return loadedCards.has(getPropertyKey(property));
  };

  const isImageLoaded = (propertyKey: string) => {
    return loadedImages.has(propertyKey);
  };

  // Show loading skeletons if data is still loading
  const showLoadingSkeletons = isLoading; // REMOVED: || isFetching

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: colors.heading }}
            >
              {searchQuery ? `Rentals in ${searchQuery}` : "Best for Rental"}
            </h2>
            <p style={{ color: colors.body }}>
              {showLoadingSkeletons
                ? "Finding rental properties..."
                : `Find your perfect rental property (${properties.length} available)`}
            </p>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href="/listing/rental"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
                border: `1px solid ${colors.primary}`,
              }}
            >
              View All Rentals
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* REMOVED: Error State - since we're not handling errors internally anymore */}

        {/* Grid - Always show cards immediately */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show skeletons while loading or show actual properties */}
          {showLoadingSkeletons
            ? // Loading Skeletons for Rental Properties
              [...Array(6)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse min-h-[380px]"
                >
                  {/* Image skeleton */}
                  <div
                    className="h-56 w-full"
                    style={{ backgroundColor: colors.boarder }}
                  />

                  {/* Content skeleton */}
                  <div className="p-5 space-y-3">
                    <div
                      className="h-5 w-3/4 rounded"
                      style={{ backgroundColor: colors.boarder }}
                    />
                    <div
                      className="h-7 w-1/2 rounded"
                      style={{ backgroundColor: colors.boarder }}
                    />
                    <div className="flex gap-4 mt-4">
                      <div
                        className="h-4 w-16 rounded"
                        style={{ backgroundColor: colors.boarder }}
                      />
                      <div
                        className="h-4 w-16 rounded"
                        style={{ backgroundColor: colors.boarder }}
                      />
                      <div
                        className="h-4 w-12 rounded"
                        style={{ backgroundColor: colors.boarder }}
                      />
                    </div>
                  </div>
                </div>
              ))
            : properties.length > 0
              ? // Actual Rental Property Cards
                properties.slice(0, 6).map((property, index) => {
                  const propertyKey = getPropertyKey(property);
                  const displayCity = getDisplayCity(property);
                  const displayPropertyType = getDisplayPropertyType(property);
                  const bedCount = getBedCount(property);
                  const bathCount = getBathCount(property);
                  const status = getStatus(property);
                  const thumbnail = getThumbnail(property);
                  const price = getPrice(property);
                  const isClicked = clickedProperty === propertyKey;
                  const cardLoaded = isCardLoaded(property);
                  const imageLoaded = isImageLoaded(propertyKey);

                  return (
                    <div
                      key={propertyKey}
                      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all relative min-h-[380px] group ${
                        cardLoaded ? "opacity-100" : "opacity-70"
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animation: cardLoaded
                          ? "fadeInUp 0.3s ease-out forwards"
                          : "none",
                      }}
                    >
                      {/* Click Loading Overlay */}
                      {isClicked && (
                        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <Loader2
                              className="w-8 h-8 animate-spin"
                              style={{ color: colors.primary }}
                            />
                            <span
                              className="mt-2 text-sm"
                              style={{ color: colors.body }}
                            >
                              Loading rental details...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Card Container */}
                      <Link
                        href={`/listing/rental/${propertyKey}`}
                        onClick={() => handlePropertyClick(propertyKey)}
                        onMouseEnter={() => prefetchProperty(propertyKey)}
                        className={isClicked ? "pointer-events-none" : ""}
                      >
                        {/* Image Section */}
                        <div
                          className="relative h-56 overflow-hidden"
                          style={{ backgroundColor: colors.cardsBoarder }}
                        >
                          {/* Image Loading State */}
                          {thumbnail && !imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <div className="flex flex-col items-center">
                                <Loader2
                                  className="w-6 h-6 animate-spin"
                                  style={{ color: colors.primary }}
                                />
                                <span
                                  className="mt-2 text-xs"
                                  style={{ color: colors.body }}
                                >
                                  Loading image...
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Blurred background placeholder */}
                          {thumbnail && (
                            <div
                              className="absolute inset-0 blur-sm opacity-30"
                              style={{
                                backgroundImage: `url(${thumbnail})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                          )}

                          {/* Actual Image - Fades in when loaded */}
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={`Rental property in ${displayCity}`}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                                imageLoaded ? "opacity-100" : "opacity-0"
                              }`}
                              loading="lazy"
                              onLoad={() => handleImageLoad(propertyKey)}
                              onError={() => handleImageLoad(propertyKey)}
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${
                                cardLoaded ? "opacity-100" : "opacity-0"
                              }`}
                              style={{
                                backgroundColor: colors.boarder,
                                color: colors.body,
                              }}
                            >
                              <div className="text-sm font-medium">
                                No Image Available
                              </div>
                              <div className="text-xs mt-1">
                                Rental Property
                              </div>
                            </div>
                          )}

                          {/* Status Badge - Shows with fade-in */}
                          <div
                            className={`absolute bottom-4 left-4 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <span
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor:
                                  status === "Active"
                                    ? colors.primary
                                    : status === "Pending"
                                      ? "#facc15"
                                      : "#6b7280",
                                color: "#ffffff",
                              }}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5">
                          {/* Title */}
                          <h3
                            className={`font-semibold mb-2 truncate transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.heading }}
                          >
                            {displayPropertyType} in {displayCity}
                          </h3>

                          {/* Price - Shows "per month" for rentals */}
                          <p
                            className={`text-2xl font-bold mb-4 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.primary }}
                          >
                            {price}
                            {price.includes("$") && !price.includes("/") && (
                              <span
                                className="text-sm font-normal ml-1"
                                style={{ color: colors.body }}
                              >
                                /month
                              </span>
                            )}
                          </p>

                          {/* Features */}
                          <div
                            className={`flex items-center gap-4 text-sm transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.body }}
                          >
                            {bedCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span>
                                  {bedCount} Bed{bedCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}

                            {bathCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath className="w-4 h-4" />
                                <span>
                                  {bathCount} Bath{bathCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}

                            {/* Location badge */}
                            {(property.StateOrProvince || property.state) && (
                              <div
                                className="text-xs px-2 py-1 rounded"
                                style={{ backgroundColor: colors.boarder }}
                              >
                                {property.StateOrProvince || property.state}
                              </div>
                            )}
                          </div>

                          {/* Rental specific info */}
                          <div
                            className={`mt-3 text-xs transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.bodyLight }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Available:</span>
                              <span>Immediate</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })
              : // Empty State - Only show when not loading and no properties
                !showLoadingSkeletons && (
                  <div className="col-span-3 text-center py-16">
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

        {/* Mobile View All - Only show when we have properties */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center lg:hidden">
            <Link
              href="/listing/rental"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
                border: `1px solid ${colors.primary}`,
              }}
            >
              View All Rentals ({properties.length})
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Add CSS animation */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0.7;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
