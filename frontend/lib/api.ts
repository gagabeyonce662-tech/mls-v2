// API Base URL - Update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Property interfaces for MLS API
export interface Property {
  PropertyKey: string;
  ListPrice: number;
  City: string;
  StateOrProvince: string;
  PropertySubType: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  StandardStatus: string;
  ModificationTimestamp: string;
  ListingKey: string;
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

// Property API functions
export async function fetchProperties(filters?: PropertyFilterParams): Promise<Property[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/mls/properties/filter/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Fetching properties from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Properties API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched properties:', data?.value?.length || 0, 'properties');
    return data.value || data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

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
    console.log('Fetched property:', data.PropertyKey || 'N/A');
    return data;
  } catch (error) {
    console.error('Error fetching property by key:', error);
    return null;
  }
}

// Fetch properties with Ontario city filter for homepage
export async function fetchOntarioProperties(): Promise<Property[]> {
  return fetchProperties({
    province: 'Ontario',
    status: 'Active'
  });
}
