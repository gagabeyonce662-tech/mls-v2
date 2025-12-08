// API Base URL - Update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Property interfaces for MLS API
export interface Property {
  PropertyKey: string;
  ListingKey: string;
  list_price?: string;
  listing_key?: string;
  ListPrice: number;
  City: string;
  city?: string;
  StateOrProvince: string;
  PropertySubType: string;
  BedroomsTotal: number;
  bedrooms_total?: number;
  BathroomsTotalInteger: number;
  bathrooms_total_integer?: number;
  StandardStatus: string;
  standard_status?: string;
  ModificationTimestamp: string;
  unparsed_address?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  public_remarks?: string;
  media?: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }>;
  rooms?: Array<{
    room_type: string;
    room_level: string;
    room_length: string | null;
    room_width: string | null;
    room_dimensions: string;
  }>;
  category_type?: string;
  photos_count?: number;
  listing_url?: string;
  building_area_total?: string | null;
  year_built?: string | null;
  
  // Legacy fields
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
  [key: string]: any;
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
  property_sub_type?: string;
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
  limit?: number;
  offset?: number;
}

// New interface for Lease Properties filter parameters
export interface LeasePropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

// Vlog interfaces
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

// Vlog functions
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    console.log('Fetching vlog posts from:', `${API_BASE_URL}/api/vlog/`);
    
    const response = await fetch(`${API_BASE_URL}/api/vlog/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

    return {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    };
  } catch (error) {
    console.error('Error fetching vlog post:', error);
    return null;
  }
}

// Original Property API function
export async function fetchProperties(filters?: PropertyFilterParams): Promise<Property[]> {
  try {
    console.log('fetchProperties called with filters:', filters);
    
    // Convert PropertyFilterParams to ExclusivePropertyFilterParams
    const exclusiveFilters: ExclusivePropertyFilterParams = {};
    
    if (filters) {
      // Map filters to exclusive API format
      if (filters.province) {
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
      
      if (filters.city) exclusiveFilters.city = filters.city;
      if (filters.price_min) exclusiveFilters.price_min = filters.price_min;
      if (filters.price_max) exclusiveFilters.price_max = filters.price_max;
      if (filters.bedrooms) exclusiveFilters.bedrooms = filters.bedrooms;
      if (filters.bathrooms) exclusiveFilters.bathrooms = filters.bathrooms;
      
      if (filters.property_subtype) {
        exclusiveFilters.property_sub_type = filters.property_subtype;
      }
      
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

// UPDATED: Exclusive Properties API function for infinite scroll
export async function fetchExclusiveProperties(filters?: ExclusivePropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
  updated_to_exclusive: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    // Default values for infinite scroll
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    // Set default pagination parameters
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
    // Add all other filters to query params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Skip limit and offset as they're already added
        if (key === 'limit' || key === 'offset') return;
        
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
    
    // Use the correct endpoint with query parameters
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
      console.error('API Error:', await response.text());
      throw new Error(`Failed to fetch exclusive properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched exclusive properties:', data?.results?.length || 0, 'properties');
    
    // Return the response with proper structure
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

// NEW: Lease Properties API function
export async function fetchLeaseProperties(filters?: LeasePropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    // Default values for pagination
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
    // Add all other filters to query params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'limit' || key === 'offset') return;
        
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            queryParams.append(key, value ? 'true' : 'false');
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/mls/properties/lease-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching lease properties from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Lease Properties API Response status:', response.status);

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error(`Failed to fetch lease properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched lease properties:', data?.results?.length || 0, 'properties');
    
    return {
      results: data.results || [],
      count: data.count || 0,
      next: data.next || null,
      previous: data.previous || null
    };
  } catch (error) {
    console.error('Error fetching lease properties:', error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null
    };
  }
}

// SIMPLIFIED function to get ALL exclusive properties without any filters
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

// NEW: Helper to get ALL lease properties
export async function fetchAllLeaseProperties(): Promise<Property[]> {
  try {
    console.log('Fetching ALL lease properties (no filters)');
    
    const response = await fetchLeaseProperties({});
    
    console.log('Fetched ALL lease properties:', response.results?.length || 0, 'properties');
    
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
      PropertySubType: prop.category_type || 'Lease',
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
      PropertyType: prop.category_type || 'Lease',
      
      // Add all other properties from the response
      ...prop
    }));
  } catch (error) {
    console.error('Error fetching all lease properties:', error);
    return [];
  }
}

// Fetch property by key
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
    
    // Map property to Property interface
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

// NEW: Helper function to test lease endpoint
export async function testLeaseEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/lease-properties/`;
    console.log('Testing lease endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Lease test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Lease test response data:', data);
      console.log('Lease endpoint is working! Found', data.count || 0, 'properties');
    } else {
      console.error('Lease endpoint test failed with status:', response.status);
      try {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
    }
  } catch (error) {
    console.error('Error testing lease endpoint:', error);
  }
}

// Test price range specifically
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

// New function for infinite scroll with specific offset
export async function fetchExclusivePropertiesWithOffset(
  offset: number = 0,
  limit: number = 6,
  filters?: Omit<ExclusivePropertyFilterParams, 'limit' | 'offset'>
): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
  updated_to_exclusive: number;
}> {
  return fetchExclusiveProperties({
    ...filters,
    limit,
    offset
  });
}


// Add to the filter params interfaces section
export interface PreConnPropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  keywords?: string;
  has_photos?: boolean;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

// Add to the API functions section
export async function fetchPreConnProperties(filters?: PreConnPropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    // Default values for pagination
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
    // Add all other filters to query params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'limit' || key === 'offset') return;
        
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            queryParams.append(key, value ? 'true' : 'false');
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/mls/properties/pre-conn-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching pre-construction properties from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Pre-Construction Properties API Response status:', response.status);

    if (!response.ok) {
      console.error('API Error:', await response.text());
      throw new Error(`Failed to fetch pre-construction properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched pre-construction properties:', data?.results?.length || 0, 'properties');
    
    return {
      results: data.results || [],
      count: data.count || 0,
      next: data.next || null,
      previous: data.previous || null
    };
  } catch (error) {
    console.error('Error fetching pre-construction properties:', error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null
    };
  }
}

// Helper to get ALL pre-construction properties
export async function fetchAllPreConnProperties(): Promise<Property[]> {
  try {
    console.log('Fetching ALL pre-construction properties (no filters)');
    
    const response = await fetchPreConnProperties({});
    
    console.log('Fetched ALL pre-construction properties:', response.results?.length || 0, 'properties');
    
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
      PropertySubType: prop.category_type || 'Pre-Construction',
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
      PropertyType: prop.category_type || 'Pre-Construction',
      
      // Add all other properties from the response
      ...prop
    }));
  } catch (error) {
    console.error('Error fetching all pre-construction properties:', error);
    return [];
  }
}
// NEW: Function for lease properties infinite scroll
export async function fetchLeasePropertiesWithOffset(
  offset: number = 0,
  limit: number = 6,
  filters?: Omit<LeasePropertyFilterParams, 'limit' | 'offset'>
): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  return fetchLeaseProperties({
    ...filters,
    limit,
    offset
  });
}

export async function uploadPreConnProperties(
  file?: File | null,
  options?: {
    fieldName?: string;
    authToken?: string | null;
    additionalFormFields?: Record<string, string>;
    useGet?: boolean; // default true per your request
  }
): Promise<any> {
  const fieldName = options?.fieldName ?? 'file';
  const authToken = options?.authToken ?? null;
  const additionalFormFields = options?.additionalFormFields ?? {};
  const useGet = options?.useGet ?? true;

  const urlBase = `${API_BASE_URL}/api/mls/properties/pre-conn-properties/`;

  if (useGet) {
    // GET mode: send small CSV content as query param `csv` (URL-encoded).
    // If file is not provided, just call GET without csv param.
    try {
      let url = urlBase;
      if (file) {
        // read as text
        const text = await file.text();
        // encodeURIComponent to be safe
        const encoded = encodeURIComponent(text);

        // If you want to send filename too:
        const filenameParam = file.name ? `&filename=${encodeURIComponent(file.name)}` : '';

        // add additional fields as query params
        const extra = Object.entries(additionalFormFields)
          .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('');

        // build final URL
        url = `${url}?csv=${encoded}${filenameParam}${extra}`;
      } else {
        // no file => simple GET to endpoint (server may process default behavior)
        url = urlBase;
      }

      console.log('GET uploading (via query) to:', urlBase, ' (length may be', url.length, 'chars )');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json', // bodyless GET — content-type can be JSON
      };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const resp = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });

      const text = await resp.text();
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // not JSON, keep text
      }

      if (!resp.ok) {
        const err = new Error(`GET upload failed: ${resp.status} ${resp.statusText}`);
        (err as any).body = data;
        throw err;
      }

      return data;
    } catch (err) {
      console.error('Error in uploadPreConnProperties (GET mode):', err);
      throw err;
    }
  } else {
    // POST mode: standard multipart/form-data upload
    try {
      if (!file) throw new Error('No file provided for POST upload');

      const form = new FormData();
      form.append(fieldName, file);
      Object.entries(additionalFormFields).forEach(([k, v]) => form.append(k, v));

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      console.log('POST uploading to:', urlBase, 'file:', file.name);

      const resp = await fetch(urlBase, {
        method: 'POST',
        headers, // do NOT set Content-Type — browser will set multipart boundary
        body: form,
        credentials: 'same-origin',
      });

      const text = await resp.text();
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch (e) {}

      if (!resp.ok) {
        const err = new Error(`POST upload failed: ${resp.status} ${resp.statusText}`);
        (err as any).body = data;
        throw err;
      }

      return data;
    } catch (err) {
      console.error('Error in uploadPreConnProperties (POST mode):', err);
      throw err;
    }
  }
}