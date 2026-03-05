"use client";

import React, { useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import PropertyCard from "@/components/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property-card/PropertyCardSkeleton";
import { useInfiniteNewlyListedProperties } from "@/hooks/react-query";
import { mapPropertyFromAPI } from "@/lib/api";
import { Property } from "@/lib/api/types";
import { Calendar, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";

export default function NewListingsPage() {
  const [showQuickView, setShowQuickView] = React.useState(false);
  const [selectedProperty, setSelectedProperty] = React.useState<any>(null);

  const handleQuickView = (property: any) => {
    setSelectedProperty(property);
    setShowQuickView(true);
  };
  // Use TanStack Query for infinite scroll
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteNewlyListedProperties({
    limit: 12,
  });

  // Extract all properties from pages and map them
  const allProperties =
    data?.pages.flatMap((page) =>
      (page.results || []).map((p: any) => mapPropertyFromAPI(p)),
    ) || [];

  const totalCount = data?.pages[0]?.count || 0;

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPropertyRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>Newly Listed Properties | Estate-4u</title>
      <meta
        name="description"
        content="Discover the latest real estate inventory updated in the last 24-48 hours."
      />

      <Header />

      <main className="flex-1 pt-24 pb-16">
        <Container>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ds-primary">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Fresh on Market
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-ds-heading font-inter">
                Newly Listed Properties
              </h1>
              <p className="text-ds-body text-lg">
                Discover the latest inventory updated in the last 24-48 hours.
              </p>
            </div>

            <div className="bg-white px-4 py-2 rounded-lg border border-ds-card-border shadow-sm flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-ds-heading font-bold text-xl leading-none">
                  {isLoading ? "..." : totalCount}
                </span>
                <span className="text-ds-body text-xs font-medium uppercase tracking-tight">
                  Properties
                </span>
              </div>
              {isFetchingNextPage && (
                <div className="w-2 h-2 bg-ds-primary rounded-full animate-ping" />
              )}
            </div>
          </div>

          {/* Grid Layout */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : allProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProperties.map((property: Property, index: number) => (
                  <div
                    key={
                      property.listing_key ||
                      property.PropertyKey ||
                      `new-${index}`
                    }
                    ref={
                      index === allProperties.length - 1
                        ? lastPropertyRef
                        : null
                    }
                  >
                    <PropertyCard
                      property={property}
                      variant="new"
                      index={index % 12} // Use mod for stagger delay
                      onQuickView={handleQuickView}
                    />
                  </div>
                ))}
              </div>

              {/* Loading More State */}
              {isFetchingNextPage && (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <PropertyCardSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )}

              {/* End of results */}
              {!hasNextPage && allProperties.length > 0 && (
                <div className="mt-16 text-center text-ds-body py-8 border-t border-ds-card-border">
                  <p className="font-medium italic">
                    You&apos;ve reached the end of the new listings catalogue.
                  </p>
                </div>
              )}
            </>
          ) : isError ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold text-ds-heading mb-4">
                Error loading properties
              </h3>
              <Button onClick={() => refetch()}>Retry Connection</Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading">
                  No New Listings Found
                </h3>
                <p className="text-ds-body leading-relaxed">
                  We couldn&apos;t find any properties listed in the last few
                  days. Try broadening your search or explore all our available
                  listings.
                </p>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="default"
                    onClick={() => (window.location.href = "/map-search")}
                  >
                    Explore Map Search
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />

      <PropertyQuickViewModal
        show={showQuickView}
        property={selectedProperty}
        onClose={() => setShowQuickView(false)}
      />
    </div>
  );
}
