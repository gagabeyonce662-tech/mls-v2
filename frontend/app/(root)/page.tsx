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

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("Exclusive Properties");
  const { selectedProvince, getProvinceName } = useProvince();
  
  // Use refs to track state
  const hasInitialLoadCompleted = useRef(false);
  const prevProvinceRef = useRef<string | null>(null);

  // 1. INITIAL LOAD: Only ONCE when page loads
  useEffect(() => {
    // Skip if already loaded
    if (hasInitialLoadCompleted.current) return;
    
    const loadInitialProperties = async () => {
      setIsLoading(true);
      console.log('🚀 INITIAL PAGE LOAD - Fetching ALL exclusive properties (NO filters)...');
      
      try {
        // Call exclusive-properties1/ with NO parameters
        const response = await fetchExclusiveProperties({});
        
        console.log('✅ INITIAL LOAD COMPLETE:', response.results?.length || 0, 'properties');
        
        setProperties(response.results || []);
        setSearchQuery("Exclusive Properties");
        hasInitialLoadCompleted.current = true;
        
        // Initialize previous province ref
        prevProvinceRef.current = selectedProvince;
        
      } catch (error) {
        console.error('❌ Error in initial load:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialProperties();
  }, []); // Empty deps = runs ONLY on mount

  // 2. Handle PROVINCE CHANGES from dropdown ONLY
  useEffect(() => {
    // Skip if:
    // 1. Initial load hasn't completed yet
    // 2. No province selected (shouldn't happen but just in case)
    // 3. Province hasn't actually changed
    if (!hasInitialLoadCompleted.current || !selectedProvince) return;
    
    const currentProvince = selectedProvince;
    const previousProvince = prevProvinceRef.current;
    
    // If province hasn't changed, do nothing
    if (currentProvince === previousProvince) return;
    
    console.log('🔄 Province changed from', previousProvince, 'to', currentProvince);
    
    const loadPropertiesForProvince = async () => {
      setIsLoading(true);
      
      try {
        const provinceName = getProvinceName(currentProvince);
        console.log('📌 Loading properties for:', provinceName);
        
        if (provinceName === "All Provinces") {
          // If "All Provinces" selected, fetch without province filter
          console.log('🌍 Fetching ALL properties (All Provinces selected)');
          const response = await fetchExclusiveProperties({});
          setProperties(response.results || []);
          setSearchQuery("All Exclusive Properties");
        } else {
          // Convert province name to code
          const filters: ExclusivePropertyFilterParams = {};
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
          
          console.log('🎯 Calling API with province filter:', provinceCode);
          const response = await fetchExclusiveProperties({ province: provinceCode });
          setProperties(response.results || []);
          setSearchQuery(`${provinceName} Exclusive Properties`);
        }
        
        // Update previous province
        prevProvinceRef.current = currentProvince;
        
      } catch (error) {
        console.error('❌ Error loading province properties:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Use setTimeout to ensure this runs after state updates
    const timer = setTimeout(() => {
      loadPropertiesForProvince();
    }, 0);
    
    return () => clearTimeout(timer);
    
  }, [selectedProvince, getProvinceName]); // Only runs when selectedProvince changes

  // Handle properties update from PropertyFilter or HeroSection (search/filter)
  const handlePropertiesUpdate = React.useCallback((newProperties: Property[], query: string = "") => {
    setProperties(newProperties);
    setSearchQuery(query || "Filtered Properties");
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cards }}>
      <Header />
      <HeroSection onPropertiesUpdate={handlePropertiesUpdate} />
      
      {/* Main Content with Sidebar - Sidebar starts below hero with spacing */}
      <div className="flex mt-8">
        {/* Left Sidebar - Property Filter with padding */}
        <div className="hidden lg:block w-80 border-r p-4" style={{ borderColor: colors.boarder }}>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              {searchQuery}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {isLoading ? 'Loading properties...' : `${properties.length} properties found`}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <p>API Status: {hasInitialLoadCompleted.current ? 'Initial load complete' : 'Loading...'}</p>
              <p>Current Province: {getProvinceName(selectedProvince)}</p>
            </div>
          </div>
          <PropertyFilter onPropertiesUpdate={handlePropertiesUpdate} />
        </div>
        
        {/* Main Content Area until Mortgage */}
        <div className="flex-1">
          <FeaturedCollections />
          <FeaturedListings 
            properties={properties} 
            isLoading={isLoading} 
            searchQuery={searchQuery} 
          />
          <LocationsSection />
          <MortgageSection />
        </div>
      </div>
      
      {/* Full Width Sections After Mortgage */}
      <LatestArticles />
      <ClientReviews />
      
      <Footer />
    </div>
  )
}