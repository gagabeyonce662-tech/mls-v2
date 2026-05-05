"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import PropertyFilter from "@/components/PropertyFilter";
import { PropertyFilterParams } from "@/lib/api";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { useInfiniteCommunityProperties } from "@/hooks/react-query";
import { mapPropertyFromAPI } from "@/lib/api";
import { Users, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";

export default function CommunityListingsPage() {
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const interactions = usePropertyInteractions();
  const [filterParams, setFilterParams] = React.useState<PropertyFilterParams>({});

  const handleApplyFilters = React.useCallback((newFilters: PropertyFilterParams) => {
    setFilterParams(newFilters);
  }, []);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteCommunityProperties({
    ...filterParams,
    limit: 12,
  });

  const allProperties =
    data?.pages.flatMap((page: any) =>
      (page.results || []).map((item: any) => mapPropertyFromAPI(item)),
    ) || [];

  const totalCount = data?.pages[0]?.count || 0;

  const emptyMessage = (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ds-heading">No Community Listings Found</h3>
        <p className="text-ds-body leading-relaxed">
          We could not find community listings for your current filters. Try broadening your
          search to see more options.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="default" onClick={() => (window.location.href = "/map-search")}>
            Explore Map Search
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>Community Listings | Estate-4u</title>
      <meta
        name="description"
        content="Browse curated community listings with flexible filters and infinite scroll."
      />

      <Header />

      <main className="flex-1 pt-32 pb-16">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ds-primary">
                <Users className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Curated Communities
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-ds-heading font-inter">
                Community Listings
              </h1>
              <p className="text-ds-body text-lg">
                Explore community-focused properties tailored for neighborhood discovery.
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

          <div className="mb-4">
            <PropertyFilter variant="horizontal" onApplyFilters={handleApplyFilters} />
          </div>

          {isError ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold text-ds-heading mb-4">
                Error loading community listings
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
