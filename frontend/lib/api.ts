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

// Base fetch wrapper with error handling
async function fetchAPI<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Vlog functions
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const data = await fetchAPI<any[]>(`${API_BASE_URL}/api/vlog/`, {
      cache: 'no-store',
    });

    return data.map((post) => ({
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
    const data = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      cache: 'no-store',
    });

    return {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    };
  } catch (error) {
    console.error('Error fetching vlog post:', error);
    return null;
  }
}

// Property API functions
export async function fetchProperties(filters?: PropertyFilterParams): Promise<Property[]> {
  try {
    // Convert PropertyFilterParams to ExclusivePropertyFilterParams
    const exclusiveFilters: ExclusivePropertyFilterParams = {};
    
    if (filters) {
      if (filters.province) {
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
    
    // Call the exclusive properties API
    const response = await fetchExclusiveProperties(exclusiveFilters);
    
    // Map the exclusive properties to Property interface
    return (response.results || []).map((prop: any) => mapPropertyFromAPI(prop));
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// Helper function to map API response to Property interface
function mapPropertyFromAPI(prop: any): Property {
  return {
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
  };
}

// Exclusive Properties API function
export async function fetchExclusiveProperties(filters?: ExclusivePropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
  updated_to_exclusive: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
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
    
    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return await fetchAPI(url, { cache: 'no-store' });
  } catch (error) {
    console.error('Error fetching exclusive properties:', error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null,
      updated_to_exclusive: 0
    };
  }
}

// Lease Properties API function
export async function fetchLeaseProperties(filters?: LeasePropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
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
    
    return await fetchAPI(url, { cache: 'no-store' });
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

// Fetch all exclusive properties
export async function fetchAllExclusiveProperties(): Promise<Property[]> {
  try {
    const response = await fetchExclusiveProperties({});
    return (response.results || []).map((prop: any) => mapPropertyFromAPI(prop));
  } catch (error) {
    console.error('Error fetching all exclusive properties:', error);
    return [];
  }
}

// Fetch all lease properties
export async function fetchAllLeaseProperties(): Promise<Property[]> {
  try {
    const response = await fetchLeaseProperties({});
    return (response.results || []).map((prop: any) => mapPropertyFromAPI(prop));
  } catch (error) {
    console.error('Error fetching all lease properties:', error);
    return [];
  }
}

// Fetch property by key
export async function fetchPropertyByKey(propertyKey: string): Promise<Property | null> {
  try {
    const data = await fetchAPI<any>(`${API_BASE_URL}/api/mls/properties/${propertyKey}/`, {
      cache: 'no-store',
    });
    
    return {
      ...mapPropertyFromAPI(data),
      PropertyKey: data.listing_key || propertyKey,
      ListingKey: data.listing_key || propertyKey,
    };
  } catch (error) {
    console.error('Error fetching property by key:', error);
    return null;
  }
}

// Fetch Ontario properties
export async function fetchOntarioProperties(): Promise<Property[]> {
  return fetchProperties({ province: 'Ontario' });
}

// Pre-Construction Properties interfaces and functions
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

export async function fetchPreConnProperties(filters?: PreConnPropertyFilterParams): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();
    
    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;
    
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
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
    
    return await fetchAPI(url, { cache: 'no-store' });
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

export async function fetchAllPreConnProperties(): Promise<Property[]> {
  try {
    const response = await fetchPreConnProperties({});
    return (response.results || []).map((prop: any) => mapPropertyFromAPI(prop));
  } catch (error) {
    console.error('Error fetching all pre-construction properties:', error);
    return [];
  }
}

// Test functions
export async function testExclusiveEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/`;
    const response = await fetch(testUrl);
    console.log('Test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Endpoint is working! Found', data.count || 0, 'properties');
    }
  } catch (error) {
    console.error('Error testing exclusive endpoint:', error);
  }
}

export async function testLeaseEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/lease-properties/`;
    const response = await fetch(testUrl);
    console.log('Lease test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Lease endpoint is working! Found', data.count || 0, 'properties');
    }
  } catch (error) {
    console.error('Error testing lease endpoint:', error);
  }
}

export async function testPriceRangeEndpoint(minPrice?: number, maxPrice?: number): Promise<void> {
  try {
    const queryParams = new URLSearchParams();
    if (minPrice) queryParams.append('price_min', minPrice.toString());
    if (maxPrice) queryParams.append('price_max', maxPrice.toString());
    
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Price range test: Found', data?.results?.length || 0, 'properties');
    }
  } catch (error) {
    console.error('Error testing price range endpoint:', error);
  }
}

export async function testMLSFilterEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/filter/?province=Ontario&status=Active`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('MLS filter test: Found', data?.value?.length || 0, 'properties');
    }
  } catch (error) {
    console.error('Error testing MLS filter endpoint:', error);
  }
}

// Upload pre-construction properties
export async function uploadPreConnProperties(
  file?: File | null,
  options?: {
    fieldName?: string;
    authToken?: string | null;
    additionalFormFields?: Record<string, string>;
    useGet?: boolean;
  }
): Promise<any> {
  const fieldName = options?.fieldName ?? 'file';
  const authToken = options?.authToken ?? null;
  const additionalFormFields = options?.additionalFormFields ?? {};
  const useGet = options?.useGet ?? true;

  const urlBase = `${API_BASE_URL}/api/mls/properties/pre-conn-properties/`;

  if (useGet && file) {
    try {
      const text = await file.text();
      const encoded = encodeURIComponent(text);
      const filenameParam = file.name ? `&filename=${encodeURIComponent(file.name)}` : '';
      const extra = Object.entries(additionalFormFields)
        .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('');

      const url = `${urlBase}?csv=${encoded}${filenameParam}${extra}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const resp = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });

      const responseText = await resp.text();
      let data: any = responseText;
      try {
        data = JSON.parse(responseText);
      } catch (e) {}

      if (!resp.ok) {
        throw new Error(`GET upload failed: ${resp.status} ${resp.statusText}`);
      }

      return data;
    } catch (err) {
      console.error('Error in uploadPreConnProperties (GET mode):', err);
      throw err;
    }
  } else if (!useGet && file) {
    try {
      const form = new FormData();
      form.append(fieldName, file);
      Object.entries(additionalFormFields).forEach(([k, v]) => form.append(k, v));

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const resp = await fetch(urlBase, {
        method: 'POST',
        headers,
        body: form,
        credentials: 'same-origin',
      });

      const responseText = await resp.text();
      let data: any = responseText;
      try {
        data = JSON.parse(responseText);
      } catch (e) {}

      if (!resp.ok) {
        throw new Error(`POST upload failed: ${resp.status} ${resp.statusText}`);
      }

      return data;
    } catch (err) {
      console.error('Error in uploadPreConnProperties (POST mode):', err);
      throw err;
    }
  } else {
    throw new Error('No file provided');
  }
}