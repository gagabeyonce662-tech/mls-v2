"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { colors } from "@/config/design-system";
import { fetchExclusiveProperties, type Property } from "@/lib/api";

interface HeroSectionProps {
  onPropertiesUpdate: (properties: Property[], query: string) => void;
}

export default function HeroSection({ onPropertiesUpdate }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Buy");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    try {
      const query = searchQuery.trim();
      
      console.log('Homepage search initiated:', { query, searchType });
      
      // If no search query, clear search and show all properties
      if (!query) {
        console.log('Clearing search - showing all properties');
        const response = await fetchExclusiveProperties({});
        const properties = mapApiResponseToProperties(response);
        onPropertiesUpdate(properties, "Exclusive Properties");
        return;
      }

      // Create filters object
      const filters: any = {};
      
      // Clean query (remove extra spaces, handle case)
      const cleanQuery = query.toUpperCase().trim();
      
      // Check if it's a postal code (Canadian format: A1A 1A1)
      const postalCodeRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
      const cleanPostalCode = cleanQuery.replace(/\s/g, '');
      
      if (postalCodeRegex.test(cleanPostalCode)) {
        filters.postal_code = cleanPostalCode;
        console.log('Searching by postal code:', cleanPostalCode);
      } 
      // Check if it's a city name (contains only letters, spaces, and hyphens)
      else if (/^[A-Z\s\-]+$/i.test(query)) {
        filters.city = query;
        console.log('Searching by city:', query);
      }
      // Check if it's a province (common province names)
      else if (isProvince(query)) {
        filters.province = getProvinceCode(query);
        console.log('Searching by province:', query, '->', getProvinceCode(query));
      }
      // Check if it's a number (might be price or part of address)
      else if (/^\d+$/.test(query.replace(/[,\$]/g, ''))) {
        // Could be a price search - check if it's a reasonable price range
        const price = parseInt(query.replace(/[,\$]/g, ''));
        if (price > 10000 && price < 10000000) { // Reasonable price range for properties
          filters.price_min = Math.max(price - 100000, 0);
          filters.price_max = price + 100000;
          console.log('Searching by price range:', price);
        } else {
          // Otherwise, search in multiple fields (API will handle it as a general search)
          // Since our API doesn't have a general search parameter, we'll search in city and address
          filters.city = query;
          console.log('Searching by city (fallback):', query);
        }
      }
      // Otherwise try searching in multiple fields
      else {
        // Try as city first (most common)
        filters.city = query;
        console.log('Searching by city (default):', query);
      }
      
      console.log('Searching with filters:', filters);
      
      // Call the API with filters
      const response = await fetchExclusiveProperties(filters);
      
      // Map the API response to properties
      const properties = mapApiResponseToProperties(response);
      
      console.log('Found properties:', properties.length);
      
      // Create display query based on search type
      let displayQuery = `Exclusive Properties`;
      if (filters.city) {
        displayQuery = `Exclusive Properties in ${filters.city}`;
      } else if (filters.postal_code) {
        displayQuery = `Exclusive Properties in ${filters.postal_code}`;
      } else if (filters.province) {
        const provinceName = getProvinceName(filters.province);
        displayQuery = `Exclusive Properties in ${provinceName}`;
      } else if (filters.price_min || filters.price_max) {
        displayQuery = `Exclusive Properties with price around $${(filters.price_min || filters.price_max)?.toLocaleString()}`;
      }
      
      onPropertiesUpdate(properties, displayQuery);
      
      if (properties.length === 0) {
        setError(`No properties found matching "${query}". Try a different search term.`);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if query is a province
  const isProvince = (query: string): boolean => {
    const provinces = [
      'Ontario', 'Quebec', 'British Columbia', 'BC', 
      'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia',
      'New Brunswick', 'Newfoundland', 'Prince Edward Island',
      'PEI', 'Northwest Territories', 'Nunavut', 'Yukon',
      'ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT'
    ];
    
    return provinces.includes(query.trim());
  };

  // Helper function to get province code
  const getProvinceCode = (query: string): string => {
    const provinceMap: { [key: string]: string } = {
      'Ontario': 'ON',
      'Quebec': 'QC',
      'British Columbia': 'BC',
      'Alberta': 'AB',
      'Manitoba': 'MB',
      'Saskatchewan': 'SK',
      'Nova Scotia': 'NS',
      'New Brunswick': 'NB',
      'Newfoundland and Labrador': 'NL',
      'Newfoundland': 'NL',
      'Prince Edward Island': 'PE',
      'PEI': 'PE',
      'Northwest Territories': 'NT',
      'Nunavut': 'NU',
      'Yukon': 'YT',
      'ON': 'ON',
      'QC': 'QC',
      'BC': 'BC',
      'AB': 'AB',
      'MB': 'MB',
      'SK': 'SK',
      'NS': 'NS',
      'NB': 'NB',
      'NL': 'NL',
      'PE': 'PE',
      'NT': 'NT',
      'NU': 'NU',
      'YT': 'YT'
    };
    
    return provinceMap[query.trim()] || query;
  };

  // Helper function to get province name from code
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
    
    return provinceMap[code] || code;
  };

  // Helper function to map API response to Property interface
  const mapApiResponseToProperties = (response: any): Property[] => {
    return (response.results || []).map((prop: any) => ({
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
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search and show all properties
  const handleClearSearch = async () => {
    setSearchQuery("");
    setError("");
    setIsLoading(true);
    try {
      const response = await fetchExclusiveProperties({});
      const properties = mapApiResponseToProperties(response);
      onPropertiesUpdate(properties, "Exclusive Properties");
    } catch (error) {
      console.error('Error clearing search:', error);
    } finally {
      setIsLoading(false);
    }
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
                    placeholder="Search by city, postal code, province, or address..."
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
                  onClick={handleClearSearch}
                  className="text-sm text-white/80 hover:text-white hover:underline px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  disabled={isLoading}
                >
                  View All Properties
                </button>
              </div>

              {/* Search tips */}
              <div className="mt-3 text-xs text-white/60 text-center">
                Try searching by: City (Toronto), Postal Code (M5V 2T6), Province (Ontario), or Price (500000)
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