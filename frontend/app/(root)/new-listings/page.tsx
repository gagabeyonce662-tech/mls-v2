"use client";

import React, { useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { PropertyCard } from "@/components/listing/PropertyCard";
import PropertyFilter from "@/components/PropertyFilter";
import { PropertyFilterParams } from "@/lib/api";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useInfiniteNewlyListedProperties } from "@/hooks/react-query";
import { mapPropertyFromAPI } from "@/lib/api";
import { Property } from "@/lib/api/types";
import { Calendar, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { formatPrice } from "@/lib/propertyUtils";

export default function NewListingsPage() {
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const interactions = usePropertyInteractions();

  const [filterParams, setFilterParams] = React.useState<PropertyFilterParams>(
    {},
  );

  const handleApplyFilters = React.useCallback((newFilters: any) => {
    setFilterParams(newFilters);
  }, []);

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
    ...filterParams,
    limit: 12,
  });

  // Extract all properties from pages and map them
  const allProperties =
    data?.pages.flatMap((page: any) =>
      (page.results || []).map((p: any) => mapPropertyFromAPI(p)),
    ) || [];

  const totalCount = data?.pages[0]?.count || 0;

  const emptyMessage = (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ds-heading">
          No New Listings Found
        </h3>
        <p className="text-ds-body leading-relaxed">
          We couldn&apos;t find any properties listed in the last few days. Try
          broadening your search or explore all our available listings.
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
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>Newly Listed Properties | Estate-4u</title>
      <meta
        name="description"
        content="Discover the latest real estate inventory updated in the last 24-48 hours."
      />

      <Header />

      <main className="flex-1 pt-32 pb-16">
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

          {/* Filter Bar */}
          <div className="mb-4">
            <PropertyFilter
              variant="horizontal"
              onApplyFilters={handleApplyFilters}
            />
          </div>

          {isError ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold text-ds-heading mb-4">
                Error loading properties
              </h3>
              <Button onClick={() => refetch()}>Retry Connection</Button>
            </div>
          ) : (
            <PropertyGridLayout
              properties={allProperties}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoggedIn={isLoggedIn}
              interactions={interactions}
              emptyMessage={emptyMessage}
            />
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
