'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Our Services
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Comprehensive real estate services to help you buy, sell, or invest in properties 
            across the Greater Toronto Area. Our expert team provides personalized solutions 
            for all your real estate needs.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}