// lib/api/admin.ts
import { API_BASE_URL } from "./client";

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
