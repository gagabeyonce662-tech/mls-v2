// lib/api/properties.ts
import { API_BASE_URL, fetchAPI } from "./client";
import {
  Property,
  PropertyFilterParams,
  ExclusivePropertyFilterParams,
  LeasePropertyFilterParams,
  PreConnPropertyFilterParams,
} from "./types";

/**
 * Helper function to map API response to Property interface
 */
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

  // Handle media properly
  let mediaArray: Array<{
    media_url: string;
    media_category: string;
    is_preferred: boolean;
    order: number;
  }> = [];

  if (prop.media) {
    if (Array.isArray(prop.media)) {
      mediaArray = prop.media;
    } else if (typeof prop.media === "object" && prop.media.media_url) {
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

  // Handle rooms safely
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
    media: mediaArray,
    rooms: roomsArray,
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

    // Legacy fields
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

  return mappedProperty;
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
    const data = await fetchFilteredProperties(params);
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

  const url = `${API_BASE_URL}/api/mls/properties/filter/?${params.toString()}`;
  console.log("FILTER URL →", url);

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Filter API error: ${res.status} → ${text}`);
  }

  return res.json();
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

    const url = `${API_BASE_URL}/api/mls/properties/comapare/?${queryParams.toString()}`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // Fallback to fetch individually
      const properties = await Promise.all(
        propertyKeys.map((key) => fetchPropertyByKey(key)),
      );
      const validProperties = properties.filter(
        (p) => p !== null,
      ) as Property[];
      return { results: validProperties, count: validProperties.length };
    }

    const responseData = await response.json();
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
