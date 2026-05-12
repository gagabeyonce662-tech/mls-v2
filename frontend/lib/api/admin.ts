// lib/api/admin.ts
import { API_BASE_URL } from "./client";

/**
 * Shared helper to extract error messages from a response
 */
async function handleResponseError(res: Response, fallbackTitle: string) {
  let errorMessage = fallbackTitle;
  try {
    const data = await res.json();
    // Common API error structures: { detail: "..." } or { error: "..." } or { field: ["error"] }
    if (data.detail) errorMessage = data.detail;
    else if (data.error) errorMessage = data.error;
    else if (typeof data === 'object') errorMessage = JSON.stringify(data);
  } catch {
    const text = await res.text();
    errorMessage = text || `${res.status} ${res.statusText}`;
  }
  throw new Error(errorMessage);
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Upload pre-construction properties via CSV
 */
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
  const useGet = options?.useGet ?? false;

  const urlBase = `${API_BASE_URL}/api/mls/properties/upload-pre-conn/`;

  if (!file) throw new Error("No file provided");

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

/**
 * CRUD: Create a new property
 */
export async function createProperty(data: FormData): Promise<any> {
  const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/`;
  try {
    const response = await fetch(url, {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      const status = response.status;
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      const error: any = new Error("Failed to create property");
      error.status = status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
}

/**
 * CRUD: Update an existing property
 */
export async function updateProperty(
  imgKey: string,
  data: FormData,
): Promise<any> {
  const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${imgKey}/`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update property: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
}

/**
 * CRUD: Delete a property
 */
export async function deleteProperty(listingKey: string): Promise<boolean> {
  const url = `${API_BASE_URL}/api/mls/properties/exclusive-properties/${listingKey}/`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to delete property: ${response.status} ${errorText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting property:", error);
    return false;
  }
}

export type EstatePropertyRecord = Record<string, any>;

export interface EstatePropertyListResponse {
  count: number;
  page: number;
  page_size: number;
  results: EstatePropertyRecord[];
}

export async function fetchEstatePropertySchema(): Promise<{
  table: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
}> {
  const url = `${API_BASE_URL}/api/mls/estate-properties/schema/`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load schema: ${res.status}`);
  return res.json();
}

export async function fetchEstateProperties(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  city?: string;
  standard_status?: string;
  publish_status?: string;
  expires_from?: string;
  expires_to?: string;
}): Promise<EstatePropertyListResponse> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  if (params?.search) sp.set("search", params.search);
  if (params?.city) sp.set("city", params.city);
  if (params?.standard_status) sp.set("standard_status", params.standard_status);
  if (params?.publish_status) sp.set("publish_status", params.publish_status);
  if (params?.expires_from) sp.set("expires_from", params.expires_from);
  if (params?.expires_to) sp.set("expires_to", params.expires_to);
  const query = sp.toString();
  const url = `${API_BASE_URL}/api/mls/estate-properties/${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load estate properties: ${res.status}`);
  return res.json();
}

export async function fetchEstatePropertyById(id: string | number): Promise<EstatePropertyRecord> {
  const url = `${API_BASE_URL}/api/mls/estate-properties/${id}/`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load estate property: ${res.status}`);
  return res.json();
}

export async function createEstateProperty(payload: EstatePropertyRecord): Promise<EstatePropertyRecord> {
  const url = `${API_BASE_URL}/api/mls/estate-properties/`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateEstateProperty(
  id: string | number,
  payload: EstatePropertyRecord,
): Promise<EstatePropertyRecord> {
  const url = `${API_BASE_URL}/api/mls/estate-properties/${id}/`;
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteEstateProperty(id: string | number): Promise<void> {
  const url = `${API_BASE_URL}/api/mls/estate-properties/${id}/`;
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}
