"use client";

import React, { useState, useCallback, useRef } from 'react';
import { 
  Bed, 
  Bath, 
  Maximize, 
  Loader2, 
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { colors } from '@/config/design-system';
import { useInfiniteExclusiveProperties, usePrefetchProperty } from '@/lib/react-query';

export default function ListingsPage() {
  const router = useRouter();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  
  // Compare state
  const [compareList, setCompareList] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Auth state (replace with actual auth context)
  const isLoggedIn = false;

  // Get the prefetch function
  const prefetchProperty = usePrefetchProperty();

  // Use TanStack Query for infinite scroll
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteExclusiveProperties({
    city: currentCity || undefined,
    limit: 24,
  }, {
    enabled: true,
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.flatMap(page => page.results).length;
      return loadedItems < lastPage.count ? loadedItems : undefined;
    },
  });

  // Extract all properties from pages
  const allProperties = data?.pages.flatMap(page => page.results) || [];
  
  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setCurrentCity('');
    } else {
      setCurrentCity(searchTerm.trim());
    }
    // Reset and refetch with new filter
    refetch();
  }, [searchTerm, refetch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentCity('');
    refetch();
  }, [refetch]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Get property key
  const getPropertyKey = (property: any) => {
    return property.listing_key || property.PropertyKey || `property-${property.city || 'unknown'}-${property.ListPrice || '0'}`;
  };

  // Get image URL
  const getPropertyImageUrl = (property: any) => {
    try {
      if (Array.isArray(property.media) && property.media.length > 0) {
        const img = property.media.find((m: any) => {
          const url = (m.media_url || '').toString();
          return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
        }) || property.media[0];
        if (img?.media_url) return img.media_url;
      }

      if (Array.isArray(property.Photos) && property.Photos.length > 0) {
        const p = property.Photos[0];
        if (p.PhotoURL) return p.PhotoURL;
      }

      if (Array.isArray(property.Media) && property.Media.length > 0) {
        const m = property.Media.find((x: any) => x.media_url) || property.Media[0];
        if (m?.media_url) return m.media_url;
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  // Check if property is in compare list
  const isPropertySelected = (property: any) => {
    return compareList.some((p) => getPropertyKey(p) === getPropertyKey(property));
  };

  // Add property to compare
  const addPropertyToCompare = (property: any) => {
    setCompareList(prev => {
      if (prev.find(p => getPropertyKey(p) === getPropertyKey(property))) return prev;
      return [...prev, property];
    });
  };

  // Remove property from compare
  const removePropertyFromCompare = (property: any) => {
    setCompareList(prev => prev.filter(p => getPropertyKey(p) !== getPropertyKey(property)));
  };

  // Handle property click for compare/view selection
  const handlePropertyClick = (property: any) => {
    const alreadySelected = isPropertySelected(property);

    // If compare mode is active (items already selected)
    if (compareList.length > 0) {
      if (alreadySelected) {
        removePropertyFromCompare(property);
      } else {
        addPropertyToCompare(property);
      }
      return;
    }

    // If property is already selected (edge case)
    if (alreadySelected) {
      removePropertyFromCompare(property);
      return;
    }

    // Show modal to choose View or Compare
    setSelectedProperty(property);
    setShowCompareModal(true);
  };

  // Handle compare selection from modal
  const handleCompareSelect = () => {
    if (!selectedProperty) return;
    addPropertyToCompare(selectedProperty);
    setShowCompareModal(false);
    setSelectedProperty(null);
  };

  // Handle view from modal
  const handleViewFromModal = () => {
    if (!selectedProperty) return;
    setShowCompareModal(false);
    const key = getPropertyKey(selectedProperty);
    router.push(`/listing/${key}`);
    setSelectedProperty(null);
  };

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver>();
  const lastPropertyRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isFetchingNextPage) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Format price
  const formatPrice = (price: any) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed top-20 left-0 right-0 z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto">
              {compareList.map((property) => (
                <div
                  key={getPropertyKey(property)}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  <span className="truncate max-w-[120px]">
                    {property.city || property.City || "Property"}
                  </span>
                  <button
                    onClick={() => removePropertyFromCompare(property)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Link
              href={`/compare?ids=${compareList.map(p => getPropertyKey(p)).join(",")}`}
              className="ml-4 px-5 py-2 rounded-lg font-medium transition hover:bg-blue-700"
              style={{ backgroundColor: colors.primary, color: colors.cards }}
            >
              Compare ({compareList.length})
            </Link>
          </div>
        </div>
      )}
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {currentCity ? `Exclusive Properties in ${currentCity}` : 'All Exclusive Properties'}
            </h1>
            <p className="text-gray-600">
              {isLoading ? 'Loading...' : `${allProperties.length} properties found`}
              {hasNextPage && !isLoading && ' • Scroll to load more'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by city (e.g., Toronto, Vancouver, Ottawa)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                  disabled={isLoading}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                    disabled={isLoading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-4 rounded-xl transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              <span className="ml-3 text-gray-600">Loading properties...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                Error loading properties
              </div>
              <p className="text-gray-600 mb-4">
                Please try again later
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 rounded-lg transition-colors hover:bg-blue-700"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Properties Grid */}
          {!isLoading && allProperties.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProperties.map((property, index) => {
                  const propertyKey = getPropertyKey(property);
                  const isLastProperty = index === allProperties.length - 1;
                  const isLocked = !isLoggedIn && index >= 8;
                  const isSelected = isPropertySelected(property);
                  const imageUrl = getPropertyImageUrl(property);
                  const displayPrice = property.list_price || property.ListPrice || 0;
                  const displayCity = property.city || property.City || 'Unknown City';
                  const displayPropertyType = property.category_type || property.PropertySubType || 'Property';
                  const bedCount = property.bedrooms_total || property.BedroomsTotal || 0;
                  const bathCount = property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;
                  const status = property.standard_status || property.StandardStatus || 'Active';

                  return (
                    <div
                      key={propertyKey}
                      ref={isLastProperty ? lastPropertyRef : null}
                    >
                      {isLocked ? (
                        // Locked card
                        <div className="bg-white rounded-xl shadow-md overflow-hidden block relative">
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={`Property in ${displayCity}`}
                                className="w-full h-full object-cover filter blur-md scale-105"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-4">
                              <div className="text-center space-y-3">
                                <div className="text-white font-semibold">Login to view details</div>
                                <div className="mt-2 flex gap-3 justify-center">
                                  <Link href="/login" className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-gray-100">
                                    Login
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {displayPropertyType} in {displayCity}
                            </h3>
                            <p className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
                              {formatPrice(displayPrice)}
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
                        <div
                          onClick={() => handlePropertyClick(property)}
                          onMouseEnter={() => prefetchProperty(propertyKey)}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow block cursor-pointer"
                        >
                          <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                ✓
                              </div>
                            )}
                            
                            {/* Compare mode indicator */}
                            {compareList.length > 0 && !isSelected && (
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-5 pointer-events-none">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-white/90 flex items-center justify-center text-black text-sm font-semibold">
                                  +
                                </div>
                              </div>
                            )}

                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Property in ${displayCity}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <div className="text-sm font-medium">No image available</div>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {displayPropertyType} in {displayCity}
                            </h3>
                            <p className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
                              {formatPrice(displayPrice)}
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
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Loading More Indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: colors.primary }} />
                  <span className="text-gray-600">Loading more properties...</span>
                </div>
              )}

              {/* End of Results */}
              {!hasNextPage && allProperties.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {currentCity ? `Showing all properties in ${currentCity}` : 'You have reached the end of the results'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && allProperties.length === 0 && (
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
                  className="px-6 py-2 rounded-lg transition-colors hover:bg-blue-700"
                  style={{ backgroundColor: colors.primary, color: colors.cards }}
                >
                  Show All Properties
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compare/View Modal */}
      {showCompareModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-center">
              What would you like to do?
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {selectedProperty.category_type || selectedProperty.PropertySubType || 'Property'} in {selectedProperty.city || selectedProperty.City || 'Unknown City'}
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: colors.primary }}>
                {formatPrice(selectedProperty.list_price || selectedProperty.ListPrice)}
              </p>
            </div>

            <div className="flex gap-4 mb-4">
              {/* VIEW Button */}
              <button
                onClick={handleViewFromModal}
                className="flex-1 text-center py-3 rounded-xl font-medium transition"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                View Details
              </button>

              {/* COMPARE Button */}
              <button
                onClick={handleCompareSelect}
                className="flex-1 py-3 rounded-xl font-medium transition bg-gray-900 text-white hover:bg-black"
              >
                Add to Compare
              </button>
            </div>

            <button
              onClick={() => { setShowCompareModal(false); setSelectedProperty(null); }}
              className="w-full text-gray-500 hover:text-gray-700 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}