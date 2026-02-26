"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import PropertyCard from "@/components/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property-card/PropertyCardSkeleton";
import { fetchNewlyListedProperties, mapPropertyFromAPI } from "@/lib/api";
import { Property } from "@/lib/api/types";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 12;

export default function NewListingsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  // Use React Query for better performance and caching
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["new-listings", currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const response = await fetchNewlyListedProperties({
        limit: ITEMS_PER_PAGE,
        offset: offset,
      });

      const results = (response.results || []).map((p: any) =>
        mapPropertyFromAPI(p),
      );

      return {
        results,
        count: response.count || 0,
      };
    },
    placeholderData: keepPreviousData, // Keep showing old data while fetching new page
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const properties = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Dynamic SEO context would normally be in a separate layout or head component */}
      <title>Newly Listed Properties | EstateforYou</title>
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
              {isFetching && !isLoading && (
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
          ) : properties.length > 0 ? (
            <>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${isFetching ? "opacity-50" : "opacity-100"}`}
              >
                {properties.map((property: Property, index: number) => (
                  <PropertyCard
                    key={
                      property.listing_key ||
                      property.PropertyKey ||
                      `new-${index}`
                    }
                    property={property}
                    variant="new"
                    index={index}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === 1 || isFetching}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-10 w-10 border-ds-card-border hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <div className="flex items-center gap-1 mx-4">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum = currentPage;
                      if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "ghost"
                          }
                          size="sm"
                          disabled={isFetching}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-10 w-10 font-bold transition-all ${
                            currentPage === pageNum
                              ? "shadow-md scale-110"
                              : "text-ds-body hover:text-ds-primary hover:bg-ds-card"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === totalPages || isFetching}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="h-10 w-10 border-ds-card-border hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
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
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                  >
                    Go Back Home
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
