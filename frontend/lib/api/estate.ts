import { API_BASE_URL, fetchAPI } from "./client";

export interface EstateProjectCardData {
  id: number;
  title: string;
  slug: string | null;
  publication_status: string;
  developer: string | null;
  occupancy_year: number | null;
  address: string | null;
  city: string | null;
  province: string | null;
  featured_image_url: string | null;
  is_featured: boolean;
  lowest_price_display: string | null;
}

export interface EstateContentSection {
  id: number;
  heading: string;
  html: string;
  display_order: number;
}

export interface EstateUnitType {
  id: number;
  name: string;
  description: string;
  display_order: number;
}

export interface EstatePrice {
  id: number;
  unit_type_id: number | null;
  display_text: string;
  amount: string | null;
  currency: string;
  display_order: number;
}

export interface EstateDepositInstallment {
  id: number;
  milestone: string;
  amount_text: string;
  amount: string | null;
  percentage: string | null;
  display_order: number;
}

export interface EstateDepositPlan {
  id: number;
  unit_type_id: number | null;
  title: string;
  display_order: number;
  installments: EstateDepositInstallment[];
}

export interface EstateProject extends Omit<
  EstateProjectCardData,
  "lowest_price_display"
> {
  postal_code: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
  sections: EstateContentSection[];
  unit_types: EstateUnitType[];
  prices: EstatePrice[];
  deposit_plans: EstateDepositPlan[];
  incentives: Array<{ id: number; description: string }>;
  amenities: Array<{
    id: number;
    description: string;
    travel_time_minutes: number | null;
  }>;
  documents: Array<{
    id: number;
    label: string;
    document_type: string;
    requires_phone_verification: boolean;
  }>;
}

type ProjectLocation = Pick<
  EstateProjectCardData,
  "address" | "city" | "province"
>;
type ProjectPrice = Pick<EstateProjectCardData, "lowest_price_display">;
type ProjectFacts = Pick<EstateProjectCardData, "developer" | "occupancy_year">;

export interface EstateProjectFact {
  label: "Developer" | "Occupancy";
  value: string;
}

export function getEstateProjectUrl(
  project: Pick<EstateProjectCardData, "id" | "slug">,
): string {
  const lookup = project.slug?.trim() || String(project.id);
  return `/pre-construction/${encodeURIComponent(lookup)}`;
}

export function getEstateProjectLocation(project: ProjectLocation): string {
  const parts = [project.address, project.city, project.province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : "Address unavailable";
}

export function getEstateProjectPriceLabel(project: ProjectPrice): string {
  return project.lowest_price_display?.trim() || "Contact for pricing";
}

export function getEstateProjectFacts(
  project: ProjectFacts,
): EstateProjectFact[] {
  const facts: EstateProjectFact[] = [];
  const developer = project.developer?.trim();
  if (developer) facts.push({ label: "Developer", value: developer });
  if (project.occupancy_year != null) {
    facts.push({ label: "Occupancy", value: String(project.occupancy_year) });
  }
  return facts;
}

export const fetchEstateProjects = () =>
  fetchAPI<EstateProjectCardData[]>(`${API_BASE_URL}/api/mls/estate-projects/`);

export const fetchEstateProject = (idOrSlug: string) =>
  fetchAPI<EstateProject>(
    `${API_BASE_URL}/api/mls/estate-projects/${encodeURIComponent(idOrSlug)}/`,
  );

export async function requestEstateDocument(
  documentId: number,
  phone?: string,
) {
  return fetchAPI<{ intent_id: number; verification_required: boolean }>(
    `${API_BASE_URL}/api/mls/estate-documents/${documentId}/intent/`,
    { method: "POST", body: JSON.stringify({ phone }) },
  );
}

export async function accessEstateDocument(documentId: number) {
  const response = await fetchAPI<{ access_url: string }>(
    `${API_BASE_URL}/api/mls/estate-documents/${documentId}/access/`,
    { method: "POST" },
  );
  window.location.assign(response.access_url);
}
