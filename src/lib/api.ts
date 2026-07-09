/**
 * Resolve the API base URL for the current runtime.
 * Production always uses same-origin /api/v1 — never localhost,
 * even if VITE_API_URL was baked in at build time from a dev .env.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocal) {
      const configured = import.meta.env?.VITE_API_URL as string | undefined;
      return (
        configured?.replace(/\/$/, "") ||
        `${window.location.protocol}//${window.location.hostname}:5000/api/v1`
      );
    }

    return "/api/v1";
  }

  return "/api/v1";
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
