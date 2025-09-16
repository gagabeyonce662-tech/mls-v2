'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Real Estate Blog
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Stay updated with the latest real estate news, market trends, and expert insights 
            from the Greater Toronto Area. Our blog provides valuable information for buyers, 
            sellers, and investors in the GTA real estate market.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}