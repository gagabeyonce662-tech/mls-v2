import React from 'react'
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

export default function page() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cards }}>
      <Header />
      <HeroSection />
      
      {/* Main Content with Sidebar - Sidebar starts below hero with spacing */}
      <div className="flex mt-8">
        {/* Left Sidebar - Property Filter with padding */}
        <div className="hidden lg:block w-80 border-r p-4" style={{ borderColor: colors.boarder }}>
          <PropertyFilter />
        </div>
        
        {/* Main Content Area until Mortgage */}
        <div className="flex-1">
          <FeaturedCollections />
          <FeaturedListings />
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
