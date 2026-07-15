// lib/api/client.ts

import { env } from "../env";

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(`API_ERROR:${status}:${responseBody}`);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isDynamicServerUsageError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = "digest" in error ? error.digest : undefined;
  return (
    digest === "DYNAMIC_SERVER_USAGE" ||
    error.message.includes("DYNAMIC_SERVER_USAGE")
  );
}

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
        ...((typeof window !== "undefined" && localStorage.getItem("access_token"))
          ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
          : {}),
        ...options?.headers,
      },
    });

    // console.log(`API Request: ${url} - Status: ${response.status}`);

    if (!response.ok) {
      // Read body exactly once to avoid "body stream already read" errors.
      const rawErrorBody = await response.text();
      let errorData: unknown = rawErrorBody;
      if (rawErrorBody) {
        try {
          errorData = JSON.parse(rawErrorBody);
        } catch {
          errorData = rawErrorBody;
        }
      }

      const errorMessage =
        typeof errorData === "object"
          ? JSON.stringify(errorData)
          : String(errorData ?? "");

      // Only log as error if it's not a common "not found" scenario which the caller might handle
      if (
        response.status !== 404 &&
        !errorMessage.includes("404") &&
        !errorMessage.includes("not exist") &&
        !errorMessage.includes("primary key is invalid")
      ) {
        console.error(`API Error ${response.status}: ${errorMessage}`);
      } else {
        console.warn(
          `API Reference Error ${response.status}: Resource might not exist or key is invalid.`,
        );
      }

      throw new ApiError(response.status, errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    // Avoid double logging if it's already logged above
    if (error instanceof Error && !error.message.startsWith("API_ERROR:")) {
      // Ignore Next.js dynamic server usage errors (bailouts from static generation)
      if (isDynamicServerUsageError(error)) {
        throw error;
      }
      console.error(`Network error fetching ${url}:`, error);
    }
    throw error;
  }
}
