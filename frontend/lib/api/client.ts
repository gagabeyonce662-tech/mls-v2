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
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const errorMessage = typeof errorData === 'object'
        ? JSON.stringify(errorData)
        : errorData;

      // Only log as error if it's not a common "not found" scenario which the caller might handle
      if (response.status !== 404 && !errorMessage.includes("404") && !errorMessage.includes("not exist")) {
        console.error(`API Error ${response.status}: ${errorMessage}`);
      } else {
        console.warn(`API Reference Error ${response.status}: Resource might not exist.`);
      }

      throw new Error(
        `API_ERROR:${response.status}:${errorMessage}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Avoid double logging if it's already logged above
    if (error instanceof Error && !error.message.startsWith("API_ERROR:")) {
      console.error(`Network error fetching ${url}:`, error);
    }
    throw error;
  }
}
