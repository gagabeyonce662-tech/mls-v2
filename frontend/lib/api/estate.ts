import { API_BASE_URL, fetchAPI } from "./client";

export interface EstateProject {
  id: number; title: string; slug: string; publication_status: string;
  developer: string; occupancy_year: number | null; address: string; city: string;
  province: string; featured_image_url: string; is_featured: boolean;
  sections?: Array<{id:number; heading:string; html:string; display_order:number}>;
  unit_types?: Array<{id:number; name:string; description:string; display_order:number}>;
  prices?: Array<{id:number; unit_type_id:number|null; display_text:string; amount:string|null; currency:string; display_order:number}>;
  deposit_plans?: Array<{id:number; title:string; installments:Array<{id:number; milestone:string; amount_text:string; percentage:string|null}>}>;
  incentives?: Array<{id:number; description:string}>;
  amenities?: Array<{id:number; description:string; travel_time_minutes:number|null}>;
  documents?: Array<{id:number; label:string; document_type:string; requires_phone_verification:boolean}>;
}

export const fetchEstateProjects = () => fetchAPI<EstateProject[]>(`${API_BASE_URL}/api/mls/estate-projects/`);
export const fetchEstateProject = (idOrSlug: string) => fetchAPI<EstateProject>(`${API_BASE_URL}/api/mls/estate-projects/${encodeURIComponent(idOrSlug)}/`);

export async function requestEstateDocument(documentId: number, phone?: string) {
  return fetchAPI<{intent_id:number; verification_required:boolean}>(`${API_BASE_URL}/api/mls/estate-documents/${documentId}/intent/`, {method:"POST", body:JSON.stringify({phone})});
}

export async function accessEstateDocument(documentId: number) {
  const response = await fetchAPI<{access_url:string}>(`${API_BASE_URL}/api/mls/estate-documents/${documentId}/access/`, {method:"POST"});
  window.location.assign(response.access_url);
}
