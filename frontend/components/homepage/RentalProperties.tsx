"use client";

import Link from "next/link";
import { Heart, Bed, Bath, Loader2, ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface RentalPropertiesProps {
  properties: Property[];
  isLoading: boolean;
}

export default function RentalProperties({ properties, isLoading }: RentalPropertiesProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Helper to produce a stable property key for links
  const getPropertyKey = (property: Property) => {
    const key = (property as any).listing_key || (property as any).PropertyKey || `property-${(property as any).city || (property as any).City || "unknown"}-${(property as any).ListPrice || (property as any).list_price || "0"}`;
    return key;
  };

  // Helper to get numeric display price
  const getDisplayPrice = (property: Property) => {
    const possible = (property as any).list_price ?? (property as any).ListPrice ?? (property as any).ListPriceNumeric ?? 0;
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
    return (property as any).category_type || (property as any).PropertySubType || "Rental Property";
  };

  const getBedCount = (property: Property) => {
    return (property as any).bedrooms_total ?? (property as any).BedroomsTotal ?? 0;
  };

  const getBathCount = (property: Property) => {
    return (property as any).bathrooms_total_integer ?? (property as any).BathroomsTotalInteger ?? 0;
  };

  const getStatus = (property: Property) => {
    return (property as any).standard_status || (property as any).StandardStatus || "For Rent";
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
          const possibleKeys = ["url", "media_url", "MediaURL", "MediaUrl", "src", "thumbnail", "thumbnailUrl", "ImageURL", "imageUrl"];
          for (const k of possibleKeys) {
            if (first[k]) return first[k];
          }
        }
      }

      if (typeof field === "object" && !Array.isArray(field)) {
        const possibleKeys = ["url", "media_url", "MediaURL", "MediaUrl", "src", "thumbnail", "thumbnailUrl", "ImageURL", "imageUrl"];
        for (const k of possibleKeys) {
          if ((field as any)[k]) return (field as any)[k];
        }
      }

      if (typeof field === "string" && field.trim() !== "") {
        return field;
      }
    }

    return null;
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with View All button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Best for Rental
            </h2>
            <p className="text-gray-600">Find your perfect rental property</p>
          </div>

          {/* View All button - only show when there are properties */}
          {!isLoading && properties.length > 0 && (
            <Link 
              href="/listing/rental" 
              className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All Rentals
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <span className="ml-3 text-gray-600">Loading rental properties...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && (
          <div className="text-center py-16">
            <div className="text-xl font-semibold text-gray-900 mb-2">No rental properties found</div>
            <p className="text-gray-600">Check back soon for new rental listings.</p>
          </div>
        )}

        {/* Properties Grid */}
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
                    href={`/listing/rental/${propertyKey}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-56 bg-gray-100">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={`Rental property in ${displayCity}`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex flex-col items-center justify-center text-gray-600 px-4">
                          <div className="text-sm font-medium">No Image Available</div>
                          <div className="text-xs mt-1">Rental Property</div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Toggle favorite for rental:", propertyKey);
                          // TODO: toggle favorite state
                        }}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart className="w-5 h-5 text-gray-700" />
                      </button>

                      <div className="absolute bottom-4 left-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === "Active" ? "bg-purple-500 text-white" : status === "Pending" ? "bg-yellow-500 text-white" : "bg-gray-500 text-white"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">
                        {displayPropertyType} in {displayCity}
                      </h3>
                      <p className="text-xl font-bold text-purple-600 mb-4">{formatPrice(displayPrice)}/month</p>

                      <div className="flex items-center gap-4 text-gray-600 text-sm">
                        {bedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>
                              {bedCount} {bedCount === 1 ? "Bed" : "Beds"}
                            </span>
                          </div>
                        )}
                        {bathCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>
                              {bathCount} {bathCount === 1 ? "Bath" : "Baths"}
                            </span>
                          </div>
                        )}
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {(property as any).StateOrProvince ?? (property as any).state ?? ""}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* View All button at bottom (mobile friendly) */}
            <div className="mt-8 text-center lg:hidden">
              <Link 
                href="/listing/rental" 
                className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All Rentals ({properties.length})
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}