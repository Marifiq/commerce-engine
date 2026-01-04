/**
 * Environment configuration
 */

export const getApiBaseUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  // Ensure it doesn't end with a slash for consistent concatenation
  if (url.endsWith('/')) url = url.slice(0, -1);
  // Ensure it includes /api/v1 if not already present
  if (!url.includes('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

export const getApiBaseUrlWithoutVersion = (): string => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace('/api/v1', '');
};

