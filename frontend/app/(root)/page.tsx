"use client";

import React, { useState, useEffect, useRef } from 'react'
import HeroSection from '@/components/homepage/HeroSection';
import FeaturedCollections from '@/components/homepage/FeaturedCollections';
import FeaturedListings from '@/components/homepage/FeaturedListings';
import SearchResults from '@/components/homepage/SearchResults';
import RentalProperties from '@/components/homepage/RentalProperties';
import PreConstructionProperties from '@/components/homepage/PreConstructionProperties';
import LocationsSection from '@/components/homepage/LocationsSection';
import MortgageSection from '@/components/homepage/MortgageSection';
import LatestArticles from '@/components/homepage/LatestArticles';
import ClientReviews from '@/components/homepage/ClientReviews';
import NewlyListedListings from '@/components/homepage/NewlyListedListings';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyFilter from '@/components/PropertyFilter';
import { colors } from '@/config/design-system';
import { 
  fetchExclusiveProperties, 
  fetchLeaseProperties,
  fetchPreConnProperties,
  type Property
} from '@/lib/api';
import { useProvince } from '@/contexts/ProvinceContext';

function MobileFilterDrawer({ open, onClose, onPropertiesUpdate }: { open: boolean; onClose: () => void; onPropertiesUpdate: (props: Property[], q?: string) => void }) {
  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 transition-transform duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ borderLeft: `1px solid ${colors.boarder}` }}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-base font-medium">Filters</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded-md">Close</button>
        </div>
        <div className="p-3 overflow-y-auto h-[calc(100%-60px)]">
          <PropertyFilter onPropertiesUpdate={onPropertiesUpdate} />
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rentalProperties, setRentalProperties] = useState<Property[]>([]);
  const [preConnProperties, setPreConnProperties] = useState<Property[]>([]);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
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

  useEffect(() => {
    if (hasInitialLoadCompleted.current) return;
    const load = async () => {
      setIsLoading(true);
      const response = await fetchExclusiveProperties({});
      setProperties(response.results || []);
      hasInitialLoadCompleted.current = true;
      prevProvinceRef.current = selectedProvince;
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (hasRentalInitialLoadCompleted.current) return;
    const load = async () => {
      setIsLoadingRentals(true);
      const response = await fetchLeaseProperties({});
      setRentalProperties(response.results || []);
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
        Ontario: 'ON', Quebec: 'QC', 'British Columbia': 'BC', Alberta: 'AB',
        Manitoba: 'MB', Saskatchewan: 'SK', 'Nova Scotia': 'NS', 'New Brunswick': 'NB',
        'Newfoundland and Labrador': 'NL', 'Prince Edward Island': 'PE',
        'Northwest Territories': 'NT', Nunavut: 'NU', Yukon: 'YT'
      };
      const code = provinceName === "All Provinces" ? undefined : provinceMapping[provinceName];
      const response = await fetchExclusiveProperties(code ? { province: code } : {});
      setProperties(response.results || []);
      prevProvinceRef.current = selectedProvince;
      setIsLoading(false);
    };
    load();
  }, [selectedProvince]);

  const handlePropertiesUpdate = (newProperties: Property[]) => setProperties(newProperties);

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.cards }}>
      <Header />

      <main className="w-full flex-1">
        <HeroSection onSearchStart={handleSearchStart} onSearchResults={handleSearchResults} />

        <div className="lg:px-6 xl:px-8 mt-3">
          <FeaturedCollections />
        </div>

        <div className="flex relative px-4 lg:px-6 xl:px-8 gap-0 max-w-[1800px] mx-auto w-full">
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-4 h-[calc(100vh-80px)] overflow-y-auto" style={{ borderRight: `1px solid ${colors.boarder}`, paddingRight: '12px' }}>
              <PropertyFilter onPropertiesUpdate={handlePropertiesUpdate} />
            </div>
          </aside>

          <main className="flex-1 min-w-0 px-0 lg:px-4">
            {searchQuery && (
              <div className="mt-4 max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8">
                <SearchResults properties={searchResults} isLoading={isSearching} searchQuery={searchQuery} onClearSearch={handleClearSearch} />
              </div>
            )}
            <NewlyListedListings 
      searchQuery={searchQuery || "Latest Properties"}
      showLimit={6}
    />
            
            <FeaturedListings properties={properties}  searchQuery="Exclusive Properties" />
            <RentalProperties properties={rentalProperties} isLoading={isLoadingRentals} />
            <PreConstructionProperties properties={preConnProperties} isLoading={isLoadingPreConn} />
          </main>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8 mt-4">
          <LocationsSection />
        </div>

        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8 mt-4">
          <MortgageSection />
        </div>

        <div className="mt-4 max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8">
          <ClientReviews />
        </div>
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
    </div>
  )
}
