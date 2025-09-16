'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ResaleListingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Our Resale Listings
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Browse our curated collection of resale properties in the Greater Toronto Area. 
            Each listing has been carefully selected to offer exceptional value and quality 
            for our clients.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}