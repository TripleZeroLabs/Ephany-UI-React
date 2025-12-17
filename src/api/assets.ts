// src/api/assets.ts

export type Asset = {
  id: number;
  type_id: string;
  manufacturer: number;
  manufacturer_name: string;
  category: string | null;
  model: string;
  name: string;
  description: string;
  url: string;
  overall_height: number | null;
  overall_width: number | null;
  overall_depth: number | null;
  custom_fields: Record<string, unknown> | null;
  files: unknown[];
  _display_units: {
    length: string;
    area: string;
    volume: string;
    mass: string;
  };
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type AssetCategory = {
  id: number;
  name: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

type FetchAssetsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  // This must be present for TypeScript to allow passing it
  categoryName?: string;
};

/**
 * Creates a standard headers object for inclusion in a RequestInit object.
 * @returns Headers object mapping header names to values.
 */
function getHeadersObject() {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY ?? "",
  };
}

/**
 * Fetches a paginated list of assets from the primary API endpoint.
 * @param opts - Options for pagination and search.
 * @returns A promise resolving to PaginatedResponse<Asset>.
 */
export async function fetchAssets(
  opts: FetchAssetsOptions = {},
): Promise<PaginatedResponse<Asset>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (opts.search) params.set("search", opts.search);

  // --- CRITICAL SECTION: This sends the filter to Django ---
  if (opts.categoryName) {
    // Note: The key 'category__name' must match the filterset_fields in Django views.py
    params.set("category__name", opts.categoryName);
  }
  // --------------------------------------------------------

  const url = `${API_BASE_URL}/assets/?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    console.log("fetchAssets response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("fetchAssets error body:", text);
      throw new Error(
        `Failed to fetch assets: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    const data = (await res.json()) as PaginatedResponse<Asset>;
    return data;
  } catch (err) {
    console.error("fetchAssets network/other error:", err);
    throw err;
  }
}

/**
 * Fetches a complete, non-paginated list of all AssetCategories.
 * This is used to populate filter dropdowns that need consistent options
 * regardless of the current page's content.
 * @returns A promise resolving to AssetCategory[].
 */
export async function fetchAllCategories(): Promise<AssetCategory[]> {
  const url = `${API_BASE_URL}/assets/all_categories/`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    console.log("fetchAllCategories response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("fetchAllCategories error body:", text);
      throw new Error(
        `Failed to fetch categories: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    const data = (await res.json()) as AssetCategory[];
    return data;
  } catch (err) {
    console.error("fetchAllCategories network/other error:", err);
    throw err;
  }
}