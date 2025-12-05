"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Bed, 
  Bath, 
  Maximize, 
  Heart, 
  Loader2, 
  ArrowLeft, 
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  DollarSign,
  Home
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { colors } from '@/config/design-system';
import { fetchExclusiveProperties, type Property } from '@/lib/api';

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("All Exclusive Properties");
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  
  const province = searchParams.get('province');
  const city = searchParams.get('city');

  // Initialize filters from URL params
  useEffect(() => {
    if (province) {
      setCityFilter(province);
    } else if (city) {
      setCityFilter(city);
    }
  }, [province, city]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (cityFilter) params.set('city', cityFilter);
    if (priceRange.min) params.set('price_min', priceRange.min);
    if (priceRange.max) params.set('price_max', priceRange.max);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (bathrooms) params.set('bathrooms', bathrooms);
    if (propertyType !== 'all') params.set('property_type', propertyType);
    
    router.push(`/listings${params.toString() ? '?' + params.toString() : ''}`);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setBedrooms('');
    setBathrooms('');
    setPropertyType('all');
    setCityFilter('');
    router.push('/listings');
    setShowFilters(false);
  };

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      console.log('Loading all exclusive properties...');
      
      try {
        const filters: any = {};
        
        // Apply filters from URL
        if (province) {
          filters.province = province;
          setSearchQuery(`Exclusive Properties in ${province}`);
        } else if (city) {
          filters.city = city;
          setSearchQuery(`Exclusive Properties in ${city}`);
        } else if (cityFilter) {
          filters.city = cityFilter;
          setSearchQuery(`Exclusive Properties in ${cityFilter}`);
        } else {
          setSearchQuery("All Exclusive Properties");
        }
        
        // Apply other filters
        if (searchParams.get('price_min')) filters.price_min = searchParams.get('price_min');
        if (searchParams.get('price_max')) filters.price_max = searchParams.get('price_max');
        if (searchParams.get('bedrooms')) filters.bedrooms = searchParams.get('bedrooms');
        if (searchParams.get('bathrooms')) filters.bathrooms = searchParams.get('bathrooms');
        if (searchParams.get('property_type')) filters.property_type = searchParams.get('property_type');
        
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
        
        // Filter by search term if provided
        let filteredProperties = mappedProperties;
        if (searchTerm) {
          filteredProperties = mappedProperties.filter(property => 
            property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.unparsed_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.public_remarks?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setProperties(filteredProperties);
        console.log(`Loaded ${filteredProperties.length} properties`);
        
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [province, city, searchParams, cityFilter, searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(properties.map(p => p.city || p.City).filter(Boolean)));

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
                  {isLoading ? 'Loading properties...' : `Showing ${properties.length} properties`}
                </p>
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters && (
                  <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by city, address, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filter Properties
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear all filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    City
                  </label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                      className="w-1/2 border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                
                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    Bedrooms
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Any</option>
                    <option value="1">1+ Bedrooms</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                    <option value="5">5+ Bedrooms</option>
                  </select>
                </div>
                
                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    Bathrooms
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Any</option>
                    <option value="1">1+ Bathrooms</option>
                    <option value="2">2+ Bathrooms</option>
                    <option value="3">3+ Bathrooms</option>
                    <option value="4">4+ Bathrooms</option>
                  </select>
                </div>
                
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Types</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(province || city || searchTerm || priceRange.min || priceRange.max || bedrooms || bathrooms || propertyType !== 'all') && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {province && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Province: {province}
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('province');
                        router.push(`/listings${params.toString() ? '?' + params.toString() : ''}`);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {city && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    City: {city}
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('city');
                        router.push(`/listings${params.toString() ? '?' + params.toString() : ''}`);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {priceRange.min && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Min: ${priceRange.min}
                    <button
                      onClick={() => setPriceRange({...priceRange, min: ''})}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {priceRange.max && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Max: ${priceRange.max}
                    <button
                      onClick={() => setPriceRange({...priceRange, max: ''})}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {bedrooms && (
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {bedrooms}+ Beds
                    <button
                      onClick={() => setBedrooms('')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {bathrooms && (
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {bathrooms}+ Baths
                    <button
                      onClick={() => setBathrooms('')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {propertyType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    Type: {propertyType}
                    <button
                      onClick={() => setPropertyType('all')}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    Search: {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
              <span className="ml-3 text-gray-600">Loading properties...</span>
            </div>
          )}

          {/* Properties Grid */}
          {!isLoading && properties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property, index) => {
                const propertyKey = getPropertyKey(property);
                const displayPrice = property.list_price ? parseFloat(property.list_price) : property.ListPrice || 0;
                const displayCity = property.city || property.City || 'Unknown City';
                const displayPropertyType = property.category_type || property.PropertySubType || 'Property';
                const bedCount = property.bedrooms_total || property.BedroomsTotal || 0;
                const bathCount = property.bathrooms_total_integer || property.BathroomsTotalInteger || 0;
                const status = property.standard_status || property.StandardStatus || 'Active';
                
                return (
                  <Link
                    key={propertyKey}
                    href={`/listing/${propertyKey}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
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
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && properties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-xl font-semibold text-gray-900 mb-2">No properties found</div>
              <p className="text-gray-600">
                {searchTerm || province || city || priceRange.min || priceRange.max || bedrooms || bathrooms || propertyType !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'There are currently no exclusive properties available.'}
              </p>
              <button
                onClick={clearFilters}
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination - If your API supports it */}
          {!isLoading && properties.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg bg-blue-600 text-white">
                  1
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  2
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  3
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}