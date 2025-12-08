"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { colors } from "@/config/design-system";
import { type Property } from "@/lib/api";

interface HeroSectionProps {
  onSearchStart: () => void;
  onSearchResults: (properties: Property[], query: string) => void;
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// New function specifically for the /filter/ endpoint with search parameter
async function fetchPropertiesBySearch(searchQuery: string, filters?: any): Promise<Property[]> {
  try {
    console.log('Searching properties with query:', searchQuery);
    
    const queryParams = new URLSearchParams();
    queryParams.append('search', searchQuery);
    
    // Add any additional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/mls/properties/filter/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching from search endpoint:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Search API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to search properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Search response data:', data);
    
    // Map the API response to Property interface
    return (data.results || data.value || []).map((prop: any) => ({
      PropertyKey: prop.listing_key || prop.PropertyKey || '',
      ListingKey: prop.listing_key || prop.ListingKey || '',
      list_price: prop.list_price || prop.ListPrice?.toString(),
      listing_key: prop.listing_key,
      ListPrice: prop.list_price ? parseFloat(prop.list_price) : prop.ListPrice || "Price Not Available",
      City: prop.city || prop.City || '',
      city: prop.city,
      StateOrProvince: prop.StateOrProvince || prop.state_or_province || 'ON',
      PropertySubType: prop.category_type || prop.PropertySubType || 'Residential',
      BedroomsTotal: prop.bedrooms_total || prop.BedroomsTotal || 0,
      bedrooms_total: prop.bedrooms_total,
      BathroomsTotalInteger: prop.bathrooms_total_integer || prop.BathroomsTotalInteger || 0,
      bathrooms_total_integer: prop.bathrooms_total_integer,
      StandardStatus: prop.standard_status || prop.StandardStatus || 'Active',
      standard_status: prop.standard_status,
      ModificationTimestamp: prop.ModificationTimestamp || prop.modification_timestamp || new Date().toISOString(),
      unparsed_address: prop.unparsed_address || prop.UnparsedAddress,
      postal_code: prop.postal_code || prop.PostalCode,
      latitude: prop.latitude || prop.Latitude,
      longitude: prop.longitude || prop.Longitude,
      public_remarks: prop.public_remarks || prop.PublicRemarks,
      media: prop.media || prop.Media || [],
      rooms: prop.rooms || prop.Rooms || [],
      category_type: prop.category_type || prop.PropertyType,
      photos_count: prop.photos_count || prop.Photos?.length || 0,
      listing_url: prop.listing_url,
      building_area_total: prop.building_area_total || prop.LivingArea?.toString(),
      year_built: prop.year_built || prop.YearBuilt?.toString(),
      
      // Legacy fields for backward compatibility
      Photos: prop.media?.map((m: any) => ({ PhotoURL: m.media_url })) || prop.Photos || [],
      Media: prop.media || prop.Media,
      Rooms: prop.rooms || prop.Rooms,
      LivingArea: prop.building_area_total ? parseFloat(prop.building_area_total) : prop.LivingArea || null,
      YearBuilt: prop.year_built ? parseInt(prop.year_built) : prop.YearBuilt || null,
      PublicRemarks: prop.public_remarks || prop.PublicRemarks,
      PostalCode: prop.postal_code || prop.PostalCode,
      Latitude: prop.latitude || prop.Latitude,
      Longitude: prop.longitude || prop.Longitude,
      Description: prop.public_remarks || prop.PublicRemarks || prop.Description,
      PropertyType: prop.category_type || prop.PropertyType || 'Residential',
      
      // Add all other properties from the response
      ...prop
    }));
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

// Function to get all properties (for clear search)
async function fetchAllProperties(): Promise<Property[]> {
  try {
    console.log('Fetching all properties');
    
    // Try the /filter/ endpoint without search parameter to get all properties
    const url = `${API_BASE_URL}/api/mls/properties/filter/`;
    console.log('Fetching all from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('All properties response:', data);
    
    // Map the API response to Property interface
    return (data.results || data.value || []).map((prop: any) => ({
      PropertyKey: prop.listing_key || prop.PropertyKey || '',
      ListingKey: prop.listing_key || prop.ListingKey || '',
      list_price: prop.list_price || prop.ListPrice?.toString(),
      listing_key: prop.listing_key,
      ListPrice: prop.list_price ? parseFloat(prop.list_price) : prop.ListPrice || "Price Not Available",
      City: prop.city || prop.City || '',
      city: prop.city,
      StateOrProvince: prop.StateOrProvince || prop.state_or_province || 'ON',
      PropertySubType: prop.category_type || prop.PropertySubType || 'Residential',
      BedroomsTotal: prop.bedrooms_total || prop.BedroomsTotal || 0,
      bedrooms_total: prop.bedrooms_total,
      BathroomsTotalInteger: prop.bathrooms_total_integer || prop.BathroomsTotalInteger || 0,
      bathrooms_total_integer: prop.bathrooms_total_integer,
      StandardStatus: prop.standard_status || prop.StandardStatus || 'Active',
      standard_status: prop.standard_status,
      ModificationTimestamp: prop.ModificationTimestamp || prop.modification_timestamp || new Date().toISOString(),
      unparsed_address: prop.unparsed_address || prop.UnparsedAddress,
      postal_code: prop.postal_code || prop.PostalCode,
      latitude: prop.latitude || prop.Latitude,
      longitude: prop.longitude || prop.Longitude,
      public_remarks: prop.public_remarks || prop.PublicRemarks,
      media: prop.media || prop.Media || [],
      rooms: prop.rooms || prop.Rooms || [],
      category_type: prop.category_type || prop.PropertyType,
      photos_count: prop.photos_count || prop.Photos?.length || 0,
      listing_url: prop.listing_url,
      building_area_total: prop.building_area_total || prop.LivingArea?.toString(),
      year_built: prop.year_built || prop.YearBuilt?.toString(),
      
      // Legacy fields for backward compatibility
      Photos: prop.media?.map((m: any) => ({ PhotoURL: m.media_url })) || prop.Photos || [],
      Media: prop.media || prop.Media,
      Rooms: prop.rooms || prop.Rooms,
      LivingArea: prop.building_area_total ? parseFloat(prop.building_area_total) : prop.LivingArea || null,
      YearBuilt: prop.year_built ? parseInt(prop.year_built) : prop.YearBuilt || null,
      PublicRemarks: prop.public_remarks || prop.PublicRemarks,
      PostalCode: prop.postal_code || prop.PostalCode,
      Latitude: prop.latitude || prop.Latitude,
      Longitude: prop.longitude || prop.Longitude,
      Description: prop.public_remarks || prop.PublicRemarks || prop.Description,
      PropertyType: prop.category_type || prop.PropertyType || 'Residential',
      
      // Add all other properties from the response
      ...prop
    }));
  } catch (error) {
    console.error('Error fetching all properties:', error);
    return [];
  }
}

export default function HeroSection({ onSearchStart, onSearchResults }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Buy");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    onSearchStart(); // Notify parent that search is starting
    
    try {
      const query = searchQuery.trim();
      
      console.log('Homepage search initiated:', { query, searchType });
      
      // If no search query, clear search
      if (!query) {
        console.log('Clearing search');
        onSearchResults([], ""); // Clear search results
        return;
      }

      console.log('Searching for:', query);
      
      // Use the search endpoint with the query
      const properties = await fetchPropertiesBySearch(query);
      
      console.log('Found properties:', properties.length);
      
      // Create display query
      const displayQuery = query;
      
      // Pass results to parent
      onSearchResults(properties, displayQuery);
      
      if (properties.length === 0) {
        setError(`No properties found matching "${query}". Try a different search term.`);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      setError('Search failed. Please try again.');
      onSearchResults([], ""); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if query is a province (for quick search)
  const isProvince = (query: string): boolean => {
    const provinces = [
      'Ontario', 'Quebec', 'British Columbia', 'BC', 
      'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia',
      'New Brunswick', 'Newfoundland', 'Prince Edward Island',
      'PEI', 'Northwest Territories', 'Nunavut', 'Yukon',
      'ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT'
    ];
    
    const cleanQuery = query.trim();
    return provinces.includes(cleanQuery) || provinces.includes(cleanQuery.toUpperCase());
  };

  // Helper function to get province name from code (for display)
  const getProvinceName = (code: string): string => {
    const provinceMap: { [key: string]: string } = {
      'ON': 'Ontario',
      'QC': 'Quebec',
      'BC': 'British Columbia',
      'AB': 'Alberta',
      'MB': 'Manitoba',
      'SK': 'Saskatchewan',
      'NS': 'Nova Scotia',
      'NB': 'New Brunswick',
      'NL': 'Newfoundland and Labrador',
      'PE': 'Prince Edward Island',
      'NT': 'Northwest Territories',
      'NU': 'Nunavut',
      'YT': 'Yukon'
    };
    
    const cleanCode = code.trim().toUpperCase();
    return provinceMap[cleanCode] || code;
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search and show all properties
  const handleClearSearch = () => {
    setSearchQuery("");
    setError("");
    onSearchResults([], ""); // Clear search results
  };

  // Handle quick search button clicks
  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    // Small delay to ensure state updates before search
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  return (
    <section
      className="relative w-full bg-cover bg-center border-t border-b"
      style={{
        borderColor: colors.boarder,
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')",
      }}
    >
      {/* top navbar (minimal to match design) */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 rounded-md flex items-center justify-center shadow-sm">
                  <span className="font-bold" style={{ color: colors.primary }}>CR</span>
                </div>
                <span className="hidden md:inline font-semibold text-white drop-shadow">LOGOIPSUM</span>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
                <a className="hover:underline" href="#">Map Search</a>
                <a className="hover:underline" href="#">Trends</a>
                <a className="hover:underline" href="#">Home Valuation</a>
                <a className="hover:underline" href="#">Agents</a>
                <a className="hover:underline" href="#">Tools</a>
                <a className="hover:underline" href="#">Watched</a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden md:inline px-3 py-1 rounded bg-white/90 font-medium" style={{ color: colors.primary }}>Login</button>
              <button className="px-3 py-2 rounded font-medium shadow" style={{ backgroundColor: colors.primary, color: colors.cards }}>Get Started</button>
            </div>
          </div>
        </div>
      </header>

      {/* dark overlay + subtle gradient to better match screenshot */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-white/20 mix-blend-lighten"></div>
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent"></div>
      </div>

      {/* main content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-28 lg:py-32">
        <div className="max-w-3xl text-white/95">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow">
            Find Your Place
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-xl">
            Watch listings, communities and custom areas. Stay informed when listings are added and sold.
          </p>

          {/* Search box centered and overlapping the hero like the design */}
          <div className="mt-8">
            <div className="mx-auto mt-6 max-w-4xl">
              <div
                className="flex items-stretch rounded-full shadow-xl overflow-hidden ring-1 ring-black/5"
                style={{ backgroundColor: colors.cards }}
              >
                <label htmlFor="search" className="sr-only">Search</label>

                <div className="flex-1 flex items-center gap-4 px-5">
                  <Search className="w-5 h-5 flex-shrink-0" style={{ color: colors.body }} />
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by city, postal code, province, address, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full py-4 focus:outline-none bg-transparent"
                    style={{ color: colors.heading }}
                    disabled={isLoading}
                  />
                  
                  {/* Clear button when there's text */}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="text-sm text-gray-500 hover:text-gray-700 px-2"
                      type="button"
                      disabled={isLoading}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center border-l px-3" style={{ borderColor: colors.boarder }}>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="appearance-none bg-transparent text-sm py-3 pr-6 pl-2 focus:outline-none cursor-pointer"
                    style={{ color: colors.heading }}
                    aria-label="Search Type"
                    disabled={isLoading}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Rent">Rent</option>
                    <option value="Sell">Sell</option>
                  </select>
                  <ChevronDown className="w-4 h-4 -ml-2 pointer-events-none" style={{ color: colors.body }} />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-8 py-3 font-medium rounded-r-full flex items-center gap-3 shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.icon, color: colors.cards }}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              {/* Quick search examples */}
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={() => handleQuickSearch("Toronto")}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  Toronto
                </button>
                <span className="text-white/60">•</span>
                <button 
                  onClick={() => handleQuickSearch("Vancouver")}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  Vancouver
                </button>
                <span className="text-white/60">•</span>
                <button 
                  onClick={() => handleQuickSearch("M5V 2T6")}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  M5V 2T6
                </button>
                <span className="text-white/60">•</span>
                <button 
                  onClick={() => handleQuickSearch("Ontario")}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  Ontario
                </button>
                <span className="text-white/60">•</span>
                <button 
                  onClick={() => handleQuickSearch("Brantford")}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  Brantford
                </button>
                <span className="text-white/60">•</span>
                <button 
                  onClick={handleClearSearch}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  View All Properties
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* spacing at bottom so hero feels like the screenshot */}
      <div className="h-8 md:h-12 lg:h-16" />
    </section>
  );
}