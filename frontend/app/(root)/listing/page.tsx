"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Bed, 
  Bath, 
  Maximize, 
  Loader2, 
  Search,
  X,
  ChevronRight,
  Home
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
  
  // Loading and animation states
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadedCards, setLoadedCards] = useState<Set<string>>(new Set());
  const [clickedProperty, setClickedProperty] = useState<string | null>(null);
  
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
  });

  // Extract all properties from pages
  const allProperties = data?.pages.flatMap(page => page.results) || [];
  
  // Gradually load cards with staggered animation
  useEffect(() => {
    if (!isLoading && allProperties.length > 0) {
      // Load cards gradually
      const timer = setTimeout(() => {
        const propertyKeys = allProperties.map(property => getPropertyKey(property));
        
        propertyKeys.forEach((propertyKey, index) => {
          setTimeout(() => {
            setLoadedCards(prev => {
              const newSet = new Set(prev);
              newSet.add(propertyKey);
              return newSet;
            });
          }, 50 + (index * 50)); // Faster staggered delay for listings
        });
      }, 100); // Small delay before starting

      return () => clearTimeout(timer);
    }
  }, [allProperties, isLoading]);

  // Reset loaded cards when properties change
  useEffect(() => {
    if (currentCity || searchTerm) {
      setLoadedCards(new Set());
      setLoadedImages(new Set());
    }
  }, [currentCity, searchTerm]);

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
    setLoadedCards(new Set());
    setLoadedImages(new Set());
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
    return property.listing_key || property.PropertyKey || property.id || `property-${property.city || 'unknown'}-${property.ListPrice || '0'}`;
  };

// Get image URL - FIXED for your API structure
const getPropertyImageUrl = (property: any) => {
  try {
    console.log('Checking property for images:', property?.listing_key);
    console.log('Media field:', property?.media);
    console.log('Media field type:', typeof property?.media);
    
    // Check if media exists (it's an object, not an array)
    if (property?.media && typeof property.media === 'object') {
      console.log('Found media object:', property.media);
      
      // Get the media_url from the media object
      const mediaUrl = property.media.media_url;
      if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '') {
        console.log('Found image URL in media object:', mediaUrl);
        return mediaUrl.trim();
      }
    }
    
    // Fallback: Check other possible fields
    const fallbackFields = [
      property?.photo_url,
      property?.thumbnail_url,
      property?.image_url,
      property?.PhotoURL,
      property?.MediaURL,
    ].filter(Boolean);
    
    if (fallbackFields.length > 0) {
      const url = fallbackFields[0];
      if (typeof url === 'string' && url.trim() !== '') {
        console.log('Found image URL in fallback field:', url);
        return url.trim();
      }
    }
    
    console.log('No image URL found for property');
    return null;
    
  } catch (error) {
    console.error('Error in getPropertyImageUrl:', error);
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
    setClickedProperty(getPropertyKey(property));
    
    const alreadySelected = isPropertySelected(property);

    // If compare mode is active (items already selected)
    if (compareList.length > 0) {
      if (alreadySelected) {
        removePropertyFromCompare(property);
      } else {
        addPropertyToCompare(property);
      }
      setTimeout(() => setClickedProperty(null), 300);
      return;
    }

    // If property is already selected (edge case)
    if (alreadySelected) {
      removePropertyFromCompare(property);
      setTimeout(() => setClickedProperty(null), 300);
      return;
    }

    // Show modal to choose View or Compare
    setSelectedProperty(property);
    setShowCompareModal(true);
    setTimeout(() => setClickedProperty(null), 300);
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

  // Image load handler
  const handleImageLoad = (propertyKey: string) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(propertyKey);
      return newSet;
    });
  };

  // Image error handler
  const handleImageError = (propertyKey: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image failed to load for property ${propertyKey}`);
    handleImageLoad(propertyKey); // Mark as loaded anyway
    e.currentTarget.style.display = 'none'; // Hide broken image
  };

  // Check if card is loaded
  const isCardLoaded = (property: any) => {
    return loadedCards.has(getPropertyKey(property));
  };

  // Check if image is loaded
  const isImageLoaded = (propertyKey: string) => {
    return loadedImages.has(propertyKey);
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
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, "")) : price || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Render skeleton loading cards
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse min-h-[300px]"
      >
        {/* Image skeleton */}
        <div 
          className="h-48 w-full" 
          style={{ backgroundColor: colors.boarder }}
        />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="h-4 w-3/4 rounded" style={{ backgroundColor: colors.boarder }} />
          <div className="h-6 w-1/2 rounded" style={{ backgroundColor: colors.boarder }} />
          <div className="flex gap-4 mt-3">
            <div className="h-3 w-12 rounded" style={{ backgroundColor: colors.boarder }} />
            <div className="h-3 w-12 rounded" style={{ backgroundColor: colors.boarder }} />
            <div className="h-3 w-16 rounded" style={{ backgroundColor: colors.boarder }} />
          </div>
        </div>
      </div>
    ));
  };

  // Debug log to check data structure
  useEffect(() => {
    if (allProperties.length > 0) {
      console.log('First property data:', allProperties[0]);
      console.log('Image URL found:', getPropertyImageUrl(allProperties[0]));
    }
  }, [allProperties]);

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
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.heading }}>
              {currentCity ? `Exclusive Properties in ${currentCity}` : 'All Exclusive Properties'}
            </h1>
            <p style={{ color: colors.body }}>
              {isLoading ? 'Loading...' : `${allProperties.length} properties found`}
              {hasNextPage && !isLoading && ' • Scroll to load more'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: colors.body }} />
                <input
                  type="text"
                  placeholder="Search by city (e.g., Toronto, Vancouver, Ottawa)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 text-lg shadow-sm"
                  style={{ 
                    borderColor: colors.boarder,
                    color: colors.heading
                  }}
                  disabled={isLoading}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    style={{ color: colors.body }}
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
                className="px-6 py-4 rounded-xl transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
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

          {/* Loading State - Initial Load */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 relative mb-4">
                <Loader2 className="w-16 h-16 animate-spin" style={{ color: colors.primary }} />
              </div>
              <span style={{ color: colors.body }}>Loading properties...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold mb-2" style={{ color: colors.heading }}>
                Error loading properties
              </div>
              <p style={{ color: colors.body }} className="mb-4">
                Please try again later
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Show skeletons while loading OR show actual properties with lazy loading */}
            {isLoading ? (
              renderSkeletons()
            ) : allProperties.length > 0 ? (
              // Actual Property Cards with lazy loading
              allProperties.map((property, index) => {
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
                const cardLoaded = isCardLoaded(property);
                const imageLoaded = isImageLoaded(propertyKey);
                const isClicked = clickedProperty === propertyKey;

                return (
                  <div
                    key={propertyKey}
                    ref={isLastProperty ? lastPropertyRef : null}
                    className={`transition-all duration-300 ${
                      cardLoaded ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'
                    }`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animation: cardLoaded ? 'fadeInUp 0.3s ease-out forwards' : 'none'
                    }}
                  >
                    {isLocked ? (
                      // Locked card
                      <div className="bg-white rounded-xl shadow-md overflow-hidden block relative">
                        <div className="relative h-48 flex items-center justify-center overflow-hidden">
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
                                <Link href="/login" className="px-4 py-2 bg-white rounded-lg font-medium hover:bg-gray-100" style={{ color: colors.primary }}>
                                  Login
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-1 truncate" style={{ color: colors.heading }}>
                            {displayPropertyType} in {displayCity}
                          </h3>
                          <p className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
                            {formatPrice(displayPrice)}
                          </p>
                          <div className="flex items-center gap-4 text-sm" style={{ color: colors.body }}>
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
                      // Normal clickable card with lazy loading
                      <div
                        onClick={() => handlePropertyClick(property)}
                        onMouseEnter={() => prefetchProperty(propertyKey)}
                        className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all block cursor-pointer relative min-h-[300px] ${
                          isClicked ? 'pointer-events-none' : ''
                        }`}
                      >
                        {/* Click Loading Overlay */}
                        {isClicked && (
                          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
                              <span className="mt-2 text-sm" style={{ color: colors.body }}>
                                Loading...
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Image Section with Lazy Loading */}
                        <div className="relative h-48 flex items-center justify-center overflow-hidden" style={{ backgroundColor: colors.boarder }}>
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

                          {/* Image Loading State */}
                          {imageUrl && !imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.primary }} />
                            </div>
                          )}

                          {/* Blurred background placeholder - only if we have an image */}
                          {imageUrl && !imageLoaded && (
                            <div 
                              className="absolute inset-0 blur-sm opacity-30"
                              style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                          )}

                          {/* Actual Image - Lazy loads with fade-in */}
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`Property in ${displayCity}`}
                              className={`w-full h-full object-cover transition-opacity duration-700 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                              }`}
                              loading="lazy"
                              onLoad={() => handleImageLoad(propertyKey)}
                              onError={(e) => handleImageError(propertyKey, e)}
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${
                                cardLoaded ? 'opacity-100' : 'opacity-0'
                              }`}
                              style={{
                                color: colors.body,
                              }}
                            >
                              <Home className="w-12 h-12 mb-2 opacity-30" />
                              <div className="text-sm font-medium">No Image Available</div>
                              <div className="text-xs mt-1">{displayCity}</div>
                            </div>
                          )}
                        </div>

                        {/* Content Section with Lazy Loading */}
                        <div className="p-4">
                          {/* Title */}
                          <h3
                            className={`font-semibold mb-1 truncate transition-opacity duration-500 ${
                              cardLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ color: colors.heading }}
                          >
                            {displayPropertyType} in {displayCity}
                          </h3>

                          {/* Price */}
                          <p
                            className={`text-lg font-bold mb-3 transition-opacity duration-500 ${
                              cardLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ color: colors.primary }}
                          >
                            {formatPrice(displayPrice)}
                          </p>

                          {/* Features */}
                          <div
                            className={`flex items-center gap-4 text-sm transition-opacity duration-500 ${
                              cardLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ color: colors.body }}
                          >
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
                              <span className="text-xs">{property.StateOrProvince || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : null}
          </div>

          {/* Empty State */}
          {!isLoading && allProperties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold mb-2" style={{ color: colors.heading }}>
                {currentCity ? `No properties found in "${currentCity}"` : 'No properties available'}
              </div>
              <p style={{ color: colors.body }} className="mb-4">
                {currentCity ? 'Try searching for a different city' : 'Check back later for new exclusive properties'}
              </p>
              {currentCity && (
                <button
                  onClick={clearSearch}
                  className="px-6 py-2 rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: colors.primary, color: colors.cards }}
                >
                  Show All Properties
                </button>
              )}
            </div>
          )}

          {/* Loading More Indicator */}
          {isFetchingNextPage && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              </div>
              <span className="text-gray-600 mt-3">Loading more properties...</span>
            </div>
          )}

          {/* End of Results */}
          {!hasNextPage && allProperties.length > 0 && (
            <div className="text-center py-8">
              <p style={{ color: colors.body }}>
                {currentCity ? `Showing all ${allProperties.length} properties in ${currentCity}` : `You've reached the end - ${allProperties.length} properties loaded`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compare/View Modal */}
      {showCompareModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-center" style={{ color: colors.heading }}>
              What would you like to do?
            </h3>
            
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.boarder }}>
              <p className="font-medium" style={{ color: colors.heading }}>
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
                className="flex-1 text-center py-3 rounded-xl font-medium transition hover:opacity-90"
                style={{ backgroundColor: colors.primary, color: colors.cards }}
              >
                View Details
              </button>

              {/* COMPARE Button */}
              <button
                onClick={handleCompareSelect}
                className="flex-1 py-3 rounded-xl font-medium transition hover:opacity-90"
                style={{ backgroundColor: colors.heading, color: colors.cards }}
              >
                Add to Compare
              </button>
            </div>

            <button
              onClick={() => { setShowCompareModal(false); setSelectedProperty(null); }}
              className="w-full py-2" style={{ color: colors.body }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />

      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0.7;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}