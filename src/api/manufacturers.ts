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

import { getAuthHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type FetchManufacturersOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

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
      headers: getAuthHeaders(),
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

export async function fetchManufacturer(id: number): Promise<Manufacturer> {
  const res = await fetch(`${API_BASE_URL}/manufacturers/${id}/`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch manufacturer: ${res.status}`);
  return (await res.json()) as Manufacturer;
}

export async function createManufacturer(data: FormData): Promise<Manufacturer> {
  const res = await fetch(`${API_BASE_URL}/manufacturers/`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Manufacturer;
}

export async function updateManufacturer(id: number, data: FormData): Promise<Manufacturer> {
  const res = await fetch(`${API_BASE_URL}/manufacturers/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Manufacturer;
}

export async function deleteManufacturer(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/manufacturers/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete manufacturer: ${res.status}`);
}