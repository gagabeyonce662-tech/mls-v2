"use client";

import React, { useState, useEffect, useRef } from 'react'
import HeroSection from '@/components/homepage/HeroSection';
import FeaturedCollections from '@/components/homepage/FeaturedCollections';
import FeaturedListings from '@/components/homepage/FeaturedListings';
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

        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {/* PropertyFilter is designed to be embeddable; it will call onPropertiesUpdate when user applies filters */}
          <PropertyFilter onPropertiesUpdate={onPropertiesUpdate} />
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("Exclusive Properties");
  const { selectedProvince, getProvinceName } = useProvince();
  
  // Use refs to track state
  const hasInitialLoadCompleted = useRef(false);
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

  // 2. Handle PROVINCE CHANGES from dropdown ONLY
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

        {/* Mobile filter button - visible on small screens */}
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{searchQuery}</h2>
              <p className="text-sm text-gray-500 hidden sm:block">{isLoading ? 'Loading properties...' : `${properties.length} properties found`}</p>
            </div>

            {/* Mobile filter toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-md bg-white"
                aria-expanded={mobileFilterOpen}
                aria-controls="mobile-filter-drawer"
              >
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main two-column layout for lg and above. On small screens everything stacks. */}
      <div className="flex mt-4 relative px-4 lg:px-6 xl:px-8 gap-0 max-w-[1800px] mx-auto w-full">

          {/* Left Sidebar - visible on lg+ */}
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div 
              className="sticky top-4"
              style={{ 
                borderRight: `1px solid ${colors.boarder}`,
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
                paddingRight: 12 // avoid content touching the border
              }}
            >
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {searchQuery}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {isLoading ? 'Loading properties...' : `${properties.length} properties found`}
                </p>
              </div>

              {/* PropertyFilter already has internal padding; avoid double-padding here */}
              <div style={{ paddingBottom: 12 }}>
                <PropertyFilter onPropertiesUpdate={handlePropertiesUpdate} />
              </div>
            </div>
          </aside>

          {/* Main Content Area - becomes full width on small screens */}
          <main className="flex-1 min-w-0 px-0 lg:px-4">
            <FeaturedCollections />

            {/* FeaturedListings receives properties & will reflow depending on its internal layout - ensure it uses responsive grid */}
            <FeaturedListings 
              properties={properties} 
              isLoading={isLoading} 
              searchQuery={searchQuery} 
            />

            <LocationsSection />
            <MortgageSection />

            {/* On small screens show LatestArticles earlier to give mobile users easy access */}
            
          </main>
        </div>

        {/* Full Width Sections After Mortgage */}
        <div className="mt-8 max-w-[1800px] mx-auto px-4 lg:px-6 xl:px-8">
          <ClientReviews />
        </div>
      </main>

      <Footer />

      {/* Mobile drawer component - rendered at root so it overlays everything */}
      <MobileFilterDrawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} onPropertiesUpdate={(newProps, q) => { setMobileFilterOpen(false); handlePropertiesUpdate(newProps, q); }} />
    </div>
  )
}
