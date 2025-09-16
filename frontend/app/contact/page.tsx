'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Get in touch with Gunneet Singh and the Estate-4u team. We're here to help 
            with all your real estate needs in the Greater Toronto Area. Contact us today 
            for expert guidance on buying, selling, or investing in properties.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}