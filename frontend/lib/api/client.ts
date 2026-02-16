// lib/api/client.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://staging.vsell4u.ca";

/**
 * Enhanced fetch wrapper with better error handling
 */
export async function fetchAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    console.log(`API Request: ${url} - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
      );
    }

    const data = await response.json();
    console.log(`API Response from ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}
