/**
 * Base API client with interceptors and common functionality
 */

import { getApiBaseUrl } from "@/lib/config/env";
import { handleGlobalError } from "@/lib/utils/errorHandler";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  showError?: boolean;
  errorTitle?: string;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {};

    if (includeAuth) {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const {
      body,
      headers = {},
      showError = true,
      errorTitle,
      ...rest
    } = options;

    const requestHeaders: Record<string, string> = {
      ...this.getHeaders(),
      ...(headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData
    if (!(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...rest,
        headers: requestHeaders,
        body:
          body instanceof FormData
            ? body
            : body
            ? JSON.stringify(body)
            : undefined,
      });

      // Handle empty responses
      if (response.status === 204) {
        return null as T;
      }

      // Parse JSON
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      // Handle errors
      if (!response.ok) {
        const errorMessage =
          data.message || data.error?.message || "Something went wrong!";
        const error = new Error(errorMessage);

        if (showError && typeof window !== "undefined") {
          handleGlobalError(error, errorTitle);
        }

        throw error;
      }

      return data as T;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message;

      if (process.env.NODE_ENV === "development") {
        console.error(
          `API Request Error [${this.baseUrl}${endpoint}]:`,
          errorMessage
        );
      }

      if (
        showError &&
        typeof window !== "undefined" &&
        !(errorObj as { _handled?: boolean })._handled
      ) {
        handleGlobalError(errorObj, errorTitle);
        (errorObj as { _handled?: boolean })._handled = true;
      }

      throw errorObj;
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  put<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
