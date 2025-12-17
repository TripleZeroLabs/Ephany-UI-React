/**
 * Represents a Manufacturer entity as returned by the API.
 * Fields match the ManufacturerSerializer in the Django backend.
 */
export type Manufacturer = {
  id: number;
  name: string;
  url: string; // Mapped from 'url' field in model
  logo: string | null; // URL to the logo image, or null if not set
};

/**
 * Standard Django REST Framework paginated response structure.
 */
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

type FetchManufacturersOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

/**
 * Helper to construct standardized headers for API requests.
 */
function getHeadersObject() {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY ?? "",
  };
}

/**
 * Fetches a paginated list of manufacturers from the backend.
 * Supports pagination parameters and keyword search.
 * * @param opts Configuration object for pagination (page, pageSize) and search.
 * @returns A promise resolving to a PaginatedResponse containing Manufacturer objects.
 */
export async function fetchManufacturers(
  opts: FetchManufacturersOptions = {},
): Promise<PaginatedResponse<Manufacturer>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (opts.search) {
    params.set("search", opts.search);
  }

  const url = `${API_BASE_URL}/manufacturers/?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    if (!res.ok) {
      const text = await res.text();
      // Throwing an error here to be caught by the calling component's try/catch block
      throw new Error(
        `Failed to fetch manufacturers: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    // Cast response to the strict PaginatedResponse type
    const data = (await res.json()) as PaginatedResponse<Manufacturer>;
    return data;
  } catch (err: unknown) {
    // Log network or parsing errors for debugging purposes before rethrowing
    console.error("fetchManufacturers network/other error:", err);
    throw err;
  }
}