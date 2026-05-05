import { z } from "zod";
import { API_BASE_URL, fetchAPI } from "./client";

const AutocompleteItemSchema = z.object({
  label: z.string(),
  listing_key: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  fsa: z.string(),
});

export const ValuationAutocompleteResponseSchema = z.object({
  results: z.array(AutocompleteItemSchema),
});

export type ValuationAutocompleteItem = z.infer<typeof AutocompleteItemSchema>;

export const ValuationLookupResponseSchema = z.object({
  listing_key: z.string(),
  unparsed_address: z.string(),
  postal_code: z.string(),
  city: z.string(),
  city_region: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bedrooms_total: z.number().nullable(),
  bedrooms_partial: z.number().nullable(),
  bathrooms_total: z.number().nullable(),
  bathrooms_partial: z.number().nullable(),
  living_area: z.number().nullable(),
  above_grade_finished_area: z.number().nullable(),
  parking_total: z.number().nullable(),
  tax_annual_amount: z.number().nullable(),
  property_sub_type: z.string(),
  lot_frontage: z.number().nullable(),
  lot_depth: z.number().nullable(),
  lot_size_dimensions: z.string(),
});

export type ValuationLookupPayload = z.infer<typeof ValuationLookupResponseSchema>;

const BreakdownItemSchema = z.object({
  feature: z.string(),
  delta: z.number(),
});

const CompSchema = z.object({
  listing_key: z.string().optional(),
  price: z.number().optional(),
  bedrooms_total: z.number().nullable().optional(),
  bathrooms_total_integer: z.number().nullable().optional(),
  living_area: z.number().nullable().optional(),
  unparsed_address: z.string().optional(),
  city: z.string().optional(),
  distance_km: z.number().optional(),
  source: z.string().optional(),
});

const AgentInnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  photo_url: z.string(),
  brokerage: z.string(),
  bio: z.string(),
});

export const ValuationEstimateResponseSchema = z.object({
  estimate: z.object({
    low: z.number(),
    market: z.number(),
    high: z.number(),
    quick_sale_low: z.number(),
    quick_sale_high: z.number(),
  }),
  breakdown: z.array(BreakdownItemSchema),
  trend: z.object({
    pct_30d: z.number(),
    applied: z.number(),
  }),
  comps: z.array(CompSchema),
  agent: z.union([AgentInnerSchema, z.null()]),
  beta: z.boolean(),
  sparse: z.boolean(),
  confidence: z.string().optional(),
  detail: z.string().optional(),
});

export type ValuationEstimateResponse = z.infer<
  typeof ValuationEstimateResponseSchema
>;

export type ValuationEstimateRequest = {
  listing_key?: string;
  latitude?: number | null;
  longitude?: number | null;
  postal_code?: string;
  city?: string;
  city_region?: string;
  property_sub_type?: string;
  bedrooms_total?: number | null;
  bedrooms_partial?: number | null;
  bathrooms_total?: number | null;
  living_area?: number | null;
  parking_total?: number | null;
  tax_annual_amount?: number | null;
  lot_frontage?: number | null;
  lot_depth?: number | null;
};

export async function getValuationAutocomplete(
  q: string,
): Promise<z.infer<typeof ValuationAutocompleteResponseSchema>> {
  const url = `${API_BASE_URL}/api/mls/valuation/autocomplete/?q=${encodeURIComponent(q)}`;
  const raw = await fetchAPI<unknown>(url);
  return ValuationAutocompleteResponseSchema.parse(raw);
}

export async function getValuationLookup(params: {
  listing_key?: string;
  address?: string;
}): Promise<ValuationLookupPayload> {
  const sp = new URLSearchParams();
  if (params.listing_key) sp.set("listing_key", params.listing_key);
  if (params.address) sp.set("address", params.address);
  const url = `${API_BASE_URL}/api/mls/valuation/lookup/?${sp.toString()}`;
  const raw = await fetchAPI<unknown>(url);
  return ValuationLookupResponseSchema.parse(raw);
}

export async function postValuationEstimate(
  body: ValuationEstimateRequest,
): Promise<ValuationEstimateResponse> {
  const url = `${API_BASE_URL}/api/mls/valuation/estimate/`;
  const raw = await fetchAPI<unknown>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return ValuationEstimateResponseSchema.parse(raw);
}

export const PropertyTypesForValuationSchema = z.object({
  results: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      count: z.number(),
    }),
  ),
});

export async function getPropertyTypesForValuation(): Promise<
  z.infer<typeof PropertyTypesForValuationSchema>["results"]
> {
  const url = `${API_BASE_URL}/api/mls/properties/property-types/?listing_type=all`;
  const raw = await fetchAPI<unknown>(url);
  const parsed = PropertyTypesForValuationSchema.parse(raw);
  return parsed.results;
}
