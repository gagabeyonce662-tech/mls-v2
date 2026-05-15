"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { colors } from "@/config/design-system";
import { Property } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

interface PropertyGridSectionProps {
  title: string;
  subtitle?: string | React.ReactNode;
  viewAllHref: string;
  viewAllLabel?: string;
  properties: Property[];
  isLoading: boolean;
  isError?: boolean;
  totalCount?: number;
  onQuickView?: (property: Property) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  variant?: "featured" | "simple" | "compact" | "new";
  limit?: number;
  /** Enforces that only one row of properties is displayed regardless of screen width */
  oneRowOnly?: boolean;
  onViewAllClick?: () => void;
  cardLayout?: "default" | "compact";
}

export function PropertyGridSection({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  properties,
  isLoading,
  isError,
  totalCount,
  onQuickView,
  emptyTitle = "No properties found",
  emptySubtitle = "Try adjusting your filters or search area.",
  variant = "featured",
  limit = 8,
  oneRowOnly = false,
  onViewAllClick,
  cardLayout = "compact",
}: PropertyGridSectionProps) {
  const displayProperties = properties.slice(0, limit);
  const showLoadingSkeletons = isLoading;

  // The "Ghost Section" Rule: If a homepage section has no properties, it vanishes silently.
  if (oneRowOnly && !showLoadingSkeletons && properties.length === 0) {
    return null;
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────────
   * DYNAMIC ONE-ROW DISPLACEMENT LOGIC (DO NOT REMOVE)
   * This logic ensures that no matter how many columns the screen density allows
   * (based on width or browser zoom), we calculate and show exactly one row.
   * We support up to 12-column density for high-resolution or zoomed-out views.
   * ──────────────────────────────────────────────────────────────────────────────
   */
  const getResponsiveVisibility = (index: number) => {
    if (!oneRowOnly) return "block";

    // Synced exactly with useOneRowListing.ts & tailwind.config.ts breakpoints:
    if (index < 2) return "block";             // mobile + sm → 2 cols
    if (index === 2) return "hidden md:block"; // 768px+  → 3 cols
    if (index === 3) return "hidden lg:block"; // 1024px+ → 4 cols
    if (index < 6) return "hidden 2xl:block"; // 1536px+ → 6 cols
    if (index < 8) return "hidden 3xl:block"; // 1800px+ → 8 cols
    return "hidden 4xl:block";                  // 2200px+ → 12 cols
  };


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
              {title}
            </h2>
            <div className="text-sm" style={{ color: colors.body }}>
              {subtitle ||
                (showLoadingSkeletons
                  ? "Finding properties..."
                  : `${totalCount !== undefined ? totalCount : properties.length} properties found`)}
            </div>
          </div>

          {!showLoadingSkeletons && properties.length > 0 && (
            <Link
              href={viewAllHref}
              onClick={onViewAllClick}
              className="hidden sm:inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              {viewAllLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Error State */}
        {isError && !isLoading && (
          <div className="text-center py-16">
            <div
              className="text-xl font-semibold mb-2"
              style={{ color: colors.heading }}
            >
              Error loading properties
            </div>
            <p style={{ color: colors.body }}>
              Please try again later or contact support.
            </p>
          </div>
        )}

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-12 gap-4 sm:gap-6">
          {showLoadingSkeletons
            ? [...Array(limit)].map((_, i) => (
              <PropertyCardSkeleton key={`skeleton-${i}`} index={i} />
            ))
            : displayProperties.length > 0
              ? displayProperties.map((property, index) => (
                <div
                  key={
                    property.listing_key ||
                    property.PropertyKey ||
                    `${title}-${index}`
                  }
                  className={`w-full ${getResponsiveVisibility(index)}`}
                >
                  <PropertyCard
                    property={property}
                    variant={variant as any}
                    layoutMode={cardLayout}
                    index={index}
                    onQuickView={onQuickView}
                  />
                </div>
              ))
              : !showLoadingSkeletons && (
                <div className="col-span-full text-center py-16">
                  <div
                    className="text-xl font-semibold mb-2"
                    style={{ color: colors.heading }}
                  >
                    {emptyTitle}
                  </div>
                  <p style={{ color: colors.body }}>{emptySubtitle}</p>
                </div>
              )}
        </div>

        {/* Mobile View All */}
        {!showLoadingSkeletons && properties.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href={viewAllHref}
              onClick={onViewAllClick}
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium shadow-lg transition-all"
              style={{
                backgroundColor: colors.primary,
                color: colors.cards,
              }}
            >
              {viewAllLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
