"use client";

import Link from "next/link";
import { Heart, Bed, Bath, Maximize, Loader2 } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface FeaturedListingsProps {
  properties: Property[];
  isLoading: boolean;
  searchQuery: string;
}

export default function FeaturedListings({ properties, isLoading, searchQuery }: FeaturedListingsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPlaceholderImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
    ];
    return images[index % images.length];
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-ds-h3 text-ds-heading font-inter mb-2">
              {isLoading ? 'Searching...' : `Properties in ${searchQuery}`}
            </h2>
            <p className="text-ds-body-regular text-ds-body font-inter">
              {isLoading ? 'Finding properties...' : `${properties.length} properties found`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <span className="ml-3 text-ds-body-regular" style={{ color: colors.body }}>
              Loading properties...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="text-ds-h4 text-ds-heading mb-2 font-inter">No properties found</div>
            <p className="text-ds-body-regular text-ds-body font-inter">
              Try searching for a different city or check your spelling.
            </p>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 6).map((property, index) => (
              <Link
                key={property.PropertyKey || property.ListingKey || index}
                href={`/listing/${property.PropertyKey || property.ListingKey}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-56">
                  <img
                    src={getPlaceholderImage(index)}
                    alt={`Property in ${property.City}`}
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
                      {property.StandardStatus || 'For Sale'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-ds-h5 text-ds-heading mb-2 font-inter truncate">
                    {property.PropertySubType} in {property.City}
                  </h3>
                  <p className="text-ds-h4 text-ds-primary mb-4 font-inter">
                    {formatPrice(property.ListPrice)}
                  </p>
                  <div className="flex items-center gap-4 text-gray-600 text-sm">
                    {property.BedroomsTotal && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span>{property.BedroomsTotal}</span>
                      </div>
                    )}
                    {property.BathroomsTotalInteger && (
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        <span>{property.BathroomsTotalInteger}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span className="text-xs">{property.StateOrProvince}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
