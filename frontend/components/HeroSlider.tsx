'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bed, Bath, Square, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const properties = [
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
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
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
    image: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
  },
  {
    id: 3,
    title: "3366 Mikalda Rd, Burlington",
    address: "Burlington, Halton, Ontario L7M 0K9, Canada",
    price: "$944,900",
    beds: "3+1",
    baths: 4,
    sqft: "1100-1500",
    type: "Townhomes",
    date: "2 months ago",
    image: "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % properties.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % properties.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + properties.length) % properties.length);
  };

  return (
    <section className="relative h-[600px] overflow-hidden">
      {properties.map((property, index) => (
        <div
          key={property.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative h-full">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            
            {/* Property Info */}
            <div className="absolute top-1/2 left-8 lg:left-20 transform -translate-y-1/2 text-white max-w-lg">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                <Link href={`/property/${property.id}`} className="hover:text-orange-400 transition-colors">
                  {property.title}
                </Link>
              </h2>
              <address className="text-lg mb-4 not-italic opacity-90">
                {property.address}
              </address>
              <div className="text-2xl font-bold text-orange-400 mb-6">
                {property.price}
              </div>
              
              {/* Amenities */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
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
                <div className="text-orange-400">
                  {property.type}
                </div>
              </div>

              <div className="flex items-center text-sm opacity-75 mb-6">
                <Calendar className="w-4 h-4 mr-1" />
                {property.date}
              </div>

              <Button asChild className="bg-teal-700 hover:bg-teal-800">
                <Link href={`/property/${property.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-teal-700 border-teal-700 text-white hover:bg-teal-800"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-teal-700 border-teal-700 text-white hover:bg-teal-800"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {properties.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}