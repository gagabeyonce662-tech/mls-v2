"use client";

import React, { useState } from 'react';

interface PriceRange {
  low: string;
  max: string;
  high: string;
  fast: string;
}

interface Property {
  name: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: string;
}

interface Consultant {
  name: string;
  title: string;
}

const HomeValuation: React.FC = () => {
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  const priceRange: PriceRange = {
    low: '$757,000',
    max: '$807,000',
    high: '$905,600',
    fast: '$0.40M - $0.60M'
  };

  const properties: Property[] = [
    {
      name: 'Set All Vila',
      price: '$12,750,000',
      bedrooms: 4,
      bathrooms: 6,
      sqft: '3,800 sq ft.'
    },
    {
      name: 'Del Air Vila',
      price: '$13,750,000',
      bedrooms: 4,
      bathrooms: 6,
      sqft: '3,800 sq ft.'
    },
    {
      name: 'Del Air Vila',
      price: '$12,750,000',
      bedrooms: 4,
      bathrooms: 6,
      sqft: '3,800 sq ft.'
    }
  ];

  const consultants: Consultant[] = [
    {
      name: 'Leslie Alexander',
      title: 'Senior Consultant'
    },
    {
      name: 'Leslie Alexander',
      title: 'Senior Consultant'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({
      propertyAddress,
      phoneNumber,
      email,
      comment
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-700">
              LOGO<span className="text-red-500">IP</span>/UM
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#map" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                Map Search
              </a>
              <a href="#trends" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                Trends
              </a>
              <a href="#valuation" className="text-blue-700 font-medium border-b-2 border-blue-700 pb-1">
                Home Valuation
              </a>
              <a href="#agents" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                Agents
              </a>
              <a href="#tools" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
                Tools Watched
              </a>
            </nav>

            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-blue-700 text-blue-700 rounded-lg hover:bg-blue-700 hover:text-white transition-colors font-medium">
                Login
              </button>
              <button className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Home Valuation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your home's current market value with our AI-powered valuation tool
          </p>
        </section>

        {/* Search Section */}
        <section className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Home Details</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Please enter your property address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
              Search
            </button>
          </div>
        </section>

        {/* Price Range Section */}
        <section className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Estimated Value Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-700">
              <h3 className="text-sm text-gray-600 mb-2">Low Estimate</h3>
              <div className="text-2xl font-bold text-gray-900">{priceRange.low}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-700">
              <h3 className="text-sm text-gray-600 mb-2">Max Estimate</h3>
              <div className="text-2xl font-bold text-gray-900">{priceRange.max}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-700">
              <h3 className="text-sm text-gray-600 mb-2">High Estimate</h3>
              <div className="text-2xl font-bold text-gray-900">{priceRange.high}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-700">
              <h3 className="text-sm text-gray-600 mb-2">Fast Sale</h3>
              <div className="text-2xl font-bold text-gray-900">{priceRange.fast}</div>
            </div>
          </div>
        </section>

        {/* Properties Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Properties in Your Area</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
                  <div className="text-white text-2xl font-bold">{property.price}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{property.name}</h3>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                      </svg>
                      <span>{property.bedrooms} beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                      </svg>
                      <span>{property.bathrooms} baths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                      <span>{property.sqft}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Consultation Form */}
        <section className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Free Consultation</h2>
          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Please enter your property address"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <button
              type="submit"
              className="mt-6 px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium text-lg"
            >
              Get Free Consultation
            </button>
          </form>
        </section>

        {/* Consultants Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consultants.map((consultant, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{consultant.name}</h3>
                  <p className="text-gray-600">{consultant.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8">
          <div className="max-w-2xl">
            <div className="text-2xl font-bold text-blue-700 mb-4">
              LOGO<span className="text-red-500">IP</span>/UM
            </div>
            <p className="text-gray-600 leading-relaxed">
              PleaseSigns is a leading technology platform that utilizes artificial intelligence 
              technology to enhance the online business and improve its efficiency.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomeValuation;