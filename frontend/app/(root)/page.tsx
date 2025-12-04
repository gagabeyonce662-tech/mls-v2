"use client";

import React, { useState, useEffect } from 'react'
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
import { fetchProperties, type Property, type PropertyFilterParams } from '@/lib/api';
import { useProvince } from '@/contexts/ProvinceContext';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedProvince, getProvinceName } = useProvince();

  // Load default properties for selected province
  useEffect(() => {
    const loadDefaultProperties = async () => {
      setIsLoading(true);
      try {
        const provinceName = getProvinceName(selectedProvince);
        console.log('Loading default properties for province:', provinceName);
        
        const filters: PropertyFilterParams = {
          province: provinceName,
          status: 'Active'
        };
        
        const defaultProperties = await fetchProperties(filters);
        setProperties(defaultProperties);
        setSearchQuery(provinceName);
        console.log('Loaded default properties:', defaultProperties.length);
      } catch (error) {
        console.error('Error loading default properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultProperties();
  }, [selectedProvince]); // Only depend on selectedProvince

  const handlePropertiesUpdate = React.useCallback((newProperties: Property[], query: string = "") => {
    setProperties(newProperties);
    setSearchQuery(query);
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
              Showing properties in <span className="font-bold">{getProvinceName(selectedProvince)}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Change province using the dropdown in the header
            </p>
          </div>
          <PropertyFilter onPropertiesUpdate={handlePropertiesUpdate} />
        </div>
        
        {/* Main Content Area until Mortgage */}
        <div className="flex-1">
          <FeaturedCollections />
          <FeaturedListings properties={properties} isLoading={isLoading} searchQuery={searchQuery} />
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
