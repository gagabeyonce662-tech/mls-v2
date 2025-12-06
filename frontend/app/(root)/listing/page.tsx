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

  // AUTH: Replace this with your real auth state (context/hook).
  // For example: const { user } = useAuth(); const isLoggedIn = !!user;
  const isLoggedIn = false; // <-- toggle to true to test logged-in behavior

  // Return the first suitable image URL from the property (from backend). If none, return null.
  const getPropertyImageUrl = (property: Property | any) => {
    try {
      if (Array.isArray(property.media) && property.media.length > 0) {
        const img = property.media.find((m: any) => {
          const t = (m.media_type || '').toLowerCase();
          const url = (m.media_url || '').toString();
          return t.includes('image') || /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
        }) || property.media[0];
        if (img && (img.media_url || img.url || img.url_full)) return img.media_url || img.url || img.url_full;
      }

      if (Array.isArray(property.Photos) && property.Photos.length > 0) {
        const p = property.Photos[0];
        if (p.PhotoURL) return p.PhotoURL;
      }

      if (Array.isArray(property.Media) && property.Media.length > 0) {
        const m = property.Media.find((x: any) => x.media_url) || property.Media[0];
        if (m && m.media_url) return m.media_url;
      }

      if (property.listing_image_url) return property.listing_image_url;
      if (property.main_image) return property.main_image;

      return null;
    } catch (e) {
      return null;
    }
  };

  // Load properties - either all or filtered by city
  const loadProperties = useCallback(async (offset = 0, isInitialLoad = false, city = '') => {
    // If user not logged in and we're trying to load beyond first page, block further loads
    // (this prevents fetching infinite pages for unauthenticated users).
    if (!isLoggedIn && offset >= 24) {
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

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
      
      if (offset === 0) {
        setProperties(mappedProperties);
      } else {
        setProperties(prev => [...prev, ...mappedProperties]);
      }
      
      setCurrentOffset(offset + mappedProperties.length);

      // When not logged in, we limit hasMore to false after the first page to avoid further loads.
      if (!isLoggedIn) {
        setHasMore(false);
      } else {
        setHasMore(mappedProperties.length === 24);
      }
      
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
  }, [isLoggedIn]);

  // Initial load - show all properties
  useEffect(() => {
    setCurrentOffset(0);
    loadProperties(0, true, '');
  }, [loadProperties]);

  // Handle search button click
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setCurrentOffset(0);
      setCurrentCity('');
      setSearchQuery("All Exclusive Properties");
      loadProperties(0, true, '');
    } else {
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
    // prevent loading more if user is not logged in (we already limited loadProperties but guard here as well)
    if (!isLoggedIn) return;
    
    loadProperties(currentOffset, false, currentCity);
  }, [currentOffset, currentCity, hasMore, isLoadingMore, loadProperties, isLoggedIn]);

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
              {['Toronto','Vancouver','Ottawa','Montreal','Calgary'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSearchTerm(city);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  disabled={isSearching}
                  className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {city}
                </button>
              ))}
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
                  const imageUrl = getPropertyImageUrl(property);

                  // locked view: after the first 8 items, show blurred photo + CTA when NOT logged in
                  const locked = !isLoggedIn && index >= 8;

                  return (
                    <div
                      key={propertyKey}
                      ref={isLastProperty ? lastPropertyRef : null}
                    >
                      {locked ? (
                        // Locked card (not clickable)
                        <div className="bg-white rounded-xl shadow-md overflow-hidden block relative">
                          {/* Image container */}
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Property in ${displayCity}`}
                                className="w-full h-full object-cover filter blur-md scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '';
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 filter blur-md">
                                <div className="text-sm font-medium">No image found</div>
                              </div>
                            )}

                            {/* translucent overlay to dim the blurred image and hold CTA */}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
                              <div className="text-center space-y-3 pointer-events-none">
                              
                                {/* Buttons - allow pointer events only for buttons */}
                                <div className="mt-2 flex gap-3 justify-center pointer-events-auto">
                                  <Link href="/login" className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-gray-100">
                                    Login
                                  </Link>
                                
                                </div>
                              </div>
                            </div>

                            {/* Favorite icon still visible but disabled */}
                            <div className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                              <Heart className="w-5 h-5 text-gray-700 opacity-60" />
                            </div>

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

                          {/* Card body (small preview, read-only) */}
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
                        </div>
                      ) : (
                        // Normal clickable card
                        <Link
                          href={`/listing/${propertyKey}`}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow block"
                        >
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Property in ${displayCity}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '';
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.querySelectorAll('.no-image-fallback').forEach(el => (el as HTMLElement).style.display = 'flex');
                                  }
                                }}
                              />
                            ) : (
                              <div className="no-image-fallback w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <div className="text-sm font-medium">No image found</div>
                              </div>
                            )}

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
                      )}
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
                    {currentCity ? `Showing all properties in ${currentCity}` : (isLoggedIn ? 'You have reached the end of the results' : 'Login to see more listings')}
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
