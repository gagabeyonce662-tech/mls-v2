'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            About Us
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Learn more about Gunneet Singh and Estate-4u. We are dedicated to providing 
            exceptional real estate services in the Greater Toronto Area, helping clients 
            buy, sell, and invest in properties with expert guidance and personalized solutions.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}