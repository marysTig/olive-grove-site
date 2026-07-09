const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env?.VITE_API_URL as string | undefined;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  // Fallback for browser environment
  if (typeof window !== "undefined") {
    // If running on localhost, use default dev backend port 5000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
    }
    // Production fallback: relative endpoint
    return "/api/v1";
  }

  return DEFAULT_API_BASE_URL;
}

export function getApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
