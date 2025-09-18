'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSlider from '@/components/homepage/HeroSlider';
import PropertySearch from '@/components/PropertySearch';
import FeaturedListings from '@/components/FeaturedListings';
import BuySellSection from '@/components/BuySellSection';
import AgentProfile from '@/components/AgentProfile';
import Neighborhoods from '@/components/Neighborhoods';
import MortgageCalculator from '@/components/MortgageCalculator';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import OttawaStatisticsChart from '@/components/homepage/OttawaStatisticsChart';
import PopularCities from '@/components/homepage/PopularCities';
import KeywordSearch from '@/components/homepage/KeywordSearch';
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <HeroSlider />
        <PropertySearch />
        <KeywordSearch />
        <FeaturedListings />
        <OttawaStatisticsChart />
        <PopularCities />
        {/* <BuySellSection /> */}
        {/* <AgentProfile /> */}
        {/* <Neighborhoods /> */}
        {/* <MortgageCalculator /> */}
        {/* <Testimonials /> */}
      </main>
      <Footer />
    </div>
  );
}