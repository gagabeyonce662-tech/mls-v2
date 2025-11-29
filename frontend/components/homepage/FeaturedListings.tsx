"use client";

import Link from "next/link";
import { Heart, Bed, Bath, Maximize } from "lucide-react";

export default function FeaturedListings() {
  const properties = [
    {
      id: 1,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
      status: "For Sale",
    },
    {
      id: 2,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
      status: "For Sale",
    },
    {
      id: 3,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
      status: "For Sale",
    },
    {
      id: 4,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
      status: "For Sale",
    },
    {
      id: 5,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
      status: "For Sale",
    },
    {
      id: 6,
      title: "Search Encanto Villa",
      price: "$2,750,000",
      beds: 3,
      baths: 4,
      sqft: "4,250 sq.ft",
      image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
      status: "For Sale",
    },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-ds-h2 text-ds-heading font-inter">Featured Properties</h2>
            <p className="text-ds-body-regular text-ds-body mt-2 font-inter">Explore our handpicked selection</p>
          </div>
          <button className="text-blue-900 hover:text-blue-800 font-medium flex items-center gap-2">
            View All
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/listing/${property.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-56">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {property.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-ds-h5 text-ds-heading mb-2 font-inter">
                  {property.title}
                </h3>
                <p className="text-ds-h4 text-ds-primary mb-4 font-inter">
                  {property.price}
                </p>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    <span>{property.beds}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{property.baths}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    <span>{property.sqft}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
