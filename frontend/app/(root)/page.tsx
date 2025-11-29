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

export default function page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturedCollections />
      <FeaturedListings />
      <LocationsSection />
      <MortgageSection />
      <LatestArticles />
      <ClientReviews />
      <Footer />
    </div>
  )
}
