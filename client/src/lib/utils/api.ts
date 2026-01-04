/**
 * Base API utility for standardized fetch calls
 */

import { handleGlobalError } from "./errorHandler";
import { getApiBaseUrl } from "../config/env";

interface FetchOptions extends RequestInit {
  body?: unknown;
  showError?: boolean; // Option to disable automatic error display
  errorTitle?: string; // Custom error title
}

export const apiFetch = async (
  endpoint: string,
  options: FetchOptions = {}
) => {
  const { body, headers, showError = true, errorTitle, ...rest } = options;

  // 1. Get token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 2. Check if body is FormData
  const isFormData = body instanceof FormData;

  // 3. Prepare Headers
  const baseHeaders: Record<string, string> = {
    // Don't set Content-Type for FormData - browser will set it with boundary
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 4. Execute Fetch
  try {
    const BASE_URL = getApiBaseUrl();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers: {
        ...baseHeaders,
        ...headers,
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    // 4. Handle Empty/No Content Responses (e.g., DELETE)
    if (response.status === 204) {
      return null;
    }

    // 5. Parse JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // 6. Handle HTTP Errors
    if (!response.ok) {
      const errorMessage =
        data.message || data.error?.message || "Something went wrong!";
      const error = new Error(errorMessage);

      // Automatically show error in global error handler if enabled
      if (showError && typeof window !== "undefined") {
        handleGlobalError(error, errorTitle);
      }

      throw error;
    }

    return data;
  } catch (error: unknown) {
    const BASE_URL = getApiBaseUrl();
    const fullUrl = `${BASE_URL}${endpoint}`;
    
    // Enhanced error handling for network errors
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a network/fetch error
    if (errorMessage === "Failed to fetch" || errorMessage.includes("fetch")) {
      errorMessage = `Unable to connect to server at ${BASE_URL}. Please ensure the server is running on port 3001.`;
      
      // Log detailed error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error(`API Fetch Error [${fullUrl}]:`, {
          message: errorMessage,
          originalError: error,
          baseUrl: BASE_URL,
          endpoint: endpoint,
          suggestion: "Make sure the backend server is running: cd server && npm run dev"
        });
      }
    } else {
      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error(`API Fetch Error [${fullUrl}]:`, errorMessage);
      }
    }

    // Create error object with enhanced message
    const errorObj = error instanceof Error 
      ? new Error(errorMessage) 
      : new Error(errorMessage);
    
    // Preserve original error for debugging
    if (error instanceof Error) {
      (errorObj as any).originalError = error;
    }

    // If it's not already handled and showError is enabled, handle it globally
    if (showError && typeof window !== "undefined") {
      if (!(errorObj as { _handled?: boolean })._handled) {
        handleGlobalError(errorObj, errorTitle || "Connection Error");
        (errorObj as { _handled?: boolean })._handled = true;
      }
    }

    throw errorObj;
  }
};
