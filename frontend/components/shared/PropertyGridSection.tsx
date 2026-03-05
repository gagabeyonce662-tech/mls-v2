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
}: PropertyGridSectionProps) {
    const displayProperties = properties.slice(0, limit);
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
                            {title}
                        </h2>
                        <div className="text-sm" style={{ color: colors.body }}>
                            {subtitle || (
                                showLoadingSkeletons
                                    ? "Finding properties..."
                                    : `${totalCount !== undefined ? totalCount : properties.length} properties found`
                            )}
                        </div>
                    </div>

                    {!showLoadingSkeletons && properties.length > 0 && (
                        <Link
                            href={viewAllHref}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-6">
                    {showLoadingSkeletons
                        ? [...Array(limit)].map((_, i) => (
                            <PropertyCardSkeleton key={`skeleton-${i}`} index={i} />
                        ))
                        : displayProperties.length > 0
                            ? displayProperties.map((property, index) => (
                                <div
                                    key={property.listing_key || property.PropertyKey || `${title}-${index}`}
                                    className={`w-full ${index === 0 ? "block" :
                                        index === 1 ? "hidden sm:block" :
                                            index < 4 ? "hidden lg:block" :
                                                index === 4 ? "hidden xl:block" :
                                                    index === 5 ? "hidden 2xl:block" :
                                                        "hidden 3xl:block"
                                        }`}
                                >
                                    <PropertyCard
                                        property={property}
                                        variant={variant as any}
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
                                    <p style={{ color: colors.body }}>
                                        {emptySubtitle}
                                    </p>
                                </div>
                            )}
                </div>

                {/* Mobile View All */}
                {!showLoadingSkeletons && properties.length > 0 && (
                    <div className="mt-8 text-center sm:hidden">
                        <Link
                            href={viewAllHref}
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
