import { API_BASE_URL, fetchAPI } from "./client";

export interface PreconProperty {
  id: number;
  wp_id: number;
  title: string;
  slug: string;
  status: string;
  price: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  garages: number | null;
  area: string | null;
  lot_size: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string;
}

export interface PreconAuthor {
  id: number;
  display_name: string;
  email: string;
}

export interface PreconTaxonomy {
  id: number;
  taxonomy: string;
  name: string;
  slug: string;
}

export interface PreconAttachment {
  id: number;
  url: string;
  mime_type: string;
  title: string;
}

export interface PreconPropertyDetail extends PreconProperty {
  content_type: string;
  body: string;
  excerpt: string;
  published_at: string | null;
  author: PreconAuthor | null;
  taxonomies: PreconTaxonomy[];
  attachments: PreconAttachment[];
  meta: Record<string, string>;
}

export interface PreconPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: PreconProperty[];
}

export interface PreconBulkRowError {
  row: number;
  wp_id: string;
  error: string;
}

export interface PreconBulkUploadResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: PreconBulkRowError[];
}

export interface FetchPreconPropertiesParams {
  page?: number;
  pageSize?: number;
}

export function fetchPreconProperties(
  params: FetchPreconPropertiesParams = {},
): Promise<PreconPage> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("page_size", String(params.pageSize));
  const query = search.toString();
  return fetchAPI<PreconPage>(
    `${API_BASE_URL}/api/mls/precon-properties/${query ? `?${query}` : ""}`,
  );
}

export function fetchPreconProperty(id: number | string): Promise<PreconPropertyDetail> {
  return fetchAPI<PreconPropertyDetail>(
    `${API_BASE_URL}/api/mls/precon-properties/${encodeURIComponent(String(id))}/`,
  );
}

export async function bulkUploadPreconProperties(
  file: File,
): Promise<PreconBulkUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/mls/precon-properties/bulk-upload/`,
    { method: "POST", body: formData },
  );

  const rawBody = await response.text();
  let parsed: unknown = rawBody;
  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = rawBody;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed && "detail" in parsed
        ? String((parsed as { detail: unknown }).detail)
        : typeof parsed === "string"
          ? parsed
          : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parsed as PreconBulkUploadResponse;
}
