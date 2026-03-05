"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SlidersHorizontal, Map, Home, Building2, Calculator, BadgeInfo, FileText, Key } from "lucide-react";
import HeroSection from "@/components/homepage/HeroSection";
import FeaturedCollections from "@/components/homepage/FeaturedCollections";
import FeaturedListings from "@/components/homepage/FeaturedListings";
import SearchResults from "@/components/homepage/SearchResults";
import RentalProperties from "@/components/homepage/RentalProperties";
import PreConstructionProperties from "@/components/homepage/PreConstructionProperties";
import LocationsSection from "@/components/homepage/LocationsSection";
import MortgageSection from "@/components/homepage/MortgageSection";
import LatestArticles from "@/components/homepage/LatestArticles";
import ClientReviews from "@/components/homepage/ClientReviews";
import NewlyListedListings from "@/components/homepage/NewlyListedListings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import PropertyFilter from "@/components/PropertyFilter";
import { colors } from "@/config/design-system";
import {
  fetchExclusiveProperties,
  fetchLeaseProperties,
  fetchPreConnProperties,
  type Property,
} from "@/lib/api";
import { useProvince } from "@/contexts/ProvinceContext";

import MobileFilterDrawer from "@/components/homepage/MobileFilterDrawer";
import { PropertyQuickViewModal } from "@/components/listing/PropertyQuickViewModal";

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rentalProperties, setRentalProperties] = useState<Property[]>([]);
  const [preConnProperties, setPreConnProperties] = useState<Property[]>([]);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [totalExclusiveCount, setTotalExclusiveCount] = useState(0);
  const [totalRentalCount, setTotalRentalCount] = useState(0);
  const [totalPreConnCount, setTotalPreConnCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRentals, setIsLoadingRentals] = useState(true);
  const [isLoadingPreConn, setIsLoadingPreConn] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { selectedProvince, getProvinceName } = useProvince();

  const hasInitialLoadCompleted = useRef(false);
  const hasRentalInitialLoadCompleted = useRef(false);
  const hasPreConnInitialLoadCompleted = useRef(false);
  const prevProvinceRef = useRef<string | null>(null);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );

  const handleQuickView = (property: Property) => {
    setSelectedProperty(property);
    setQuickViewOpen(true);
  };

  useEffect(() => {
    if (hasInitialLoadCompleted.current) return;
    const load = async () => {
      setIsLoading(true);
      const response = await fetchExclusiveProperties({});
      setProperties(response.results || []);
      setTotalExclusiveCount(response.count || 0);
      hasInitialLoadCompleted.current = true;
      prevProvinceRef.current = selectedProvince;
      setIsLoading(false);
    };
    load();
  }, [selectedProvince]);

  useEffect(() => {
    if (hasRentalInitialLoadCompleted.current) return;
    const load = async () => {
      setIsLoadingRentals(true);
      const response = await fetchLeaseProperties({});
      setRentalProperties(response.results || []);
      setTotalRentalCount(response.count || 0);
      hasRentalInitialLoadCompleted.current = true;
      setIsLoadingRentals(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (hasPreConnInitialLoadCompleted.current) return;
    const load = async () => {
      setIsLoadingPreConn(true);
      const response = await fetchPreConnProperties({});
      setPreConnProperties(response.results || []);
      setTotalPreConnCount(response.count || 0);
      hasPreConnInitialLoadCompleted.current = true;
      setIsLoadingPreConn(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!hasInitialLoadCompleted.current || !selectedProvince) return;
    if (selectedProvince === prevProvinceRef.current) return;

    const load = async () => {
      setIsLoading(true);
      const provinceName = getProvinceName(selectedProvince);
      const provinceMapping: any = {
        Ontario: "ON",
        Quebec: "QC",
        "British Columbia": "BC",
        Alberta: "AB",
        Manitoba: "MB",
        Saskatchewan: "SK",
        "Nova Scotia": "NS",
        "New Brunswick": "NB",
        "Newfoundland and Labrador": "NL",
        "Prince Edward Island": "PE",
        "Northwest Territories": "NT",
        Nunavut: "NU",
        Yukon: "YT",
      };
      const code =
        provinceName === "All Provinces"
          ? undefined
          : provinceMapping[provinceName];
      const response = await fetchExclusiveProperties(
        code ? { province: code } : {},
      );
      setProperties(response.results || []);
      setTotalExclusiveCount(response.count || 0);
      prevProvinceRef.current = selectedProvince;
      setIsLoading(false);
    };
    load();
  }, [selectedProvince, getProvinceName]);

  const handlePropertiesUpdate = (newProperties: Property[], query: string = "") => {
    setProperties(newProperties);
    setSearchResults(newProperties);
    setSearchQuery(query || "Filtered Properties");

    // Optional: Scroll to results on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  const handleSearchResults = (results: Property[], query: string = "") => {
    setSearchResults(results);
    setSearchQuery(query);
    setIsSearching(false);
  };

  const handleSearchStart = () => setIsSearching(true);
  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.cards }}
    >
      <Header />

      <main className="w-full flex-1">
        <section aria-label="Find Property">
          <HeroSection
            onSearchStart={handleSearchStart}
            onSearchResults={handleSearchResults}
          />
        </section>

        {/* 🔗 Quick Navigation Internal Links for SEO */}
        <section className="w-full bg-white border-b overflow-hidden" aria-label="Quick Navigation">
          <Container>
            <nav className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar whitespace-nowrap px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ds-body/40 mr-2 shrink-0">Browse:</span>
              {[
                { name: "All Properties", href: "/listing", icon: Home },
                { name: "Rentals", href: "/listing/rental", icon: Key },
                { name: "Pre-Construction", href: "/Precon", icon: Building2 },
                { name: "Map Search", href: "/map-search", icon: Map },
                { name: "Home Valuation", href: "/valuation", icon: BadgeInfo },
                { name: "Mortgage Tool", href: "/mortgage-calculator", icon: Calculator },
                { name: "Real Estate Blog", href: "/blog", icon: FileText },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-ds-card/50 border border-ds-card-border text-xs font-semibold text-ds-heading hover:bg-ds-primary hover:text-white hover:border-ds-primary transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5 opacity-60" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </Container>
        </section>

        <section className="section-gap-sm px-4 lg:px-8" aria-label="Featured Collections">
          <Container>
            <FeaturedCollections />
          </Container>
        </section>

        <section className="w-full section-gap px-4 lg:px-6" aria-label="Properties and Search Filters">
          <div className="w-full">
            <PropertyFilter
              onPropertiesUpdate={handlePropertiesUpdate}
              variant="horizontal"
            />

            <div className="space-y-16">
              {searchQuery && (
                <section aria-label="Search Results">
                  <SearchResults
                    properties={searchResults}
                    isLoading={isSearching}
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                    onQuickView={handleQuickView}
                  />
                </section>
              )}

              <section aria-label="Newly Listed Properties">
                <NewlyListedListings
                  searchQuery={searchQuery || "Latest Properties"}
                  showLimit={4}
                  onQuickView={handleQuickView}
                />
              </section>

              <section aria-label="Featured Properties">
                <FeaturedListings
                  properties={properties}
                  totalCount={totalExclusiveCount}
                  searchQuery={
                    selectedProvince
                      ? `Exclusive in ${getProvinceName(selectedProvince)}`
                      : "Exclusive Properties"
                  }
                  onQuickView={handleQuickView}
                />
              </section>

              <section aria-label="Rental Properties">
                <RentalProperties
                  properties={rentalProperties}
                  totalCount={totalRentalCount}
                  isLoading={isLoadingRentals}
                  onQuickView={handleQuickView}
                />
              </section>

              <section aria-label="Pre-Construction Projects">
                <PreConstructionProperties
                  properties={preConnProperties}
                  totalCount={totalPreConnCount}
                  isLoading={isLoadingPreConn}
                  onQuickView={handleQuickView}
                />
              </section>
            </div>
          </div>
        </section>

        <section className="section-gap" aria-label="Common Locations">
          <Container>
            <LocationsSection />
          </Container>
        </section>

        <section className="section-gap" aria-label="Latest Real Estate News">
          <Container>
            <LatestArticles />
          </Container>
        </section>

        <section className="section-gap" aria-label="Mortgage Tools">
          <Container>
            <MortgageSection />
          </Container>
        </section>

        <section className="section-gap" aria-label="Client Success Stories">
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

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        onPropertiesUpdate={(newProps) => {
          setMobileFilterOpen(false);
          handlePropertiesUpdate(newProps);
        }}
      />

      <PropertyQuickViewModal
        show={quickViewOpen}
        property={selectedProperty}
        onClose={() => setQuickViewOpen(false)}
      />
    </div>
  );
}
