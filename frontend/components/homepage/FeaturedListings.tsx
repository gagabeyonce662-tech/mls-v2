"use client";

import Link from "next/link";
import { Bed, Bath, Loader2, ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface FeaturedListingsProps {
  properties: Property[];
  isLoading: boolean;
  searchQuery: string;
}

export default function FeaturedListings({
  properties,
  isLoading,
  searchQuery,
}: FeaturedListingsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyKey = (property: Property) => {
    return (
      (property as any).listing_key ||
      (property as any).PropertyKey ||
      `property-${(property as any).city || (property as any).City || "unknown"}-${
        (property as any).ListPrice || (property as any).list_price || "0"
      }`
    );
  };

  const getDisplayPrice = (property: Property) => {
    const possible =
      (property as any).list_price ??
      (property as any).ListPrice ??
      (property as any).ListPriceNumeric ??
      0;

    if (typeof possible === "string") {
      const parsed = parseFloat(possible.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof possible === "number") return possible;
    return 0;
  };

  const getDisplayCity = (property: Property) => {
    return (property as any).city || (property as any).City || "Unknown City";
  };

  const getDisplayPropertyType = (property: Property) => {
    return (
      (property as any).category_type ||
      (property as any).PropertySubType ||
      "Property"
    );
  };

  const getBedCount = (property: Property) => {
    return (property as any).bedrooms_total ?? (property as any).BedroomsTotal ?? 0;
  };

  const getBathCount = (property: Property) => {
    return (
      (property as any).bathrooms_total_integer ??
      (property as any).BathroomsTotalInteger ??
      0
    );
  };

  const getStatus = (property: Property) => {
    return (
      (property as any).standard_status ||
      (property as any).StandardStatus ||
      "For Sale"
    );
  };

  const getThumbnail = (property: Property): string | null => {
    const candidateFields = [
      (property as any).photos,
      (property as any).Photos,
      (property as any).media,
      (property as any).Media,
      (property as any).images,
      (property as any).Images,
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
            if ((first as any)[k]) return (first as any)[k];
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
          if ((field as any)[k]) return (field as any)[k];
        }
      }

      if (typeof field === "string" && field.trim() !== "") return field;
    }

    return null;
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.heading }}>
              {searchQuery
                ? `Properties in ${searchQuery}`
                : "Featured Properties"}
            </h2>
            <p style={{ color: colors.body }}>
              {isLoading
                ? "Finding properties..."
                : `${properties.length} properties found`}
            </p>
          </div>

          {!isLoading && properties.length > 0 && (
            <Link
              href="/listing"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
                border: `1px solid ${colors.primary}`,
              }}
            >
              View All Properties
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <span className="ml-3" style={{ color: colors.body }}>
              Loading properties...
            </span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && properties.length === 0 && (
          <div className="text-center py-16">
            <div className="text-xl font-semibold mb-2" style={{ color: colors.heading }}>
              No properties found
            </div>
            <p style={{ color: colors.body }}>
              Try searching for a different city or check your spelling.
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property) => {
                const propertyKey = getPropertyKey(property);
                const displayPrice = getDisplayPrice(property);
                const displayCity = getDisplayCity(property);
                const displayPropertyType = getDisplayPropertyType(property);
                const bedCount = getBedCount(property);
                const bathCount = getBathCount(property);
                const status = getStatus(property);
                const thumbnail = getThumbnail(property);

                return (
                  <Link
                    key={propertyKey}
                    href={`/listing/${propertyKey}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div
                      className="relative h-56"
                      style={{ backgroundColor: colors.cardsBoarder }}
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={`Property in ${displayCity}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center px-4"
                          style={{
                            backgroundColor: colors.boarder,
                            color: colors.body,
                          }}
                        >
                          <div className="text-sm font-medium">No Image Available</div>
                          <div className="text-xs mt-1">—</div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4">
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

                    <div className="p-5">
                      <h3
                        className="font-semibold mb-2 truncate"
                        style={{ color: colors.heading }}
                      >
                        {displayPropertyType} in {displayCity}
                      </h3>

                      <p
                        className="text-xl font-bold mb-4"
                        style={{ color: colors.primary }}
                      >
                        {formatPrice(displayPrice)}
                      </p>

                      <div
                        className="flex items-center gap-4 text-sm"
                        style={{ color: colors.body }}
                      >
                        {bedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{bedCount} Beds</span>
                          </div>
                        )}

                        {bathCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{bathCount} Baths</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile View All */}
            <div className="mt-8 text-center lg:hidden">
              <Link
                href="/listing"
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium shadow-lg transition-all"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.cards,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                View All Properties
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
