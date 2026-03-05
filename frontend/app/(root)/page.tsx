"use client";

import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { colors } from "@/config/design-system";

import { SearchProvider } from "@/contexts/SearchContext";
import { QuickViewProvider } from "@/contexts/QuickViewContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import HeroSection from "@/components/homepage/HeroSection";
import FeaturedCollections from "@/components/homepage/FeaturedCollections";
import PropertyFilter from "@/components/PropertyFilter";
import MobileFilterDrawer from "@/components/homepage/MobileFilterDrawer";

import { SearchResultsSection } from "@/components/homepage/sections/SearchResultsSection";
import { NewlyListedSection } from "@/components/homepage/sections/NewlyListedSection";
import { ExclusivePropertiesSection } from "@/components/homepage/sections/ExclusivePropertiesSection";
import { RentalPropertiesSection } from "@/components/homepage/sections/RentalPropertiesSection";
import { PreConstructionSection } from "@/components/homepage/sections/PreConstructionSection";

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

export default function HomePage() {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <SearchProvider>
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
              <FeaturedCollections />
            </div>

            {/* Content Section */}
            <section
              className="w-full mt-8 px-4 lg:px-6"
              aria-label="Properties and Search Filters"
            >
              <div className="w-full">
                {/* Search & Filters */}
                <PropertyFilter variant="horizontal" />

                {/* Listing Grids */}
                <div className="space-y-4 overflow-x-hidden">
                  <SearchResultsSection />
                  <NewlyListedSection />
                  <ExclusivePropertiesSection />
                  <RentalPropertiesSection />
                  <PreConstructionSection />
                </div>
              </div>
            </section>

            {/* Utility Sections */}
            <section className="section-gap" aria-label="Common Locations">
              <Container>
                <LocationsSection />
              </Container>
            </section>

            <section
              className="section-gap"
              aria-label="Latest Real Estate News"
            >
              <Container>
                <LatestArticles />
              </Container>
            </section>

            <section className="section-gap" aria-label="Mortgage Tools">
              <Container>
                <MortgageSection />
              </Container>
            </section>

            <section
              className="section-gap"
              aria-label="Client Success Stories"
            >
              <Container>
                <ClientReviews />
              </Container>
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

          {/* Drawers */}
          <MobileFilterDrawer
            open={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />
        </div>
      </QuickViewProvider>
    </SearchProvider>
  );
}
