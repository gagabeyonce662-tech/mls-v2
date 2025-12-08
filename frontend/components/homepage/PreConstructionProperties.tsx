"use client";

import Link from "next/link";
import { Bed, Bath, Loader2, ChevronRight, Building, Calendar, Home } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface PreConstructionPropertiesProps {
  properties: Property[];
  isLoading: boolean;
}

export default function PreConstructionProperties({
  properties,
  isLoading,
}: PreConstructionPropertiesProps) {
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
      `precon-${(property as any).city || (property as any).City || "unknown"}-${
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
      "Pre-Construction"
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
      "Pre-Construction"
    );
  };

  const getCompletionYear = (property: Property) => {
    // Try to get completion year from various fields
    const yearBuilt = (property as any).year_built || (property as any).YearBuilt;
    const publicRemarks = (property as any).public_remarks || (property as any).PublicRemarks || "";
    
    if (yearBuilt) return `Completion: ${yearBuilt}`;
    
    // Try to extract year from remarks
    const yearMatch = publicRemarks.match(/20[2-9][0-9]/);
    if (yearMatch) return `Completion: ${yearMatch[0]}`;
    
    return "Coming Soon";
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

  const getProjectName = (property: Property) => {
    const address = (property as any).unparsed_address || "";
    const remarks = (property as any).public_remarks || "";
    
    // Try to extract project name from remarks or address
    if (remarks.includes("Project:") || remarks.includes("project:")) {
      const projectMatch = remarks.match(/(?:[Pp]roject:|[Dd]evelopment:)\s*([^.\n]+)/);
      if (projectMatch) return projectMatch[1].trim();
    }
    
    // Use first part of address if available
    if (address) {
      const parts = address.split(',');
      return parts[0] || "New Development";
    }
    
    return "New Development Project";
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.heading }}>
              Pre-Construction Properties
            </h2>
            <p style={{ color: colors.body }}>
              {isLoading
                ? "Finding upcoming projects..."
                : `Discover ${properties.length} pre-construction opportunities`}
            </p>
          </div>

          {!isLoading && properties.length > 0 && (
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

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <span className="ml-3" style={{ color: colors.body }}>
              Loading pre-construction properties...
            </span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && properties.length === 0 && (
          <div className="text-center py-16">
            <div className="text-xl font-semibold mb-2" style={{ color: colors.heading }}>
              No pre-construction properties found
            </div>
            <p style={{ color: colors.body }}>
              Check back soon for new development opportunities.
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
                const completionYear = getCompletionYear(property);
                const projectName = getProjectName(property);

                return (
                  <Link
                    key={propertyKey}
                    href={`/pre-construction/${propertyKey}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    <div className="relative">
                      {/* Ribbon for Pre-Construction */}
                      <div className="absolute top-4 left-0 z-10">
                        <div 
                          className="px-3 py-1 text-sm font-medium shadow-md"
                          style={{
                            backgroundColor: "#8B5CF6",
                            color: "#FFFFFF",
                            borderTopRightRadius: "4px",
                            borderBottomRightRadius: "4px"
                          }}
                        >
                          <Building className="w-4 h-4 inline-block mr-1" />
                          Pre-Construction
                        </div>
                      </div>

                      <div
                        className="relative h-56"
                        style={{ backgroundColor: colors.cardsBoarder }}
                      >
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={`${projectName} in ${displayCity}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center px-4"
                            style={{
                              backgroundColor: colors.boarder,
                              color: colors.body,
                            }}
                          >
                            <Building className="w-12 h-12 mb-2 opacity-50" />
                            <div className="text-sm font-medium">Rendering Coming Soon</div>
                            <div className="text-xs mt-1">{projectName}</div>
                          </div>
                        )}

                        {/* Completion year badge */}
                        <div className="absolute bottom-4 right-4">
                          <span
                            className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
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

                      <div className="p-5">
                        <h3
                          className="font-semibold mb-2 truncate"
                          style={{ color: colors.heading }}
                        >
                          {projectName}
                        </h3>
                        
                        <div className="text-sm mb-2" style={{ color: colors.primary }}>
                          <span className="font-medium">{displayCity}</span>
                          <span className="mx-2">•</span>
                          <span>{displayPropertyType}</span>
                        </div>

                        <p
                          className="text-xl font-bold mb-4"
                          style={{ color: colors.primary }}
                        >
                          From {formatPrice(displayPrice)}
                        </p>

                        <div className="flex flex-col gap-3">
                          <div
                            className="flex items-center gap-4 text-sm"
                            style={{ color: colors.body }}
                          >
                            {bedCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span>{bedCount} Bed{bedCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}

                            {bathCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath className="w-4 h-4" />
                                <span>{bathCount} Bath{bathCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Additional info */}
                          <div className="flex items-center gap-2 text-xs" style={{ color: colors.bodyLight }}>
                            <Home className="w-3 h-3" />
                            <span>Floor Plans Available</span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          className="w-full mt-4 py-2 text-sm font-medium rounded-md transition-all"
                          style={{
                            backgroundColor: colors.primary,
                            color: colors.cards,
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle pre-construction inquiry
                            window.location.href = `/pre-construction/${propertyKey}`;
                          }}
                        >
                          View Floor Plans
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile View All */}
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
          </>
        )}
      </div>
    </div>
  );
}