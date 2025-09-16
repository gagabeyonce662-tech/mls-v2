'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bed, Bath, Square, Calendar, Heart, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const featuredProperties = [
  {
    id: 1,
    title: "1179 Lloyd Landing Milton",
    address: "Hwy 25 & Louis St. Laurent Ave, Milton, ON, Canada",
    price: "$875,000",
    beds: 3,
    baths: 2.5,
    sqft: "1500-2000",
    type: "Townhomes",
    date: "1 month ago",
    status: ["For Sale", "Resale"],
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=592&h=444",
    featured: false
  },
  {
    id: 2,
    title: "9 Tarrison St, Brantford",
    address: "Brantford, Brantford, Ontario N3T 5L8, Canada",
    price: "$959,900",
    beds: 3,
    baths: 3,
    sqft: "2500-3000",
    type: "Detached Homes",
    date: "2 months ago",
    status: ["For Sale", "Resale"],
    image: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=592&h=444",
    featured: false
  },
  {
    id: 3,
    title: "Hansler Village By Marken, Welland",
    address: "Towpath Rd & Hansler Rd, Welland, ON, Canada",
    price: "$709,500",
    beds: 2,
    baths: 2,
    sqft: "1150 - 2455",
    type: "Pre Construction, Townhomes",
    date: "6 months ago",
    status: ["5% on Signing"],
    image: "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=592&h=444",
    featured: true
  }
];

export default function FeaturedListings() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProperties.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredProperties.length) % featuredProperties.length);
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
          FEATURED LISTINGS
        </h2>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={prevSlide}
              className="border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Prev
            </Button>
            <Button
              variant="outline"
              onClick={nextSlide}
              className="border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Property Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property, index) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-64 group">
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Featured Badge */}
                  {property.featured && (
                    <Badge className="absolute top-4 left-4 bg-green-600 text-white">
                      Featured
                    </Badge>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {property.status.map((status, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={`text-xs ${
                          status === 'For Sale' ? 'bg-blue-600 text-white' :
                          status === 'Resale' ? 'bg-purple-600 text-white' :
                          status === 'Sold Out' ? 'bg-red-600 text-white' :
                          'bg-orange-600 text-white'
                        }`}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" variant="secondary" className="bg-white bg-opacity-90">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white bg-opacity-90">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white bg-opacity-90">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Price Overlay */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
                    <span className="text-lg font-bold">{property.price}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link href={`/property/${property.id}`} className="hover:text-teal-700 transition-colors">
                      {property.title}
                    </Link>
                  </h3>
                  
                  <address className="text-gray-600 text-sm mb-4 not-italic">
                    {property.address}
                  </address>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" />
                      <span>Beds: {property.beds}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="w-4 h-4 mr-1" />
                      <span>Baths: {property.baths}</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="w-4 h-4 mr-1" />
                      <span>{property.sqft} Sq. Ft</span>
                    </div>
                  </div>

                  <div className="text-sm text-orange-600 mb-4">
                    {property.type}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button asChild className="bg-teal-700 hover:bg-teal-800">
                      <Link href={`/property/${property.id}`}>
                        Details
                      </Link>
                    </Button>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {property.date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}