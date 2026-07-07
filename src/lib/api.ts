const DEFAULT_API_BASE_URL = "http://127.0.0.1:5000/api/v1";

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env?.VITE_API_URL as string | undefined;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
  }

  return DEFAULT_API_BASE_URL;
}

export function getApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
