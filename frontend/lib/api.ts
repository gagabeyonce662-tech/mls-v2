// API Base URL - Update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Property interfaces for MLS API
export interface Property {
  PropertyKey: string;
  ListingKey: string;
  list_price?: string;  // New field from exclusive API
  listing_key?: string; // New field from exclusive API
  ListPrice: number;
  City: string;
  city?: string; // New field from exclusive API
  StateOrProvince: string;
  PropertySubType: string;
  BedroomsTotal: number;
  bedrooms_total?: number; // New field from exclusive API
  BathroomsTotalInteger: number;
  bathrooms_total_integer?: number; // New field from exclusive API
  StandardStatus: string;
  standard_status?: string; // New field from exclusive API
  ModificationTimestamp: string;
  unparsed_address?: string; // New field from exclusive API
  postal_code?: string; // New field from exclusive API
  latitude?: string; // New field from exclusive API
  longitude?: string; // New field from exclusive API
  public_remarks?: string; // New field from exclusive API
  media?: Array<{ // New field from exclusive API
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }>;
  rooms?: Array<{ // New field from exclusive API
    room_type: string;
    room_level: string;
    room_length: string | null;
    room_width: string | null;
    room_dimensions: string;
  }>;
  category_type?: string; // New field from exclusive API
  photos_count?: number; // New field from exclusive API
  listing_url?: string; // New field from exclusive API
  building_area_total?: string | null; // New field from exclusive API
  year_built?: string | null; // New field from exclusive API
  
  // Legacy fields for backward compatibility
  Photos?: any[];
  Media?: any[];
  Rooms?: any[];
  LivingArea?: number | null;
  YearBuilt?: number | null;
  LotSizeArea?: number | null;
  GarageSpaces?: number | null;
  ElementarySchool?: string | null;
  MiddleSchool?: string | null;
  HighSchool?: string | null;
  School?: string | null;
  DirectionsToProperty?: string | null;
  PrivateRemarks?: string | null;
  Description?: string;
  OriginalListPrice?: number | null;
  DaysOnMarket?: number | null;
  CumulativeDaysOnMarket?: number | null;
  PropertyType?: string;
  Zoning?: string | null;
  LotSizeDimensions?: string | null;
  ConstructionMaterials?: string | null;
  Architectural_Style?: string | null;
  Heating?: string | null;
  Cooling?: string | null;
  Utilities?: string | null;
  WaterSource?: string | null;
  Sewer?: string | null;
  Foundation?: string | null;
  Roof?: string | null;
  InteriorFeatures?: string | null;
  ExteriorFeatures?: string | null;
  Appliances?: string | null;
  CountyOrParish?: string | null;
  Directions?: string | null;
  PublicRemarks?: string;
  PostalCode?: string;
  Latitude?: string;
  Longitude?: string;
  [key: string]: any; // For additional DDF fields
}

export interface PropertyFilterParams {
  city?: string;
  province?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_subtype?: string;
  status?: string;
}

// New interface for Exclusive Properties filter parameters
export interface ExclusivePropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string; // Comma-separated list
  city?: string;
  province?: string;
  postal_code?: string;
  latitude_min?: number;
  latitude_max?: number;
  longitude_min?: number;
  longitude_max?: number;
  building_area_min?: number;
  lot_size_min?: number;
  year_built_min?: number;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
}

// Vlog interfaces remain the same...
export interface VlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface VlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  embed_url?: string;
  video_file?: string;
  thumbnail?: string;
  author?: number;
  category: VlogCategory | null;
  tags: string[];
  status: string;
  publish_date?: string;
  created_at: string;
  updated_at: string;
  allow_comments: boolean;
}

// Vlog functions remain the same...
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    console.log('Fetching vlog posts from:', `${API_BASE_URL}/api/vlog/`);
    
    const response = await fetch(`${API_BASE_URL}/api/vlog/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for fresh data
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched vlog posts:', data.length, 'posts');
    
    // Process tags from comma-separated string to array
    return data.map((post: any) => ({
      ...post,
      tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    }));
  } catch (error) {
    console.error('Error fetching vlog posts:', error);
    return [];
  }
}

export async function fetchVlogPostBySlug(slug: string): Promise<VlogPost | null> {
  try {
    console.log('Fetching vlog post by slug:', `${API_BASE_URL}/api/vlog/${slug}/`);
    
    const response = await fetch(`${API_BASE_URL}/api/vlog/${slug}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('API Response status for slug:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch blog post: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched vlog post:', data.title);
    
    // Process tags from comma-separated string to array
    return {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    };
  } catch (error) {
    console.error('Error fetching vlog post:', error);
    return null;
  }
}

// UPDATED: Original Property API function - NOW USES EXCLUSIVE-PROPERTIES API WITHOUT PARAMS
export async function fetchProperties(filters?: PropertyFilterParams): Promise<Property[]> {
  try {
    console.log('fetchProperties called with filters:', filters);
    
    // Convert PropertyFilterParams to ExclusivePropertyFilterParams
    const exclusiveFilters: ExclusivePropertyFilterParams = {};
    
    if (filters) {
      // Map province from full name to province code if needed
      if (filters.province) {
        // Check if it's already a province code (2 letters)
        if (filters.province.length === 2 && filters.province === filters.province.toUpperCase()) {
          exclusiveFilters.province = filters.province;
        } else {
          // Map full province name to code
          const provinceMapping: { [key: string]: string } = {
            'Ontario': 'ON',
            'Quebec': 'QC',
            'British Columbia': 'BC',
            'Alberta': 'AB',
            'Manitoba': 'MB',
            'Saskatchewan': 'SK',
            'Nova Scotia': 'NS',
            'New Brunswick': 'NB',
            'Newfoundland and Labrador': 'NL',
            'Prince Edward Island': 'PE',
            'Northwest Territories': 'NT',
            'Nunavut': 'NU',
            'Yukon': 'YT'
          };
          exclusiveFilters.province = provinceMapping[filters.province] || filters.province;
        }
      }
      
      if (filters.city) exclusiveFilters.city = filters.city;
      if (filters.price_min) exclusiveFilters.price_min = filters.price_min;
      if (filters.price_max) exclusiveFilters.price_max = filters.price_max;
      if (filters.bedrooms) exclusiveFilters.bedrooms = filters.bedrooms;
      if (filters.bathrooms) exclusiveFilters.bathrooms = filters.bathrooms;
      
      // Map property_subtype to property_type
      if (filters.property_subtype) {
        exclusiveFilters.property_type = filters.property_subtype;
      }
      
      // Map status to standard_status
      if (filters.status) {
        exclusiveFilters.standard_status = filters.status;
      }
    }
    
    console.log('Converting filters for exclusive API:', filters, '->', exclusiveFilters);
    
    // Now call the exclusive properties API
    const response = await fetchExclusiveProperties(exclusiveFilters);
    
    console.log('Fetched properties from exclusive API:', response.results?.length || 0, 'properties');
    
    // Map the exclusive properties to Property interface
    const mappedProperties: Property[] = (response.results || []).map((prop: any) => ({
      PropertyKey: prop.listing_key || prop.PropertyKey || '',
      ListingKey: prop.listing_key || prop.ListingKey || '',
      list_price: prop.list_price,
      listing_key: prop.listing_key,
      ListPrice: prop.list_price ? parseFloat(prop.list_price) : prop.ListPrice || 0,
      City: prop.city || prop.City || '',
      city: prop.city,
      StateOrProvince: prop.StateOrProvince || 'ON',
      PropertySubType: prop.category_type || prop.PropertySubType || 'Exclusive',
      BedroomsTotal: prop.bedrooms_total || prop.BedroomsTotal || 0,
      bedrooms_total: prop.bedrooms_total,
      BathroomsTotalInteger: prop.bathrooms_total_integer || prop.BathroomsTotalInteger || 0,
      bathrooms_total_integer: prop.bathrooms_total_integer,
      StandardStatus: prop.standard_status || prop.StandardStatus || 'Active',
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
      
      // Legacy fields for backward compatibility
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
      PropertyType: prop.category_type || prop.PropertyType || 'Exclusive',
      
      // Add all other properties from the response
      ...prop
    }));
    
    return mappedProperties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// NEW: Exclusive Properties API function - UPDATED WITH CORRECT ENDPOINT
export async function fetchExclusiveProperties(filters?: ExclusivePropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
  updated_to_exclusive: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Handle boolean values
          if (typeof value === 'boolean') {
            queryParams.append(key, value ? 'true' : 'false');
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    // CORRECTED URL: Add /mls/ to match your Django URL configuration
    // Main urls.py: path('api/mls/',include('mls.urls'))
    // mls/urls.py: path('properties/exclusive-properties1/', ...)
    // Full URL: /api/mls/properties/exclusive-properties1/
    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching exclusive properties from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Exclusive Properties API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch exclusive properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched exclusive properties:', data?.results?.length || 0, 'properties');
    
    return {
      results: data.results || [],
      count: data.count || 0,
      next: data.next || null,
      previous: data.previous || null,
      updated_to_exclusive: data.updated_to_exclusive || 0
    };
  } catch (error) {
    console.error('Error fetching exclusive properties:', error);
    // Return empty structure on error
    return {
      results: [],
      count: 0,
      next: null,
      previous: null,
      updated_to_exclusive: 0
    };
  }
}

// NEW: Function to get ALL exclusive properties without any filters
export async function fetchAllExclusiveProperties(): Promise<Property[]> {
  try {
    console.log('Fetching ALL exclusive properties (no filters)');
    
    // Call with empty filters to get all properties
    const response = await fetchExclusiveProperties({});
    
    console.log('Fetched ALL exclusive properties:', response.results?.length || 0, 'properties');
    
    // Map the results to Property interface
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
      
      // Add all other properties from the response
      ...prop
    }));
  } catch (error) {
    console.error('Error fetching all exclusive properties:', error);
    return [];
  }
}

// Fetch property by key - updated to handle both exclusive and regular properties
export async function fetchPropertyByKey(propertyKey: string): Promise<Property | null> {
  try {
    console.log('Fetching property by key:', `${API_BASE_URL}/api/mls/properties/${propertyKey}/`);
    
    const response = await fetch(`${API_BASE_URL}/api/mls/properties/${propertyKey}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Property API Response status for key:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Property not found for key:', propertyKey);
        return null;
      }
      throw new Error(`Failed to fetch property: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched property data:', data);
    
    // Check if this is an exclusive property response
    if (data.listing_key || data.category_type === 'exclusive') {
      // Map exclusive property to Property interface
      return {
        PropertyKey: data.listing_key || propertyKey,
        ListingKey: data.listing_key || propertyKey,
        listing_key: data.listing_key,
        list_price: data.list_price,
        ListPrice: data.list_price ? parseFloat(data.list_price) : 0,
        City: data.city || '',
        city: data.city,
        StateOrProvince: data.StateOrProvince || 'ON',
        PropertySubType: data.category_type || 'Exclusive',
        BedroomsTotal: data.bedrooms_total || 0,
        bedrooms_total: data.bedrooms_total,
        BathroomsTotalInteger: data.bathrooms_total_integer || 0,
        bathrooms_total_integer: data.bathrooms_total_integer,
        StandardStatus: data.standard_status || 'Active',
        standard_status: data.standard_status,
        ModificationTimestamp: data.ModificationTimestamp || new Date().toISOString(),
        unparsed_address: data.unparsed_address,
        postal_code: data.postal_code,
        latitude: data.latitude,
        longitude: data.longitude,
        public_remarks: data.public_remarks,
        media: data.media || [],
        rooms: data.rooms || [],
        category_type: data.category_type,
        photos_count: data.photos_count,
        listing_url: data.listing_url,
        building_area_total: data.building_area_total,
        year_built: data.year_built,
        
        // Legacy fields for backward compatibility
        Photos: data.media?.map((m: any) => ({ PhotoURL: m.media_url })) || [],
        Media: data.media,
        Rooms: data.rooms,
        LivingArea: data.building_area_total ? parseFloat(data.building_area_total) : null,
        YearBuilt: data.year_built ? parseInt(data.year_built) : null,
        LotSizeArea: null,
        GarageSpaces: null,
        ElementarySchool: null,
        MiddleSchool: null,
        HighSchool: null,
        School: null,
        DirectionsToProperty: null,
        PrivateRemarks: null,
        Description: data.public_remarks,
        OriginalListPrice: null,
        DaysOnMarket: null,
        CumulativeDaysOnMarket: null,
        PropertyType: data.category_type,
        Zoning: null,
        LotSizeDimensions: null,
        ConstructionMaterials: null,
        Architectural_Style: null,
        Heating: null,
        Cooling: null,
        Utilities: null,
        WaterSource: null,
        Sewer: null,
        Foundation: null,
        Roof: null,
        InteriorFeatures: null,
        ExteriorFeatures: null,
        Appliances: null,
        CountyOrParish: null,
        Directions: null,
        PublicRemarks: data.public_remarks,
        PostalCode: data.postal_code,
        Latitude: data.latitude,
        Longitude: data.longitude,
        
        // Add all other properties from the response
        ...data
      };
    } else {
      // It's a regular property
      return {
        ...data,
        // Ensure backward compatibility
        PropertyKey: data.PropertyKey || propertyKey,
        ListingKey: data.ListingKey || data.PropertyKey || propertyKey,
        ListPrice: data.ListPrice || 0,
        City: data.City || '',
        StateOrProvince: data.StateOrProvince || '',
        PropertySubType: data.PropertySubType || '',
        BedroomsTotal: data.BedroomsTotal || 0,
        BathroomsTotalInteger: data.BathroomsTotalInteger || 0,
        StandardStatus: data.StandardStatus || '',
        ModificationTimestamp: data.ModificationTimestamp || new Date().toISOString(),
        
        // Map legacy fields if needed
        Photos: data.Photos || data.Media || [],
        Media: data.Media || data.Photos || [],
        Rooms: data.Rooms || [],
        LivingArea: data.LivingArea || null,
        YearBuilt: data.YearBuilt || null,
        PublicRemarks: data.PublicRemarks || data.Description || '',
        PostalCode: data.PostalCode || '',
        Latitude: data.Latitude || '',
        Longitude: data.Longitude || '',
        Description: data.Description || data.PublicRemarks || ''
      };
    }
  } catch (error) {
    console.error('Error fetching property by key:', error);
    return null;
  }
}

// Fetch properties with Ontario city filter for homepage
export async function fetchOntarioProperties(): Promise<Property[]> {
  return fetchProperties({
    province: 'Ontario'
  });
}

// Helper function to test the endpoint
export async function testExclusiveEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/`;
    console.log('Testing exclusive endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Test response data:', data);
      console.log('Endpoint is working! Found', data.count || 0, 'properties');
    } else {
      console.error('Endpoint test failed with status:', response.status);
      // Try to get error details
      try {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
    }
  } catch (error) {
    console.error('Error testing exclusive endpoint:', error);
  }
}

// NEW: Test price range specifically
export async function testPriceRangeEndpoint(minPrice?: number, maxPrice?: number): Promise<void> {
  try {
    const queryParams = new URLSearchParams();
    if (minPrice) queryParams.append('price_min', minPrice.toString());
    if (maxPrice) queryParams.append('price_max', maxPrice.toString());
    
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Testing price range endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Price range test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Price range test data received');
      console.log('Number of properties found:', data?.results?.length || 0);
      if (data.results && data.results.length > 0) {
        console.log('Sample property prices:', data.results.slice(0, 3).map((p: any) => p.list_price || p.ListPrice));
      }
    } else {
      console.error('Price range endpoint test failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error testing price range endpoint:', error);
  }
}

// Test the MLS filter endpoint too (keeping for backward compatibility)
export async function testMLSFilterEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/filter/?province=Ontario&status=Active`;
    console.log('Testing MLS filter endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('MLS filter test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('MLS filter test data received');
      console.log('Number of properties found:', data?.value?.length || 0);
    } else {
      console.error('MLS filter endpoint test failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error testing MLS filter endpoint:', error);
  }
}