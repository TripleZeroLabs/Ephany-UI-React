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
  catalog_img: string;
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

export type AssetManufacturer = {
  id: number;
  name: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

// UPDATED: Added 'ordering' to support server-side sorting
export type FetchAssetsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryName?: string;
  manufacturerName?: string;
  ordering?: string;
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
 * Supports searching, sorting, and server-side filtering by category and manufacturer.
 * @param opts - Options for pagination, search, sorting, and filtering.
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

  if (opts.search) {
    params.set("search", opts.search);
  }

  // Server-side filtering parameters
  if (opts.categoryName) {
    params.set("category__name", opts.categoryName);
  }

  if (opts.manufacturerName) {
    params.set("manufacturer__name", opts.manufacturerName);
  }

  // UPDATED: Append ordering parameter if it exists
  if (opts.ordering) {
    params.set("ordering", opts.ordering);
  }

  const url = `${API_BASE_URL}/assets/?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

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
 */
export async function fetchAllCategories(): Promise<AssetCategory[]> {
  const url = `${API_BASE_URL}/assets/all_categories/`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

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

/**
 * Fetches a complete, non-paginated list of all Manufacturers.
 */
export async function fetchAllManufacturers(): Promise<AssetManufacturer[]> {
  const url = `${API_BASE_URL}/assets/all_manufacturers/`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("fetchAllManufacturers error body:", text);
      throw new Error(
        `Failed to fetch manufacturers: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    const data = (await res.json()) as AssetManufacturer[];
    return data;
  } catch (err) {
    console.error("fetchAllManufacturers network/other error:", err);
    throw err;
  }
}