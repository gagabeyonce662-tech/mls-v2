// app/components/homepage/PreConstructionProperties.tsx
"use client";

import Link from "next/link";
import {
  Bed,
  Bath,
  Loader2,
  ChevronRight,
  Building,
  Calendar,
  Home,
} from "lucide-react";
import { colors } from "@/config/design-system";
import { usePrefetchProperty } from "@/hooks/react-query";
import { useState, useEffect } from "react";

interface PreConstructionPropertiesProps {
  searchQuery?: string;
  properties: any[];
  isLoading: boolean;
}

export default function PreConstructionProperties({
  searchQuery,
  properties, // Use the props passed from homepage
  isLoading, // Use the props passed from homepage
}: PreConstructionPropertiesProps) {
  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadedCards, setLoadedCards] = useState<Set<string>>(new Set());

  // Get the prefetch function
  const prefetchProperty = usePrefetchProperty();

  // REMOVED: const { data: properties = [], isLoading, isError, isFetching } = useAllPreConnProperties();

  // Gradually load cards with staggered animation
  useEffect(() => {
    if (!isLoading && properties.length > 0) {
      // Load cards gradually
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
            150 + index * 150,
          ); // Staggered delay
        });
      }, 200); // Small delay before starting

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
      `precon-${property.city || property.City || "unknown"}-${
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
      property.category_type || property.PropertySubType || "Pre-Construction"
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
    return (
      property.standard_status || property.StandardStatus || "Pre-Construction"
    );
  };

  const getCompletionYear = (property: any) => {
    // Try to get completion year from various fields
    const yearBuilt = property.year_built || property.YearBuilt;
    const publicRemarks =
      property.public_remarks || property.PublicRemarks || "";

    if (yearBuilt) return `Completion: ${yearBuilt}`;

    // Try to extract year from remarks
    const yearMatch = publicRemarks.match(/20[2-9][0-9]/);
    if (yearMatch) return `Completion: ${yearMatch[0]}`;

    return "Coming Soon";
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
          const keys = [
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
          for (const k of keys) {
            if (first[k]) return first[k];
          }
        }
      }

      if (typeof field === "object" && !Array.isArray(field)) {
        const keys = [
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
        for (const k of keys) {
          if (field[k]) return field[k];
        }
      }

      if (typeof field === "string" && field.trim() !== "") return field;
    }

    return null;
  };

  const getProjectName = (property: any) => {
    const address = property.unparsed_address || "";
    const remarks = property.public_remarks || "";

    // Try to extract project name from remarks or address
    if (remarks.includes("Project:") || remarks.includes("project:")) {
      const projectMatch = remarks.match(
        /(?:[Pp]roject:|[Dd]evelopment:)\s*([^.\n]+)/,
      );
      if (projectMatch) return projectMatch[1].trim();
    }

    // Use first part of address if available
    if (address) {
      const parts = address.split(",");
      return parts[0] || "New Development";
    }

    return "New Development Project";
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
        {/* Header */}
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
                ? "Finding upcoming projects..."
                : `Discover ${properties.length} pre-construction opportunities`}
            </p>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href="/pre-construction"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
                border: `1px solid ${colors.primary}`,
              }}
            >
              View All Projects
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Error State - REMOVED since we're not handling errors internally anymore */}

        {/* Grid - Always show cards immediately */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show skeletons while loading or show actual properties */}
          {showLoadingSkeletons
            ? // Loading Skeletons for Pre-Construction
              [...Array(6)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse min-h-[420px]"
                >
                  {/* Ribbon skeleton */}
                  <div
                    className="h-8 w-32 mb-4"
                    style={{ backgroundColor: colors.boarder }}
                  />

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
                      className="h-4 w-1/2 rounded"
                      style={{ backgroundColor: colors.boarder }}
                    />
                    <div
                      className="h-7 w-2/3 rounded"
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
                    </div>
                    <div
                      className="h-8 w-full rounded mt-4"
                      style={{ backgroundColor: colors.boarder }}
                    />
                  </div>
                </div>
              ))
            : properties.length > 0
              ? // Actual Pre-Construction Property Cards
                properties.slice(0, 6).map((property, index) => {
                  const propertyKey = getPropertyKey(property);
                  const displayPrice = getDisplayPrice(property);
                  const displayCity = getDisplayCity(property);
                  const displayPropertyType = getDisplayPropertyType(property);
                  const bedCount = getBedCount(property);
                  const bathCount = getBathCount(property);
                  const status = getStatus(property);
                  const thumbnail = getThumbnail(property);
                  const completionYear = getCompletionYear(property);
                  const projectName = getProjectName(property);
                  const isClicked = clickedProperty === propertyKey;
                  const cardLoaded = isCardLoaded(property);
                  const imageLoaded = isImageLoaded(propertyKey);

                  return (
                    <div
                      key={propertyKey}
                      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all relative min-h-[420px] group ${
                        cardLoaded ? "opacity-100" : "opacity-70"
                      }`}
                      style={{
                        animationDelay: `${index * 0.15}s`,
                        animation: cardLoaded
                          ? "fadeInUp 0.4s ease-out forwards"
                          : "none",
                      }}
                    >
                      {/* Click Loading Overlay */}
                      {isClicked && (
                        <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <Loader2
                              className="w-8 h-8 animate-spin"
                              style={{ color: colors.primary }}
                            />
                            <span
                              className="mt-2 text-sm"
                              style={{ color: colors.body }}
                            >
                              Loading project details...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Pre-Construction Ribbon */}
                      <div
                        className={`absolute top-4 left-0 z-20 transition-opacity duration-500 ${
                          cardLoaded ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div
                          className="px-3 py-1 text-sm font-medium shadow-md"
                          style={{
                            backgroundColor: "#8B5CF6",
                            color: "#FFFFFF",
                            borderTopRightRadius: "4px",
                            borderBottomRightRadius: "4px",
                          }}
                        >
                          <Building className="w-4 h-4 inline-block mr-1" />
                          Pre-Construction
                        </div>
                      </div>

                      {/* Card Container */}
                      <Link
                        href={`/pre-construction/${propertyKey}`}
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
                                <Building
                                  className="w-8 h-8 animate-spin"
                                  style={{ color: colors.primary }}
                                />
                                <span
                                  className="mt-2 text-xs"
                                  style={{ color: colors.body }}
                                >
                                  Loading rendering...
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
                              alt={`${projectName} in ${displayCity}`}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${
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
                              <Building className="w-12 h-12 mb-2 opacity-50" />
                              <div className="text-sm font-medium">
                                Rendering Coming Soon
                              </div>
                              <div className="text-xs mt-1">{projectName}</div>
                            </div>
                          )}

                          {/* Completion year badge - Fades in when card loads */}
                          <div
                            className={`absolute bottom-4 right-4 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <span
                              className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md"
                              style={{
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                                color: "#FFFFFF",
                              }}
                            >
                              <Calendar className="w-3 h-3" />
                              {completionYear}
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5">
                          {/* Project Name */}
                          <h3
                            className={`font-semibold mb-2 truncate transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.heading }}
                          >
                            {projectName}
                          </h3>

                          {/* Location & Type */}
                          <div
                            className={`text-sm mb-2 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.primary }}
                          >
                            <span className="font-medium">{displayCity}</span>
                            <span className="mx-2">•</span>
                            <span>{displayPropertyType}</span>
                          </div>

                          {/* Price - From price */}
                          <p
                            className={`text-2xl font-bold mb-4 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            style={{ color: colors.primary }}
                          >
                            From {formatPrice(displayPrice)}
                          </p>

                          {/* Features */}
                          <div
                            className={`flex flex-col gap-3 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <div
                              className="flex items-center gap-4 text-sm"
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
                            </div>

                            {/* Additional info */}
                            <div
                              className="flex items-center gap-2 text-xs"
                              style={{ color: colors.bodyLight }}
                            >
                              <Home className="w-3 h-3" />
                              <span>Floor Plans Available</span>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div
                            className={`mt-4 transition-opacity duration-500 ${
                              cardLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <div
                              className="w-full py-2 text-sm font-medium rounded-md transition-all text-center group-hover:scale-[1.02]"
                              style={{
                                backgroundColor: colors.primary,
                                color: colors.cards,
                              }}
                            >
                              View Floor Plans
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
                      No pre-construction properties found
                    </div>
                    <p style={{ color: colors.body }}>
                      Check back soon for new development opportunities.
                    </p>
                  </div>
                )}
        </div>

        {/* Mobile View All - Only show when we have properties */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center lg:hidden">
            <Link
              href="/pre-construction"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
                border: `1px solid ${colors.primary}`,
              }}
            >
              View All Pre-Construction Projects
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
            transform: translateY(10px);
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
