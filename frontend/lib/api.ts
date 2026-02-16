// lib/api/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://staging.vsell4u.ca";

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

  // Comparison fields
  address?: string;
  location?: string;
  province?: string;
  postalCode?: string;
  cooling?: string;
  basement?: string;
  zoning?: string;
  parking_total?: number;
  parking_features?: string;
  total_actual_rent?: string;

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
  limit?: number;
  offset?: number;
}

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
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

export interface LeasePropertyFilterParams {
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_sub_type?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  building_area_min?: number;
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  new_listings_days?: number;
  standard_status?: string;
  limit?: number;
  offset?: number;
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

// Enhanced fetch wrapper with better error handling
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    console.log(`API Request: ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
      );
    }

    const data = await response.json();
    console.log(`API Response from ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Vlog functions
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const data = await fetchAPI<any[]>(`${API_BASE_URL}/api/vlog/`, {
      cache: "no-store",
    });

    return data.map((post) => ({
      ...post,
      tags: post.tags
        ? post.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [],
    }));
  } catch (error) {
    console.error("Error fetching vlog posts:", error);
    return [];
  }
}

export async function fetchVlogPostBySlug(
  slug: string,
): Promise<VlogPost | null> {
  try {
    const data = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      cache: "no-store",
    });

    return {
      ...data,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [],
    };
  } catch (error) {
    console.error("Error fetching vlog post:", error);
    return null;
  }
}

/**
 * Search properties by query string (city, address, postal code, keywords).
 * Uses the /filter/ endpoint with a `search` param.
 */
export async function searchProperties(
  query: string,
  extraFilters?: Record<string, any>,
): Promise<Property[]> {
  try {
    const params: Record<string, any> = { search: query, ...extraFilters };
    const data = await fetchFilteredProperties(params);
    const results: any[] = data.results || data.value || [];
    return results.map(mapPropertyFromAPI);
  } catch (error) {
    console.error("Error searching properties:", error);
    return [];
  }
}

// Helper function to map API response to Property interface
// Helper function to map API response to Property interface - FIXED VERSION
export function mapPropertyFromAPI(prop: any): Property {
  console.log("Mapping property from API:", prop);

  // Build address from components
  const addressParts = [];
  if (prop.unit_number) addressParts.push(`${prop.unit_number}-`);
  if (prop.street_number) addressParts.push(prop.street_number);
  if (prop.street_dir_prefix) addressParts.push(prop.street_dir_prefix);
  if (prop.street_name) addressParts.push(prop.street_name);
  if (prop.street_suffix) addressParts.push(prop.street_suffix);
  if (prop.street_dir_suffix) addressParts.push(prop.street_dir_suffix);

  const builtAddress = addressParts.join(" ").trim();

  // Format price
  const listPrice = prop.list_price
    ? parseFloat(prop.list_price)
    : prop.ListPrice || 0;

  // FIXED: Handle media properly - it's an object, not an array
  let mediaArray: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }> = [];

  if (prop.media) {
    if (Array.isArray(prop.media)) {
      // If media is already an array (legacy format)
      mediaArray = prop.media;
    } else if (typeof prop.media === "object" && prop.media.media_url) {
      // If media is a single object (your current API format)
      mediaArray = [
        {
          media_url: prop.media.media_url,
          media_category: prop.media.media_category || "Property Photo",
          is_preferred:
            prop.media.is_preferred !== undefined
              ? prop.media.is_preferred
              : true,
          order: 0,
        },
      ];
    } else if (typeof prop.media === "string") {
      // If media is a string URL
      mediaArray = [
        {
          media_url: prop.media,
          media_category: "Property Photo",
          is_preferred: true,
          order: 0,
        },
      ];
    }
  }

  // FIXED: Handle rooms safely
  let roomsArray: Array<{
    room_type: string;
    room_level: string;
    room_length: string | null;
    room_width: string | null;
    room_dimensions: string;
  }> = [];

  if (prop.rooms) {
    if (Array.isArray(prop.rooms)) {
      roomsArray = prop.rooms;
    } else if (typeof prop.rooms === "object") {
      // If rooms is a single object, wrap it in array
      roomsArray = [prop.rooms];
    }
  }

  const mappedProperty: Property = {
    PropertyKey: prop.listing_key || prop.PropertyKey || prop.id || "",
    ListingKey: prop.listing_key || prop.ListingKey || prop.id || "",
    list_price: prop.list_price,
    listing_key: prop.listing_key,
    ListPrice: listPrice,
    City: prop.city || prop.City || "",
    city: prop.city,
    StateOrProvince: prop.state_or_province || prop.StateOrProvince || "ON",
    PropertySubType:
      prop.category_type ||
      prop.property_sub_type ||
      prop.PropertySubType ||
      "Exclusive",
    BedroomsTotal: prop.bedrooms_total || prop.BedroomsTotal || 0,
    bedrooms_total: prop.bedrooms_total,
    BathroomsTotalInteger:
      prop.bathrooms_total_integer || prop.BathroomsTotalInteger || 0,
    bathrooms_total_integer: prop.bathrooms_total_integer,
    StandardStatus: prop.standard_status || prop.StandardStatus || "Active",
    standard_status: prop.standard_status,
    ModificationTimestamp:
      prop.ModificationTimestamp || new Date().toISOString(),
    unparsed_address: prop.unparsed_address,
    postal_code: prop.postal_code,
    latitude: prop.latitude,
    longitude: prop.longitude,
    public_remarks: prop.public_remarks,
    media: mediaArray, // FIXED: Use the properly formatted array
    rooms: roomsArray, // FIXED: Use the properly formatted array
    category_type: prop.category_type,
    photos_count: prop.photos_count,
    listing_url: prop.listing_url,
    building_area_total: prop.building_area_total,
    year_built: prop.year_built,

    // Fields for comparison component
    address: prop.unparsed_address || builtAddress || prop.address || "",
    location: prop.city || prop.City || "",
    province: prop.state_or_province || prop.StateOrProvince || "ON",
    postalCode: prop.postal_code || prop.PostalCode || "",
    cooling: prop.cooling || prop.Cooling || "",
    basement: prop.basement || prop.Basement || "",
    zoning: prop.zoning || prop.Zoning || "",
    parking_total: prop.parking_total || prop.ParkingTotal || 0,
    parking_features: prop.parking_features || prop.ParkingFeatures || "",
    total_actual_rent: prop.total_actual_rent,

    // Legacy fields - FIXED: Handle arrays safely
    Photos: mediaArray.map((m) => ({ PhotoURL: m.media_url })),
    Media: mediaArray,
    Rooms: roomsArray,
    LivingArea: prop.building_area_total
      ? parseFloat(prop.building_area_total)
      : null,
    YearBuilt: prop.year_built ? parseInt(prop.year_built) : null,
    PublicRemarks: prop.public_remarks,
    PostalCode: prop.postal_code,
    Latitude: prop.latitude,
    Longitude: prop.longitude,
    Description: prop.public_remarks,
    PropertyType:
      prop.category_type ||
      prop.property_sub_type ||
      prop.PropertyType ||
      "Exclusive",

    // Spread all other properties
    ...prop,
  };

  console.log("Mapped property:", mappedProperty);
  return mappedProperty;
}

// Property API functions
export async function fetchProperties(
  filters?: PropertyFilterParams,
): Promise<Property[]> {
  try {
    const exclusiveFilters: ExclusivePropertyFilterParams = {};

    if (filters) {
      if (filters.province) {
        const provinceMapping: { [key: string]: string } = {
          Ontario: "ON",
          Quebec: "QC",
          "British Columbia": "BC",
          Alberta: "AB",
          Manitoba: "MB",
          Saskatchewan: "SK",
          "Nova Scotia": "NS",
          "New Brunswick": "NB",
          "Newfoundland and Labrador": "NL",
          "Prince Edward Island": "PE",
          "Northwest Territories": "NT",
          Nunavut: "NU",
          Yukon: "YT",
        };
        exclusiveFilters.province =
          provinceMapping[filters.province] || filters.province;
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

    const response = await fetchExclusiveProperties(exclusiveFilters);

    return (response.results || []).map((prop: any) =>
      mapPropertyFromAPI(prop),
    );
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

// Exclusive Properties API function
export async function fetchExclusiveProperties(
  filters?: ExclusivePropertyFilterParams,
): Promise<{
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

    queryParams.append("limit", limit.toString());
    queryParams.append("offset", offset.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "limit" || key === "offset") return;

        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    console.log("Fetching exclusive properties from:", url);

    return await fetchAPI(url, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching exclusive properties:", error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null,
      updated_to_exclusive: 0,
    };
  }
}

// Lease Properties API function
export async function fetchLeaseProperties(
  filters?: LeasePropertyFilterParams,
): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();

    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;

    queryParams.append("limit", limit.toString());
    queryParams.append("offset", offset.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "limit" || key === "offset") return;

        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = `${API_BASE_URL}/api/mls/properties/lease-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    return await fetchAPI(url, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching lease properties:", error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null,
    };
  }
}

export async function fetchFilteredProperties(filters: Record<string, any>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;

    if (typeof value === "boolean") {
      if (value) params.append(key, "true");
    } else {
      params.append(key, String(value));
    }
  });

  // Change this line to match your Django URL structure
  const url = `${API_BASE_URL}/api/mls/properties/filter/?${params.toString()}`;
  console.log("FILTER URL →", url);

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Filter API error: ${res.status} → ${text}`);
  }

  return res.json();
}

// Fetch all exclusive properties
export async function fetchAllExclusiveProperties(): Promise<Property[]> {
  try {
    const response = await fetchExclusiveProperties({});
    return (response.results || []).map((prop: any) =>
      mapPropertyFromAPI(prop),
    );
  } catch (error) {
    console.error("Error fetching all exclusive properties:", error);
    return [];
  }
}

// Fetch all lease properties
export async function fetchAllLeaseProperties(): Promise<Property[]> {
  try {
    const response = await fetchLeaseProperties({});
    return (response.results || []).map((prop: any) =>
      mapPropertyFromAPI(prop),
    );
  } catch (error) {
    console.error("Error fetching all lease properties:", error);
    return [];
  }
}

// Fetch property by key
export async function fetchPropertyByKey(
  propertyKey: string,
): Promise<Property | null> {
  try {
    console.log("Fetching property by key:", propertyKey);
    const data = await fetchAPI<any>(
      `${API_BASE_URL}/api/mls/properties/${propertyKey}/`,
      {
        cache: "no-store",
      },
    );

    return {
      ...mapPropertyFromAPI(data),
      PropertyKey: data.listing_key || propertyKey,
      ListingKey: data.listing_key || propertyKey,
    };
  } catch (error) {
    console.error("Error fetching property by key:", error);
    return null;
  }
}

// Fetch Ontario properties
export async function fetchOntarioProperties(): Promise<Property[]> {
  return fetchProperties({ province: "Ontario" });
}

// Compare multiple properties API function - UPDATED
// Compare multiple properties API function - FIXED for your endpoint
export async function fetchCompareProperties(propertyKeys: string[]): Promise<{
  results: Property[];
  count: number;
}> {
  try {
    if (propertyKeys.length === 0) {
      console.log("No property keys provided for comparison");
      return {
        results: [],
        count: 0,
      };
    }

    console.log("Fetching compare for keys:", propertyKeys);

    // Your specific endpoint format: /api/mls/properties/comapare/?listing_key=X&listing_key=Y
    const queryParams = new URLSearchParams();

    // Add each listing_key as a separate parameter
    propertyKeys.forEach((key) => {
      if (key && key.trim()) {
        queryParams.append("listing_key", key.trim());
      }
    });

    const url = `${API_BASE_URL}/api/mls/properties/comapare/?${queryParams.toString()}`;
    console.log("Compare URL:", url);

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("Compare API Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Compare API error details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      // Try alternative endpoint format as fallback
      const altUrl = `${API_BASE_URL}/api/mls/properties/comapare/?ids=${propertyKeys.join(",")}`;
      console.log("Trying alternative URL:", altUrl);

      const altResponse = await fetch(altUrl, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log("Alternative endpoint worked:", altData);

        const results = (altData.results || altData.data || []).map(
          (prop: any) => mapPropertyFromAPI(prop),
        );

        return {
          results,
          count: results.length,
        };
      }

      throw new Error(
        `Compare API failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
      );
    }

    const responseData = await response.json();
    console.log("Compare API Response Data:", responseData);

    // Extract results from response
    const resultsArray =
      responseData.results ||
      responseData.data ||
      responseData.properties ||
      responseData ||
      [];
    console.log("Extracted results array:", resultsArray);

    // Handle case where response might be an array directly
    let results: Property[];
    if (Array.isArray(resultsArray)) {
      results = resultsArray.map((prop: any) => mapPropertyFromAPI(prop));
    } else if (resultsArray && typeof resultsArray === "object") {
      // If it's a single object, wrap it in an array
      results = [mapPropertyFromAPI(resultsArray)];
    } else {
      results = [];
    }

    console.log("Final mapped results:", results);

    return {
      results,
      count: results.length,
    };
  } catch (error) {
    console.error("Error in fetchCompareProperties:", error);

    // Ultimate fallback: fetch each property individually
    try {
      console.log("Using ultimate fallback: fetching properties individually");
      const properties = await Promise.all(
        propertyKeys.map((key) => fetchPropertyByKey(key)),
      );

      const validProperties = properties.filter(
        (p) => p !== null,
      ) as Property[];
      console.log("Fallback fetched properties:", validProperties.length);

      return {
        results: validProperties,
        count: validProperties.length,
      };
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return {
        results: [],
        count: 0,
      };
    }
  }
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
  building_area_min?: number;
  building_area_max?: number;
  lot_size_min?: number;
  lot_size_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  keywords?: string;
  has_photos?: boolean;
  standard_status?: string;
  limit?: number;
  offset?: number;
}

export async function fetchPreConnProperties(
  filters?: PreConnPropertyFilterParams,
): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  try {
    const queryParams = new URLSearchParams();

    const limit = filters?.limit || 6;
    const offset = filters?.offset || 0;

    queryParams.append("limit", limit.toString());
    queryParams.append("offset", offset.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "limit" || key === "offset") return;

        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const url = `${API_BASE_URL}/api/mls/properties/pre-conn-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    return await fetchAPI(url, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching pre-construction properties:", error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null,
    };
  }
}

export async function fetchAllPreConnProperties(): Promise<Property[]> {
  try {
    const response = await fetchPreConnProperties({});
    return (response.results || []).map((prop: any) =>
      mapPropertyFromAPI(prop),
    );
  } catch (error) {
    console.error("Error fetching all pre-construction properties:", error);
    return [];
  }
}

// Test functions
export async function testExclusiveEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/`;
    const response = await fetch(testUrl);
    console.log("Test response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Endpoint is working! Found", data.count || 0, "properties");
    }
  } catch (error) {
    console.error("Error testing exclusive endpoint:", error);
  }
}

export async function testLeaseEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/lease-properties/`;
    const response = await fetch(testUrl);
    console.log("Lease test response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Lease endpoint is working! Found",
        data.count || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing lease endpoint:", error);
  }
}

export async function testPriceRangeEndpoint(
  minPrice?: number,
  maxPrice?: number,
): Promise<void> {
  try {
    const queryParams = new URLSearchParams();
    if (minPrice) queryParams.append("price_min", minPrice.toString());
    if (maxPrice) queryParams.append("price_max", maxPrice.toString());

    const testUrl = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const response = await fetch(testUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "Price range test: Found",
        data?.results?.length || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing price range endpoint:", error);
  }
}

export async function testMLSFilterEndpoint(): Promise<void> {
  try {
    const testUrl = `${API_BASE_URL}/api/mls/properties/filter/?province=Ontario&status=Active`;
    const response = await fetch(testUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(
        "MLS filter test: Found",
        data?.value?.length || 0,
        "properties",
      );
    }
  } catch (error) {
    console.error("Error testing MLS filter endpoint:", error);
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
  },
): Promise<any> {
  const fieldName = options?.fieldName ?? "file";
  const authToken = options?.authToken ?? null;
  const additionalFormFields = options?.additionalFormFields ?? {};
  const useGet = options?.useGet ?? true;

  const urlBase = `${API_BASE_URL}/api/mls/properties/pre-conn-properties/`;

  if (useGet && file) {
    try {
      const text = await file.text();
      const encoded = encodeURIComponent(text);
      const filenameParam = file.name
        ? `&filename=${encodeURIComponent(file.name)}`
        : "";
      const extra = Object.entries(additionalFormFields)
        .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("");

      const url = `${urlBase}?csv=${encoded}${filenameParam}${extra}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const resp = await fetch(url, {
        method: "GET",
        headers,
        credentials: "same-origin",
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
      console.error("Error in uploadPreConnProperties (GET mode):", err);
      throw err;
    }
  } else if (!useGet && file) {
    try {
      const form = new FormData();
      form.append(fieldName, file);
      Object.entries(additionalFormFields).forEach(([k, v]) =>
        form.append(k, v),
      );

      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const resp = await fetch(urlBase, {
        method: "POST",
        headers,
        body: form,
        credentials: "same-origin",
      });

      const responseText = await resp.text();
      let data: any = responseText;
      try {
        data = JSON.parse(responseText);
      } catch (e) {}

      if (!resp.ok) {
        throw new Error(
          `POST upload failed: ${resp.status} ${resp.statusText}`,
        );
      }

      return data;
    } catch (err) {
      console.error("Error in uploadPreConnProperties (POST mode):", err);
      throw err;
    }
  } else {
    throw new Error("No file provided");
  }
}

// In lib/api/api.ts - Add this function
export async function fetchNewlyListedProperties(
  filters?: PropertyFilterParams & { days_threshold?: number },
): Promise<{
  results: any[];
  count: number;
  next: number | null;
  previous: number | null;
}> {
  const queryParams = new URLSearchParams();

  const limit = filters?.limit || 6;
  const offset = filters?.offset || 0;

  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());

  // Add days threshold if provided
  if (filters?.days_threshold) {
    queryParams.append("days_threshold", filters.days_threshold.toString());
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "limit" || key === "offset" || key === "days_threshold")
        return;

      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "boolean") {
          queryParams.append(key, value ? "true" : "false");
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const url = `${API_BASE_URL}/api/mls/properties/newly-listed-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

  return await fetchAPI(url, { cache: "no-store" });
}
