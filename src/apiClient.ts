import { getAuthHeaders, handleAuthError } from "./api/authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  console.warn("API_BASE_URL is not set in env (VITE_API_BASE_URL).");
}

// Generic helper
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const authHeaders = getAuthHeaders(true);
  const headers = new Headers(options.headers || {});
  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) headers.set(key, value);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    handleAuthError(response);
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}
