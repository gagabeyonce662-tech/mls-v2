import React from 'react'
import HeroSection from '@/components/homepage/HeroSection';
import StatsGrid from '@/components/homepage/StatsGrid';
import FeaturedListings from '@/components/homepage/FeaturedListings';
import PopularNeighborhoods from '@/components/homepage/PopularNeighborhoods';
import RecentListings from '@/components/homepage/RecentListings';
import NewsletterSection from '@/components/homepage/NewsletterSection';
import Header from '@/components/Header';
import ListingGrid from '@/components/ListingGrid';

export default function page() {
  return (
     <div className="min-h-screen bg-background">
      <Header/>
      <HeroSection />
      <ListingGrid />
      <StatsGrid />
      <FeaturedListings />
      <PopularNeighborhoods />
      <RecentListings />
      <NewsletterSection />
    </div>
  )
}
