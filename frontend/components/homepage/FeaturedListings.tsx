"use client";

import Link from "next/link";
import { Heart, Bed, Bath, Maximize, Loader2, ChevronRight } from "lucide-react";
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

  // Helper function to get the correct property key for the link
  const getPropertyKey = (property: Property) => {
    const key = property.listing_key || property.PropertyKey || `property-${property.city}-${property.ListPrice}`;
    return key;
  };

  // Helper function to get price for display
  const getDisplayPrice = (property: Property) => {
    if (property.list_price) {
      return parseFloat(property.list_price);
    }
    return property.ListPrice || 0;
  };

  // Helper function to get city for display
  const getDisplayCity = (property: Property) => {
    return property.city || property.City || 'Unknown City';
  };

  // Helper function to get property type for display
  const getDisplayPropertyType = (property: Property) => {
    return property.category_type || property.PropertySubType || 'Property';
  };

  // Helper function to get bed count
  const getBedCount = (property: Property) => {
    return property.bedrooms_total || property.BedroomsTotal || 0;
  };

  // Helper function to get bath count
  const getBathCount = (property: Property) => {
    return property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;
  };

  // Helper function to get status
  const getStatus = (property: Property) => {
    return property.standard_status || property.StandardStatus || 'For Sale';
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with View All button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? `Properties in ${searchQuery}` : 'Featured Properties'}
            </h2>
            <p className="text-gray-600">
              {isLoading ? 'Finding properties...' : `${properties.length} properties found`}
            </p>
          </div>
          
          {/* View All button - only show when there are properties */}
          {!isLoading && properties.length > 0 && (
            <Link 
              href="/listing" 
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Properties
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            <span className="ml-3 text-gray-600">Loading properties...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && (
          <div className="text-center py-16">
            <div className="text-xl font-semibold text-gray-900 mb-2">No properties found</div>
            <p className="text-gray-600">
              Try searching for a different city or check your spelling.
            </p>
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property, index) => {
                const propertyKey = getPropertyKey(property);
                const displayPrice = getDisplayPrice(property);
                const displayCity = getDisplayCity(property);
                const displayPropertyType = getDisplayPropertyType(property);
                const bedCount = getBedCount(property);
                const bathCount = getBathCount(property);
                const status = getStatus(property);
                
                return (
                  <Link
                    key={propertyKey}
                    href={`/listing/${propertyKey}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-56">
                      <img
                        src={getPlaceholderImage(index)}
                        alt={`Property in ${displayCity}`}
                        className="w-full h-full object-cover"
                      />
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Toggle favorite for:', propertyKey);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart className="w-5 h-5 text-gray-700" />
                      </button>
                      <div className="absolute bottom-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status === 'Active' ? 'bg-green-500 text-white' :
                          status === 'Pending' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">
                        {displayPropertyType} in {displayCity}
                      </h3>
                      <p className="text-xl font-bold text-blue-600 mb-4">
                        {formatPrice(displayPrice)}
                      </p>
                      <div className="flex items-center gap-4 text-gray-600 text-sm">
                        {bedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{bedCount} {bedCount === 1 ? 'Bed' : 'Beds'}</span>
                          </div>
                        )}
                        {bathCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{bathCount} {bathCount === 1 ? 'Bath' : 'Baths'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4" />
                          <span className="text-xs">{property.StateOrProvince}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* View All button at bottom (mobile friendly) */}
            <div className="mt-8 text-center lg:hidden">
              <Link 
                href="/listing" 
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Properties ({properties.length})
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}