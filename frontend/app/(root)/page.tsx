"use client";

import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { colors } from "@/config/design-system";

import { QuickViewProvider } from "@/contexts/QuickViewContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import HeroSection from "@/components/homepage/HeroSection";
import FeaturedCollections from "@/components/homepage/FeaturedCollections";
import PropertyFilter from "@/components/PropertyFilter";
import MobileFilterDrawer from "@/components/homepage/MobileFilterDrawer";

import { DynamicHomepageSections } from "@/components/homepage/sections/DynamicHomepageSections";
import LeadCaptureWidget from "@/components/homepage/LeadCaptureWidget";
import { useHomepageCategories } from "@/hooks/useHomepageCategories";
import { trackHomepageCategoryEvent } from "@/lib/analytics/homepageCategories";
import {
  HOMEPAGE_ROW_COUNT_EVENT,
  HOMEPAGE_ROW_COUNT_PREF_KEY,
  parseHomepageRowCountPreference,
} from "@/lib/homepage/rowPreference";

import dynamic from "next/dynamic";

const LocationsSection = dynamic(
  () => import("@/components/homepage/LocationsSection"),
);
const LatestArticles = dynamic(
  () => import("@/components/homepage/LatestArticles"),
);
const MortgageSection = dynamic(
  () => import("@/components/homepage/MortgageSection"),
);
const ClientReviews = dynamic(
  () => import("@/components/homepage/ClientReviews"),
);
const ConnectionsSection = dynamic(
  () => import("@/components/homepage/ConnectionsSection"),
);

export default function HomePage() {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [rowCountPreference, setRowCountPreference] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isDynamicCategoriesEnabled = true;
  const { categories, hasError } = useHomepageCategories(isDynamicCategoriesEnabled);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    
    // Trigger sticky state as the sentinel crosses beneath the header.
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      {
        threshold: [0],
        rootMargin: "-56px 0px 0px 0px",
      },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isDynamicCategoriesEnabled || categories.length === 0) return;
    categories.forEach((category) => {
      trackHomepageCategoryEvent("homepage_category_impression", {
        key: category.key,
        label: category.label,
        route: category.route,
      });
    });
  }, [isDynamicCategoriesEnabled, categories]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(HOMEPAGE_ROW_COUNT_PREF_KEY);
    setRowCountPreference(parseHomepageRowCountPreference(raw));
  }, []);

  return (
    <QuickViewProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: colors.cards }}
      >
        <Header />

        <main className="w-full flex-1 mt-0">
          {/* Hero Section */}
          <section aria-label="Find Property">
            <HeroSection />
          </section>

          {/* Quick Navigation */}
          <div className="mt-2 w-full">
            <FeaturedCollections
              categories={isDynamicCategoriesEnabled ? categories : []}
            />
          </div>

          {/* Content Section */}
          <section
            className="w-full mt-8 px-4 lg:px-6"
            aria-label="Properties and Search Filters"
          >
            <div className="w-full">
              {/* Sentinel to detect when filter becomes sticky */}
              <div ref={sentinelRef} className="h-0" />

              {/* Search & Filters — sticky under navbar */}
              <div
                className="sticky z-40 -mx-4 lg:-mx-6 px-4 lg:px-6 pb-2 pt-2 transition-all duration-300 origin-top"
                style={{
                  top: "var(--header-height, 56px)",
                  backgroundColor: colors.cards,
                }}
              >
                <PropertyFilter variant="horizontal" isSticky={isSticky} />
              </div>

              {/* Listing Grids */}
              <div
                id="search-results-top"
                className="space-y-4 overflow-x-hidden"
              >
                {process.env.NODE_ENV !== "production" && (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    <div className="font-bold mb-2">
                      Homepage Category Debug (dev only)
                    </div>
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <div key={category.key} className="flex items-center gap-2">
                          <span className="font-semibold">{category.key}</span>
                          <span>-</span>
                          <span>{category.label}</span>
                          <span>-</span>
                          <span>
                            count:{" "}
                            {Number.isFinite(category.count)
                              ? category.count
                              : "missing"}
                          </span>
                          <span>-</span>
                          <span>kind: {category.kind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full">
                  <div className="mx-auto w-full max-w-md px-2">
                    <div className="flex justify-center">
                      <label className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-ds-body">
                        <span className="font-medium">Results per row</span>
                        <select
                          value={rowCountPreference ? String(rowCountPreference) : "auto"}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "auto") {
                              window.localStorage.removeItem(HOMEPAGE_ROW_COUNT_PREF_KEY);
                              setRowCountPreference(null);
                              window.dispatchEvent(new Event(HOMEPAGE_ROW_COUNT_EVENT));
                              return;
                            }
                            const parsed = Number(value);
                            if (!Number.isFinite(parsed) || parsed <= 0) return;
                            window.localStorage.setItem(
                              HOMEPAGE_ROW_COUNT_PREF_KEY,
                              String(parsed),
                            );
                            setRowCountPreference(parsed);
                            window.dispatchEvent(new Event(HOMEPAGE_ROW_COUNT_EVENT));
                          }}
                          className="rounded-md border border-ds-card-border bg-white px-2 py-1 text-xs sm:text-sm"
                        >
                          <option value="auto">Auto</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="6">6</option>
                          <option value="8">8</option>
                          <option value="12">12</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
                <DynamicHomepageSections
                  categories={categories}
                  useFallback={!isDynamicCategoriesEnabled || hasError}
                />
              </div>
            </div>
          </section>

          {/* Utility Sections */}
          <section className="section-gap" aria-label="Common Locations">
            <LocationsSection />
          </section>

          <section className="section-gap" aria-label="Latest Real Estate News">
            <LatestArticles />
          </section>

          <section className="section-gap-sm" aria-label="Realtor Connections">
            <ConnectionsSection />
          </section>

          <section className="section-gap" aria-label="Mortgage Tools">
            <Container>
              <MortgageSection />
            </Container>
          </section>

          <section className="section-gap" aria-label="Client Success Stories">
            <ClientReviews />
          </section>

          {/* Mobile Filter FAB */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: colors.primary }}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </main>

        <Footer />
        <LeadCaptureWidget />

        {/* Drawers */}
        <MobileFilterDrawer
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
        />
      </div>
    </QuickViewProvider>
  );
}
