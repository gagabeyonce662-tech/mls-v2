'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PreConstructionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Pre-Construction Properties
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Discover exciting pre-construction opportunities in the GTA. Get in early on new developments 
            and secure your future home at today's prices.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}