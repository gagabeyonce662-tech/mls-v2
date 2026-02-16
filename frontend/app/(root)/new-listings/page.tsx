"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import PropertyCard from "@/components/PropertyCard";
import {
  fetchNewlyListedProperties,
  mapPropertyFromAPI,
  type Property,
} from "@/lib/api";
import { colors } from "@/config/design-system";
import {
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 12;

export default function NewListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const response = await fetchNewlyListedProperties({
          limit: ITEMS_PER_PAGE,
          offset: offset,
        });

        const mapped = (response.results || []).map((p: any) =>
          mapPropertyFromAPI(p),
        );
        setProperties(mapped);
        setTotalCount(response.count || 0);
      } catch (error) {
        console.error("Error loading new listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
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

            <div className="bg-white px-4 py-2 rounded-lg border border-ds-card-border shadow-sm">
              <span className="text-ds-heading font-semibold">
                {totalCount}
              </span>
              <span className="text-ds-body ml-1">Properties Found</span>
            </div>
          </div>

          {/* Grid Layout */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-12 h-12 text-ds-primary animate-spin" />
              <p className="text-ds-body font-medium animate-pulse">
                Loading latest properties...
              </p>
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.PropertyKey || `new-${index}`}
                  property={property}
                  variant="new"
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <SlidersHorizontal className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-ds-heading">
                  No New Listings Found
                </h3>
                <p className="text-ds-body leading-relaxed">
                  We couldn't find any properties listed in the last few days.
                  Try broadening your search or check back again soon!
                </p>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                >
                  Return to Home
                </Button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-10 w-10 border-ds-card-border hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1 mx-4">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Basic pagination logic to show current window
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-10 w-10 font-bold ${
                        currentPage === pageNum
                          ? "shadow-md"
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
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-10 w-10 border-ds-card-border hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
