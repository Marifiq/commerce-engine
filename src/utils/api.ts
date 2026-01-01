/**
 * Base API utility for standardized fetch calls
 */

const getBaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    // Ensure it doesn't end with a slash for consistent concatenation
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Ensure it includes /api/v1 if not already present
    if (!url.includes('/api/v1')) {
        url = `${url}/api/v1`;
    }
    return url;
};

const BASE_URL = getBaseUrl();

interface FetchOptions extends RequestInit {
  body?: any;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { body, headers, ...rest } = options;

  // 1. Get token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 2. Prepare Headers
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 3. Execute Fetch
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers: {
        ...baseHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
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
      throw new Error(data.message || "Something went wrong!");
    }

    return data;
  } catch (error: any) {
    console.error("API Fetch Error:", error.message);
    throw error;
  }
};
