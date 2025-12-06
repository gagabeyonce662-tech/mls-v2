"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bed, 
  Bath, 
  Maximize, 
  Heart, 
  Loader2, 
  ArrowLeft, 
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { colors } from '@/config/design-system';
import { fetchExclusiveProperties, type Property } from '@/lib/api';

export default function ListingsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("All Exclusive Properties");
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPropertyRef = useRef<HTMLDivElement | null>(null);
  
  // Simple search state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCity, setCurrentCity] = useState('');

  // Load properties - either all or filtered by city
  const loadProperties = useCallback(async (offset = 0, isInitialLoad = false, city = '') => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    console.log(`Loading properties with offset: ${offset}, city: ${city || 'all'}`);
    
    try {
      const filters: any = {
        limit: 24,
        offset: offset
      };
      
      // Add city filter if provided
      if (city) {
        filters.city = city;
        setCurrentCity(city);
        setSearchQuery(`Exclusive Properties in ${city}`);
      } else {
        setCurrentCity('');
        setSearchQuery("All Exclusive Properties");
      }
      
      console.log('Fetching with filters:', filters);
      
      const response = await fetchExclusiveProperties(filters);
      
      // Map the API results to Property interface
      const mappedProperties: Property[] = (response.results || []).map((prop: any) => ({
        PropertyKey: prop.listing_key || '',
        ListingKey: prop.listing_key || '',
        list_price: prop.list_price,
        listing_key: prop.listing_key,
        ListPrice: prop.list_price ? parseFloat(prop.list_price) : 0,
        City: prop.city || '',
        city: prop.city,
        StateOrProvince: prop.StateOrProvince || 'ON',
        PropertySubType: prop.category_type || 'Exclusive',
        BedroomsTotal: prop.bedrooms_total || 0,
        bedrooms_total: prop.bedrooms_total,
        BathroomsTotalInteger: prop.bathrooms_total_integer || 0,
        bathrooms_total_integer: prop.bathrooms_total_integer,
        StandardStatus: prop.standard_status || 'Active',
        standard_status: prop.standard_status,
        ModificationTimestamp: prop.ModificationTimestamp || new Date().toISOString(),
        unparsed_address: prop.unparsed_address,
        postal_code: prop.postal_code,
        latitude: prop.latitude,
        longitude: prop.longitude,
        public_remarks: prop.public_remarks,
        media: prop.media,
        rooms: prop.rooms,
        category_type: prop.category_type,
        photos_count: prop.photos_count,
        listing_url: prop.listing_url,
        building_area_total: prop.building_area_total,
        year_built: prop.year_built,
        
        // Legacy fields
        Photos: prop.media?.map((m: any) => ({ PhotoURL: m.media_url })) || [],
        Media: prop.media,
        Rooms: prop.rooms,
        LivingArea: prop.building_area_total ? parseFloat(prop.building_area_total) : null,
        YearBuilt: prop.year_built ? parseInt(prop.year_built) : null,
        PublicRemarks: prop.public_remarks,
        PostalCode: prop.postal_code,
        Latitude: prop.latitude,
        Longitude: prop.longitude,
        Description: prop.public_remarks,
        PropertyType: prop.category_type || 'Exclusive',
      }));
      
      // Update properties
      if (offset === 0) {
        setProperties(mappedProperties);
      } else {
        setProperties(prev => [...prev, ...mappedProperties]);
      }
      
      // Update offset and hasMore
      setCurrentOffset(offset + mappedProperties.length);
      setHasMore(mappedProperties.length === 24);
      
      console.log(`Loaded ${mappedProperties.length} properties`);
      
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      setIsSearching(false);
    }
  }, []);

  // Initial load - show all properties
  useEffect(() => {
    setCurrentOffset(0);
    loadProperties(0, true, '');
  }, [loadProperties]);

  // Handle search button click
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search is empty, load all properties
      setCurrentOffset(0);
      setCurrentCity('');
      setSearchQuery("All Exclusive Properties");
      loadProperties(0, true, '');
    } else {
      // Search for the city
      setIsSearching(true);
      setCurrentOffset(0);
      loadProperties(0, true, searchTerm.trim());
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search and show all properties
  const clearSearch = () => {
    setSearchTerm('');
    setCurrentCity('');
    setSearchQuery("All Exclusive Properties");
    setCurrentOffset(0);
    loadProperties(0, true, '');
  };

  // Load more properties (infinite scroll)
  const loadMoreProperties = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    loadProperties(currentOffset, false, currentCity);
  }, [currentOffset, currentCity, hasMore, isLoadingMore, loadProperties]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !isSearching) {
          loadMoreProperties();
        }
      },
      { threshold: 0.1 }
    );

    if (lastPropertyRef.current) {
      observer.observe(lastPropertyRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, isSearching, loadMoreProperties]);

  const getPropertyKey = (property: Property) => {
    return property.listing_key || property.PropertyKey || `property-${property.city}-${property.ListPrice}`;
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
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  href="/" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{searchQuery}</h1>
                <p className="text-gray-600 mt-2">
                  {isLoading || isSearching ? 'Loading properties...' : `Showing ${properties.length} properties`}
                  {hasMore && !isLoading && !isSearching && properties.length > 0 && ' • Scroll to load more'}
                </p>
              </div>
            </div>
          </div>

          {/* Simple Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by city (e.g., Toronto, Vancouver, Ottawa)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                  disabled={isSearching}
                />
                
                {/* Clear button when there's text */}
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                    disabled={isSearching}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </button>
            </div>
            
            {/* Quick Search Examples */}
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  setSearchTerm('Toronto');
                  setTimeout(() => handleSearch(), 100);
                }}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Toronto
              </button>
              <button
                onClick={() => {
                  setSearchTerm('Vancouver');
                  setTimeout(() => handleSearch(), 100);
                }}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Vancouver
              </button>
              <button
                onClick={() => {
                  setSearchTerm('Ottawa');
                  setTimeout(() => handleSearch(), 100);
                }}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Ottawa
              </button>
              <button
                onClick={() => {
                  setSearchTerm('Montreal');
                  setTimeout(() => handleSearch(), 100);
                }}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Montreal
              </button>
              <button
                onClick={() => {
                  setSearchTerm('Calgary');
                  setTimeout(() => handleSearch(), 100);
                }}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Calgary
              </button>
              <button
                onClick={clearSearch}
                disabled={isSearching}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Show All
              </button>
            </div>
          </div>

          {/* Loading State */}
          {(isLoading || isSearching) && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              <span className="ml-3 text-gray-600">
                {isSearching ? 'Searching properties...' : 'Loading properties...'}
              </span>
            </div>
          )}

          {/* Properties Grid */}
          {!isLoading && !isSearching && properties.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property, index) => {
                  const propertyKey = getPropertyKey(property);
                  const displayPrice = property.list_price ? parseFloat(property.list_price) : property.ListPrice || 0;
                  const displayCity = property.city || property.City || 'Unknown City';
                  const displayPropertyType = property.category_type || property.PropertySubType || 'Property';
                  const bedCount = property.bedrooms_total || property.BedroomsTotal || 0;
                  const bathCount = property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;
                  const status = property.standard_status || property.StandardStatus || 'Active';
                  
                  const isLastProperty = index === properties.length - 1;
                  
                  return (
                    <div
                      key={propertyKey}
                      ref={isLastProperty ? lastPropertyRef : null}
                    >
                      <Link
                        href={`/listing/${propertyKey}`}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow block"
                      >
                        <div className="relative h-48">
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
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate">
                            {displayPropertyType} in {displayCity}
                          </h3>
                          <p className="text-lg font-bold text-blue-600 mb-3">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(displayPrice)}
                          </p>
                          <div className="flex items-center gap-4 text-gray-600 text-sm">
                            {bedCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span>{bedCount}</span>
                              </div>
                            )}
                            {bathCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath className="w-4 h-4" />
                                <span>{bathCount}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Maximize className="w-4 h-4" />
                              <span className="text-xs">{property.StateOrProvince}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: colors.primary }} />
                  <span className="text-gray-600">Loading more properties...</span>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && !isLoadingMore && properties.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {currentCity ? `Showing all properties in ${currentCity}` : 'You have reached the end of the results'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !isSearching && properties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                {currentCity ? `No properties found in "${currentCity}"` : 'No properties available'}
              </div>
              <p className="text-gray-600 mb-4">
                {currentCity ? 'Try searching for a different city' : 'Check back later for new exclusive properties'}
              </p>
              {currentCity && (
                <button
                  onClick={clearSearch}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show All Properties
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}