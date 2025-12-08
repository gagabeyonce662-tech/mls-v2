"use client";

import React, { useState, useEffect, useRef } from 'react'
import HeroSection from '@/components/homepage/HeroSection';
import FeaturedCollections from '@/components/homepage/FeaturedCollections';
import FeaturedListings from '@/components/homepage/FeaturedListings';
import RentalProperties from '@/components/homepage/RentalProperties';
import LocationsSection from '@/components/homepage/LocationsSection';
import MortgageSection from '@/components/homepage/MortgageSection';
import LatestArticles from '@/components/homepage/LatestArticles';
import ClientReviews from '@/components/homepage/ClientReviews';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyFilter from '@/components/PropertyFilter';
import { colors } from '@/config/design-system';
import { 
  fetchExclusiveProperties, 
  fetchLeaseProperties,
  type Property,
  type ExclusivePropertyFilterParams 
} from '@/lib/api';
import { useProvince } from '@/contexts/ProvinceContext';

// A small mobile drawer for filters. Keeps the page responsive without changing other components.
function MobileFilterDrawer({ open, onClose, onPropertiesUpdate }: { open: boolean; onClose: () => void; onPropertiesUpdate: (props: Property[], q?: string) => void }) {
  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 transition-transform duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ borderLeft: `1px solid ${colors.boarder}` }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Filters</h3>
          <button onClick={onClose} aria-label="Close filters" className="text-sm px-2 py-1 rounded-md">Close</button>
        </div>

        <div className="p-4 ">
          <PropertyFilter onPropertiesUpdate={onPropertiesUpdate} />
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rentalProperties, setRentalProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRentals, setIsLoadingRentals] = useState(true);
  const [searchQuery, setSearchQuery] = useState("Exclusive Properties");
  const { selectedProvince, getProvinceName } = useProvince();
  
  // Use refs to track state
  const hasInitialLoadCompleted = useRef(false);
  const hasRentalInitialLoadCompleted = useRef(false);
  const prevProvinceRef = useRef<string | null>(null);

  // Mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 1. INITIAL LOAD: Only ONCE when page loads
  useEffect(() => {
    if (hasInitialLoadCompleted.current) return;
    
    const loadInitialProperties = async () => {
      setIsLoading(true);
      console.log('🚀 INITIAL PAGE LOAD - Fetching ALL exclusive properties (NO filters)...');
      
      try {
        const response = await fetchExclusiveProperties({});
        console.log('✅ INITIAL LOAD COMPLETE:', response.results?.length || 0, 'properties');
        setProperties(response.results || []);
        setSearchQuery("Exclusive Properties");
        hasInitialLoadCompleted.current = true;
        prevProvinceRef.current = selectedProvince;
      } catch (error) {
        console.error('❌ Error in initial load:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialProperties();
  }, []);

  // 2. INITIAL RENTAL PROPERTIES LOAD
  useEffect(() => {
    if (hasRentalInitialLoadCompleted.current) return;
    
    const loadInitialRentalProperties = async () => {
      setIsLoadingRentals(true);
      console.log('🚀 INITIAL PAGE LOAD - Fetching ALL rental properties...');
      
      try {
        const response = await fetchLeaseProperties({});
        console.log('✅ RENTAL INITIAL LOAD COMPLETE:', response.results?.length || 0, 'properties');
        setRentalProperties(response.results || []);
        hasRentalInitialLoadCompleted.current = true;
      } catch (error) {
        console.error('❌ Error in rental initial load:', error);
      } finally {
        setIsLoadingRentals(false);
      }
    };

    loadInitialRentalProperties();
  }, []);

  // 3. Handle PROVINCE CHANGES from dropdown ONLY (for exclusive properties)
  useEffect(() => {
    if (!hasInitialLoadCompleted.current || !selectedProvince) return;
    const currentProvince = selectedProvince;
    const previousProvince = prevProvinceRef.current;
    if (currentProvince === previousProvince) return;
    
    const loadPropertiesForProvince = async () => {
      setIsLoading(true);
      try {
        const provinceName = getProvinceName(currentProvince);
        if (provinceName === "All Provinces") {
          const response = await fetchExclusiveProperties({});
          setProperties(response.results || []);
          setSearchQuery("All Exclusive Properties");
        } else {
          const provinceMapping: { [key: string]: string } = {
            'Ontario': 'ON',
            'Quebec': 'QC',
            'British Columbia': 'BC',
            'Alberta': 'AB',
            'Manitoba': 'MB',
            'Saskatchewan': 'SK',
            'Nova Scotia': 'NS',
            'New Brunswick': 'NB',
            'Newfoundland and Labrador': 'NL',
            'Prince Edward Island': 'PE',
            'Northwest Territories': 'NT',
            'Nunavut': 'NU',
            'Yukon': 'YT'
          };
          const provinceCode = provinceMapping[provinceName] || provinceName;
          const response = await fetchExclusiveProperties({ province: provinceCode });
          setProperties(response.results || []);
          setSearchQuery(`${provinceName} Exclusive Properties`);
        }
        prevProvinceRef.current = currentProvince;
      } catch (error) {
        console.error('❌ Error loading province properties:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // small delay to allow UI to update if needed
    const timer = setTimeout(() => loadPropertiesForProvince(), 0);
    return () => clearTimeout(timer);
  }, [selectedProvince, getProvinceName]);

  const handlePropertiesUpdate = React.useCallback((newProperties: Property[], query: string = "") => {
    setProperties(newProperties);
    setSearchQuery(query || "Filtered Properties");
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.cards }}>
      <Header />

      <main className="w-full flex-1">
        <HeroSection onPropertiesUpdate={handlePropertiesUpdate} />

        {/* FeaturedCollections comes BEFORE the Exclusive Properties section */}
        <div className="max-w-full mx-auto px-4 lg:px-6 xl:px-8 mt-6">
          <FeaturedCollections />
        </div>

        {/* EXCLUSIVE PROPERTIES SECTION WITH SIDEBAR FILTERS */}
        <div className="mt-8 lg:mt-12">
          {/* Section Header with Title and Mobile Filter Button */}
          <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
               
              </div>

              {/* Mobile filter toggle - ONLY for Exclusive Properties */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                  aria-expanded={mobileFilterOpen}
                  aria-controls="mobile-filter-drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main two-column layout for Exclusive Properties ONLY */}
          <div className="flex relative px-4 lg:px-6 xl:px-8 gap-0 max-w-[1800px] mx-auto w-full">
            {/* Left Sidebar - visible on lg+ */}
            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
              <div 
                className="top-6"
                style={{ 
                  borderRight: `1px solid ${colors.boarder}`,
                 
                  paddingRight: 12
                }}
              >
              

                <div style={{ paddingBottom: 12 }}>
                  <PropertyFilter onPropertiesUpdate={handlePropertiesUpdate} />
                </div>
              </div>
            </aside>

            {/* Main Content Area - FeaturedListings for Exclusive Properties */}
            <main className="flex-1 min-w-0 px-0 lg:px-4">
              <FeaturedListings 
                properties={properties} 
                isLoading={isLoading} 
                searchQuery={searchQuery} 
              />
               <RentalProperties 
            properties={rentalProperties} 
            isLoading={isLoadingRentals} 
          />
            </main>
          </div>
        </div>

        {/* Rental Properties Section - Comes AFTER Exclusive Properties */}
     

        {/* Other Sections */}
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8 mt-12">
          <LocationsSection />
        </div>

        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8 mt-12">
          <MortgageSection />
        </div>

        {/* Full Width Sections After Mortgage */}
        <div className="mt-12 max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8">
          <ClientReviews />
        </div>
      </main>

      <Footer />

      {/* Mobile drawer component */}
      <MobileFilterDrawer 
        open={mobileFilterOpen} 
        onClose={() => setMobileFilterOpen(false)} 
        onPropertiesUpdate={(newProps, q) => { 
          setMobileFilterOpen(false); 
          handlePropertiesUpdate(newProps, q); 
        }} 
      />
    </div>
  )
}