// lib/api/properties.ts
import { API_BASE_URL, fetchAPI } from "./client";
import {
  Property,
  PropertyFilterParams,
  ExclusivePropertyFilterParams,
  LeasePropertyFilterParams,
  PreConnPropertyFilterParams,
  NearestSchoolsResponse,
} from "./types";
import { PropertyResponseSchema } from "./propertySchema";

/**
 * Helper function to map API response to Property interface
 */
export function mapPropertyFromAPI(prop: any): Property {
  try {
    return PropertyResponseSchema.parse(prop) as Property;
  } catch (error) {
    console.error(
      "Zod Schema Parsing Error for property:",
      prop?.id || prop?.listing_key,
      error,
    );
    // Fallback simply returns the messy object if parsing critically fails
    return prop as Property;
  }
}

/**
 * Search properties by query string (city, address, postal code, keywords)
 */
export async function searchProperties(
  query: string,
  extraFilters?: Record<string, any>,
): Promise<Property[]> {
  try {
    const params: Record<string, any> = { search: query, ...extraFilters };
    const data = (await fetchFilteredProperties(params)) as any;
    const results: any[] = data.results || data.value || [];
    return results.map(mapPropertyFromAPI);
  } catch (error) {
    console.error("Error searching properties:", error);
    return [];
  }
}

/**
 * Fetch properties with basic filters
 */
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

/**
 * Fetch exclusive properties with detailed filters
 */
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

    const limit = filters?.limit || 12;
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

/**
 * Fetch lease properties with detailed filters
 */
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

/**
 * Generic filtered properties fetcher
 */
export async function fetchFilteredProperties(
  filters: Record<string, any>,
): Promise<any> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;

    if (typeof value === "boolean") {
      if (value) params.append(key, "true");
    } else {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}/api/mls/properties/filter/?${params.toString()}`;
  console.log("FILTER URL →", url);

  try {
    return await fetchAPI(url, { cache: "no-store" });
  } catch (error) {
    console.error("Filter API error:", error);
    return { results: [], count: 0 };
  }
}

/**
 * Fetch all exclusive properties
 */
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

/**
 * Fetch all lease properties
 */
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

/**
 * Fetch a single property by its key
 */
export async function fetchPropertyByKey(
  propertyKey: string,
): Promise<Property | null> {
  try {
    console.log("Fetching property by key:", propertyKey);
    const data = await fetchAPI<any>(
      `${API_BASE_URL}/api/mls/properties/${propertyKey}/`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      },
    );

    return {
      ...mapPropertyFromAPI(data),
      PropertyKey: data.listing_key || propertyKey,
      ListingKey: data.listing_key || propertyKey,
    };
  } catch (error: any) {
    const errorMsg = error.message || "";
    // Check if it's a "Not Found" error (either status 404 or OData 404 wrapped in 400)
    if (
      errorMsg.includes(":404:") ||
      errorMsg.includes("not exist") ||
      errorMsg.includes("does not exist")
    ) {
      console.warn(
        `Property with key ${propertyKey} not found or no longer available.`,
      );
      return null;
    }

    console.error(`Unexpected error fetching property ${propertyKey}:`, error);
    return null;
  }
}

/**
 * Fetch Ontario properties
 */
export async function fetchOntarioProperties(): Promise<Property[]> {
  return fetchProperties({ province: "Ontario" });
}

/**
 * Compare multiple properties
 */
export async function fetchCompareProperties(propertyKeys: string[]): Promise<{
  results: Property[];
  count: number;
}> {
  try {
    if (propertyKeys.length === 0) {
      return { results: [], count: 0 };
    }

    const queryParams = new URLSearchParams();
    propertyKeys.forEach((key) => {
      if (key && key.trim()) {
        queryParams.append("listing_key", key.trim());
      }
    });

    const url = `${API_BASE_URL}/api/mls/properties/compare/?${queryParams.toString()}`;

    try {
      const responseData = await fetchAPI<any>(url, { cache: "no-store" });

      const resultsArray =
        responseData.results ||
        responseData.data ||
        responseData.properties ||
        responseData ||
        [];

      let results: Property[];
      if (Array.isArray(resultsArray)) {
        results = resultsArray.map((prop: any) => mapPropertyFromAPI(prop));
      } else if (resultsArray && typeof resultsArray === "object") {
        results = [mapPropertyFromAPI(resultsArray)];
      } else {
        results = [];
      }

      return { results, count: results.length };
    } catch (error) {
      console.warn(
        "Comparison API failed, falling back to individual fetches:",
        error,
      );
      // Fallback to fetch individually
      const properties = await Promise.all(
        propertyKeys.map((key) => fetchPropertyByKey(key)),
      );
      const validProperties = properties.filter(
        (p) => p !== null,
      ) as Property[];
      return { results: validProperties, count: validProperties.length };
    }
  } catch (error) {
    console.error("Error in fetchCompareProperties:", error);
    return { results: [], count: 0 };
  }
}

/**
 * Fetch pre-construction properties
 */
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
    return { results: [], count: 0, next: null, previous: null };
  }
}

/**
 * Fetch all pre-construction properties
 */
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

/**
 * Fetch newly listed properties
 */
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

/**
 * Fetch nearest schools for a given location
 */
export async function fetchNearestSchools(
  lat: number,
  lon: number,
  radius: number = 5000,
): Promise<NearestSchoolsResponse | null> {
  try {
    const url = `${API_BASE_URL}/api/mls/nearest-school/?lat=${lat}&lon=${lon}&radius=${radius}`;
    return await fetchAPI<NearestSchoolsResponse>(url, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching nearest schools:", error);
    return null;
  }
}

/**
 * Fetch similar properties based on city, price range, and property type
 */
export async function fetchSimilarProperties(
  property: Property,
  limit: number = 4,
): Promise<Property[]> {
  try {
    const city = property.city || property.City;
    const propertyType = property.category_type || property.PropertySubType;
    const price =
      typeof property.list_price === "string"
        ? parseFloat(property.list_price)
        : (property.list_price as number) || (property.ListPrice as number);

    if (!city) return [];

    const filters: any = {
      city,
      limit: limit + 1, // Fetch one extra to account for the current property
    };

    if (propertyType) {
      filters.property_type = propertyType;
    }

    if (price) {
      filters.price_min = price * 0.8;
      filters.price_max = price * 1.2;
    }

    const data = await fetchFilteredProperties(filters);
    const results = (data.results || []).map(mapPropertyFromAPI);

    // Filter out the current property
    const currentId = property.listing_key || property.ListingKey;
    return results
      .filter((p: Property) => (p.listing_key || p.ListingKey) !== currentId)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching similar properties:", error);
    return [];
  }
}
