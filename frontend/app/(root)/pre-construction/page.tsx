"use client";

import React, { useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { PropertyGridLayout } from "@/components/listing/PropertyGridLayout";
import { usePropertyInteractions } from "@/hooks/usePropertyInteractions";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { formatPrice } from "@/lib/propertyUtils";
import { fetchAllWPPreconPropertiesAction } from "@/lib/actions/wp-precon";
import { Property } from "@/lib/api/types";
import { Building2, SlidersHorizontal, HardHat, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors } from "@/config/design-system";
import { cn } from "@/lib/utils";

export default function PreConstructionPage() {
  const { user } = useUserAuth();
  const isLoggedIn = !!user;
  const interactions = usePropertyInteractions();

  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);
  const [initialLimit, setInitialLimit] = React.useState(8);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSticky, setIsSticky] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Use a negative top margin for the root to trigger when the sentinel 
    // reaches the bottom of the sticky header.
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { 
        threshold: [0],
        rootMargin: "-64px 0px 0px 0px" 
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Calculate 2 rows worth of items based on viewport
  React.useEffect(() => {
    const calculateInitialItems = () => {
      if (typeof window === "undefined") return 8;
      const width = window.innerWidth;

      // Sync with PropertyGridLayout breakpoints:
      // grid-cols-1 sm:2 md:3 lg:3 xl:4 2xl:6 3xl:8
      if (width >= 1800) return 16; // 3xl - 8 columns * 2 rows
      if (width >= 1536) return 12; // 2xl - 6 columns * 2 rows
      if (width >= 1280) return 8;  // xl - 4 columns * 2 rows
      if (width >= 1024) return 6;  // lg - 3 columns * 2 rows
      if (width >= 640) return 4;  // sm - 2 columns * 2 rows
      return 4;                     // mobile - 2 rows
    };

    setInitialLimit(calculateInitialItems());
    const handleResize = () => setInitialLimit(calculateInitialItems());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const fetchPrecons = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllWPPreconPropertiesAction();
        if (mounted) setProperties(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchPrecons();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter((p) => {
      const name = (p.project_name || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      const dev = ((p as any).developer || "").toLowerCase();
      return name.includes(q) || addr.includes(q) || dev.includes(q);
    });
  }, [properties, searchQuery]);

  const displayedProperties = useMemo(() => {
    return showAll ? filteredProperties : filteredProperties.slice(0, initialLimit);
  }, [filteredProperties, showAll, initialLimit]);

  const emptyMessage = (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-32 text-center shadow-inner">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ds-heading">
          No Pre-Construction Properties Found
        </h3>
        <p className="text-ds-body leading-relaxed">
          We couldn&apos;t find any pre-construction projects at this time.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <title>Pre-Construction Projects | Estate-4u</title>
      <meta
        name="description"
        content="Discover the latest pre-construction real estate projects across the GTA."
      />

      <Header />

      <main className="flex-1 pt-32 pb-16 px-4 lg:px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ds-primary">
              <HardHat className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold uppercase tracking-wider text-orange-600">
                New Developments
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-ds-heading font-inter">
              Pre-Construction Projects
            </h1>
            <p className="text-ds-body text-lg">
              Explore the latest builder developments, townhomes, and condos
              before they are built.
            </p>
          </div>
        </div>

        {/* Sentinel to detect when search bar becomes sticky */}
        <div ref={sentinelRef} className="h-0" />

        {/* Search / Filter Bar — sticky under navbar */}
        <div
          className="sticky z-40 -mx-4 lg:-mx-6 px-4 lg:px-6 py-2 transition-all duration-300 origin-top"
          style={{
            top: "var(--header-height, 56px)",
            backgroundColor: "rgb(249 250 251 / 0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className={cn(
              "w-full bg-white border transition-all duration-300 hover:shadow-lg",
              isSticky ? "rounded-b-2xl shadow-lg p-2.5 sm:p-3" : "rounded-2xl shadow-md p-4 sm:p-5"
            )}
            style={{ borderColor: "#E5E5E5" }}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 relative min-w-[200px]">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className={cn("text-gray-400 transition-all", isSticky ? "w-4 h-4" : "w-5 h-5")} />
                </div>
                <input
                  type="text"
                  placeholder="Search by project name, address, or developer..."
                  className={cn(
                    "w-full pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/20 focus:border-ds-primary focus:bg-white transition-all",
                    isSticky ? "py-2.5 text-sm" : "py-3.5 text-sm sm:text-base"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Count + Reset */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "bg-gray-50 px-4 rounded-xl border border-gray-200 flex items-center gap-2 transition-all",
                  isSticky ? "py-2" : "py-2.5"
                )}>
                  <span className={cn("text-ds-heading font-bold leading-none transition-all", isSticky ? "text-base" : "text-lg")}>
                    {filteredProperties.length}
                  </span>
                  <span className="text-ds-body text-xs font-medium opacity-60">
                    Projects
                  </span>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={cn(
                      "border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-800",
                      isSticky ? "p-2.5" : "p-3.5"
                    )}
                    title="Clear Search"
                  >
                    <RotateCcw className={cn("transition-all", isSticky ? "w-4 h-4" : "w-5 h-5")} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <PropertyGridLayout
          properties={displayedProperties as any}
          isLoading={isLoading}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={() => { }}
          isLoggedIn={isLoggedIn}
          interactions={interactions}
          emptyMessage={emptyMessage}
        />

        {!showAll && properties.length > initialLimit && !isLoading && (
          <div className="mt-16 flex justify-center">
            <Button
              onClick={() => setShowAll(true)}
              className="px-12 py-7 rounded-full text-lg font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all text-white bg-ds-primary"
            >
              View All {properties.length} Projects
            </Button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
