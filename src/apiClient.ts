const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

if (!API_BASE_URL) {
  console.warn("API_BASE_URL is not set in env (VITE_API_BASE_URL).");
}
if (!API_KEY) {
  console.warn("API_KEY is not set in env (VITE_API_KEY).");
}

// Generic helper
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set("X-API-Key", API_KEY);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}
