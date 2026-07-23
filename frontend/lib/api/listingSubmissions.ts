import { API_BASE_URL, fetchAPI } from "./client";

export type ListingSubmissionStatus =
  | "draft" | "submitted" | "under_review" | "needs_changes" | "approved" | "rejected" | "withdrawn";

export interface ListingSubmission {
  id: number;
  submitter_type: "owner" | "agent" | "builder";
  submitter_type_label: string;
  purpose: "sale" | "rent";
  purpose_label: string;
  status: ListingSubmissionStatus;
  status_label: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  property_type: string;
  bedrooms: string | null;
  bathrooms: string | null;
  interior_area_sqft: number | null;
  asking_price: string | null;
  available_from: string | null;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  ownership_confirmed: boolean;
  publication_consent: boolean;
  review_note: string;
  submitted_at: string | null;
  updated_at: string;
  media: { id: number; media_type: string; file_url: string; display_order: number }[];
}

export type ListingSubmissionPayload = Omit<
  ListingSubmission,
  "id" | "submitter_type_label" | "purpose_label" | "status" | "status_label" |
  "review_note" | "submitted_at" | "updated_at" | "media"
>;

const url = (path: string) => `${API_BASE_URL}/api/mls/listing-submissions/${path}`;

export function createListingSubmission(payload: Partial<ListingSubmissionPayload>) {
  return fetchAPI<ListingSubmission>(url(""), {
    method: "POST", body: JSON.stringify(payload), cache: "no-store",
  });
}

export function getMyListingSubmissions() {
  return fetchAPI<ListingSubmission[]>(url("mine/"), { cache: "no-store" });
}

export function submitListingSubmission(id: number) {
  return fetchAPI<ListingSubmission>(url(`${id}/submit/`), { method: "POST", cache: "no-store" });
}

export function withdrawListingSubmission(id: number) {
  return fetchAPI<ListingSubmission>(url(`${id}/withdraw/`), { method: "POST", cache: "no-store" });
}

export async function uploadListingSubmissionMedia(id: number, file: File, mediaType = "photo") {
  const body = new FormData();
  body.append("file", file);
  body.append("media_type", mediaType);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const response = await fetch(url(`${id}/media/`), {
    method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Unable to upload file.");
  return response.json();
}
