/**
 * Server-side API utility for SSR
 * This version doesn't use localStorage and can be used in server components
 */

import { getApiBaseUrl } from "../config/env";

interface ServerFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string; // Optional token for authenticated requests
  cache?: RequestCache; // Cache option for Next.js fetch
  next?: { revalidate?: number }; // Next.js revalidation options
}

export const serverApiFetch = async (
  endpoint: string,
  options: ServerFetchOptions = {}
) => {
  const { body, headers, token, ...rest } = options;

  // Prepare Headers
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Execute Fetch
  try {
    const BASE_URL = getApiBaseUrl();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers: {
        ...baseHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      // Disable caching for dynamic data, enable for static data
      cache: options.cache || 'no-store',
    });

    // Handle Empty/No Content Responses
    if (response.status === 204) {
      return null;
    }

    // Parse JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle HTTP Errors
    if (!response.ok) {
      const errorMessage =
        data.message || data.error?.message || "Something went wrong!";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: unknown) {
    // Log error for debugging
    if (process.env.NODE_ENV === "development") {
      const BASE_URL = getApiBaseUrl();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Server API Fetch Error [${BASE_URL}${endpoint}]:`, errorMessage);
    }

    throw error;
  }
};

