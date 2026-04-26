// lib/api/properties.ts
import { API_BASE_URL, fetchAPI } from "./client";
import {
  Property,
  PropertyFilterParams,
  ExclusivePropertyFilterParams,
  LeasePropertyFilterParams,
  PreConnPropertyFilterParams,
  NearestSchoolsResponse,
  PropertyTypeOption,
} from "./types";
import { PropertyResponseSchema } from "./propertySchema";
import { fetchWPPreconPropertyAction } from "../actions/wp-precon";

/**
 * Maps static WP JSON Pre-Construction data to our standard Property schema
 */
export function mapPreconToProperty(p: any): Property {
  const meta = p.property_meta || {};
  const getMetaStr = (key: string) =>
    meta[key] && meta[key][0] ? meta[key][0] : "";

  const priceStr = getMetaStr("fave_property_price") || "0";
  const bedrooms = getMetaStr("fave_property_bedrooms") || "0";
  const bathrooms = getMetaStr("fave_property_bathrooms") || "0";
  const sizeStr = getMetaStr("fave_property_size") || "";
  const address =
    getMetaStr("fave_property_address") || p.title?.rendered || "";
  const developer = getMetaStr("fave_developer") || "";
  const completion = getMetaStr("fave_estimated-completion") || "";
  const mainImage = p.yoast_head_json?.og_image?.[0]?.url || "";
  const projectName = p.title?.rendered || "";

  return {
    listing_key: `precon_${p.id}`,
    listing_id: `precon_${p.id}`,
    ListingKey: `precon_${p.id}`,
    PropertyKey: `precon_${p.id}`,
    address: address.trim(),
    city: "Pre-Construction",
    City: "Pre-Construction",
    list_price: priceStr,
    ListPrice: parseFloat(priceStr) || 0,
    bedrooms_total: bedrooms,
    bathrooms_total_integer: bathrooms,
    building_area_total: sizeStr,
    standard_status: "Pre-Construction",
    StandardStatus: "Pre-Construction",
    developer,
    estimated_completion: completion,
    property_sub_type: "Pre-Construction",
    PropertySubType: "Pre-Construction",
    public_remarks: p.content?.rendered?.replace(/<[^>]*>?/gm, "").trim(),
    PublicRemarks: p.content?.rendered?.replace(/<[^>]*>?/gm, "").trim(),
    media: [{ media_url: mainImage, is_preferred: true, order: 1 } as any],
    project_name: projectName,
  };
}

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
          const queryKey = key === "property_sub_type" ? "property_type" : key;
          if (typeof value === "boolean") {
            queryParams.append(queryKey, value ? "true" : "false");
          } else {
            queryParams.append(queryKey, value.toString());
          }
        }
      });
    }

    const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    // console.log("Fetching exclusive properties from:", url);

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
          const queryKey = key === "property_sub_type" ? "property_type" : key;
          if (typeof value === "boolean") {
            queryParams.append(queryKey, value ? "true" : "false");
          } else {
            queryParams.append(queryKey, value.toString());
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

    const queryKey = key === "property_sub_type" ? "property_type" : key;
    if (typeof value === "boolean") {
      if (value) params.append(queryKey, "true");
    } else {
      params.append(queryKey, String(value));
    }
  });

  const url = `${API_BASE_URL}/api/mls/properties/filter/?${params.toString()}`;
  // console.log("FILTER URL →", url);

  try {
    return await fetchAPI(url, { cache: "no-store" });
  } catch (error) {
    console.error("Filter API error:", error);
    return { results: [], count: 0 };
  }
}

const DEFAULT_PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: "Detached", label: "Detached" },
  { value: "Semi-Detached", label: "Semi-Detached" },
  { value: "Condo Apt", label: "Condo Apt" },
  { value: "Freehold Townhouse", label: "Freehold Townhouse" },
  { value: "Condo Townhouse", label: "Condo Townhouse" },
];

/**
 * Fetch available property types for filters.
 */
export async function fetchPropertyTypes(params?: {
  province?: string;
  listing_type?: "all" | "exclusive" | "lease" | "precon";
}): Promise<PropertyTypeOption[]> {
  try {
    const query = new URLSearchParams();
    if (params?.province) query.append("province", params.province);
    if (params?.listing_type) query.append("listing_type", params.listing_type);

    const url = `${API_BASE_URL}/api/mls/properties/property-types/${query.toString() ? `?${query.toString()}` : ""}`;
    const data = await fetchAPI<{ results?: PropertyTypeOption[] }>(url, {
      cache: "no-store",
    });
    const results = Array.isArray(data?.results) ? data.results : [];

    if (results.length === 0) return DEFAULT_PROPERTY_TYPES;

    return results.filter(
      (item) => !!item && typeof item.value === "string" && item.value.trim() !== "",
    );
  } catch (error) {
    console.error("Error fetching property types:", error);
    return DEFAULT_PROPERTY_TYPES;
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
    if (propertyKey.startsWith("precon_") || propertyKey.startsWith("property-")) {
      if (propertyKey.startsWith("precon_")) {
        const idStr = propertyKey.replace("precon_", "");
        return await fetchWPPreconPropertyAction(idStr);
      }
      // Synthetic key from CompareContext, just return null
      return null;
    }

    // console.log("Fetching property by key:", propertyKey);
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

    // Partition keys into pre-construction and MLS keys
    const preConKeys = propertyKeys.filter((k) => k.startsWith("precon_"));
    const mlsKeys = propertyKeys.filter(
      (k) => !k.startsWith("precon_") && !k.startsWith("property-"),
    );

    // Fetch pre-con ones locally via new WP fetch
    const preConResults = (
      await Promise.all(
        preConKeys.map(async (k) => {
          const idStr = k.replace("precon_", "");
          return await fetchWPPreconPropertyAction(idStr);
        }),
      )
    ).filter(Boolean) as Property[];

    let mlsResults: Property[] = [];

    if (mlsKeys.length > 0) {
      const queryParams = new URLSearchParams();
      mlsKeys.forEach((key) => {
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

        if (Array.isArray(resultsArray)) {
          mlsResults = resultsArray.map((prop: any) =>
            mapPropertyFromAPI(prop),
          );
        } else if (resultsArray && typeof resultsArray === "object") {
          mlsResults = [mapPropertyFromAPI(resultsArray)];
        }
      } catch (error) {
        console.warn(
          "Comparison API failed, falling back to individual fetches:",
          error,
        );
        const properties = await Promise.all(
          mlsKeys.map((key) => fetchPropertyByKey(key)),
        );
        mlsResults = properties.filter((p) => p !== null) as Property[];
      }
    }

    const finalResults = [...preConResults, ...mlsResults];

    return { results: finalResults, count: finalResults.length };
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
          const queryKey = key === "property_sub_type" ? "property_type" : key;
          if (typeof value === "boolean") {
            queryParams.append(queryKey, value ? "true" : "false");
          } else {
            queryParams.append(queryKey, value.toString());
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
        const queryKey = key === "property_sub_type" ? "property_type" : key;
        if (typeof value === "boolean") {
          queryParams.append(queryKey, value ? "true" : "false");
        } else {
          queryParams.append(queryKey, value.toString());
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

    const currentId = property.listing_key || property.ListingKey;
    const fetchCandidates = async (
      filters: Record<string, any>,
    ): Promise<Property[]> => {
      const data = await fetchFilteredProperties({
        ...filters,
        limit: limit + 12, // fetch enough headroom for de-dup + self filtering
      });
      const results = (data.results || []).map(mapPropertyFromAPI);
      return results.filter(
        (p: Property) => (p.listing_key || p.ListingKey) !== currentId,
      );
    };

    const mergeUnique = (acc: Property[], incoming: Property[]) => {
      const seen = new Set(
        acc.map((p) => String(p.listing_key || p.ListingKey || "")),
      );
      for (const item of incoming) {
        const key = String(item.listing_key || item.ListingKey || "");
        if (!key || seen.has(key)) continue;
        acc.push(item);
        seen.add(key);
        if (acc.length >= limit) break;
      }
      return acc;
    };

    // Fallback chain:
    // 1) strict: city + type + ±20%
    // 2) relaxed price: city + type + ±35%
    // 3) relaxed type: city + ±35%
    // 4) broad city-only
    const strictFilters: Record<string, any> = { city };
    if (propertyType) strictFilters.property_type = propertyType;
    if (price) {
      strictFilters.price_min = price * 0.8;
      strictFilters.price_max = price * 1.2;
    }

    const relaxedPriceFilters: Record<string, any> = { city };
    if (propertyType) relaxedPriceFilters.property_type = propertyType;
    if (price) {
      relaxedPriceFilters.price_min = price * 0.65;
      relaxedPriceFilters.price_max = price * 1.35;
    }

    const relaxedTypeFilters: Record<string, any> = { city };
    if (price) {
      relaxedTypeFilters.price_min = price * 0.65;
      relaxedTypeFilters.price_max = price * 1.35;
    }

    const cityOnlyFilters: Record<string, any> = { city };

    const buckets = await Promise.all([
      fetchCandidates(strictFilters),
      fetchCandidates(relaxedPriceFilters),
      fetchCandidates(relaxedTypeFilters),
      fetchCandidates(cityOnlyFilters),
    ]);

    let finalResults: Property[] = [];
    for (const bucket of buckets) {
      finalResults = mergeUnique(finalResults, bucket);
      if (finalResults.length >= limit) break;
    }

    return finalResults.slice(0, limit);
  } catch (error) {
    console.error("Error fetching similar properties:", error);
    return [];
  }
}
