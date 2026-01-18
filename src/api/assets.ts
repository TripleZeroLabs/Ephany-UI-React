export interface Asset {
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
  // Components defined at the Library level (Required vs Optional)
  components?: AssetComponent[];
  _display_units: {
    length: string;
    area: string;
    volume: string;
    mass: string;
  };
}

export interface AssetComponent {
  id: number;
  parent_asset: number;
  child_asset: Asset; // Nested full asset data
  quantity_required: number;
  can_add_per_instance: boolean;
}

/**
 * NEW: Interface for the specific instance-level components
 * This matches your Django AssetComponentInstance model.
 */
export interface AssetComponentInstance {
  id: number;
  asset_component: AssetComponent; // Nested component definition
  quantity: number;
  // Read-only helpers provided by the Serializer
  component_name?: string;
  component_type_id?: string;
}

/**
 * NEW: Interface for the Asset Instance (Project side)
 */
export interface AssetInstance {
  id: number;
  instance_id: string | null;
  location: string | null;
  asset: number;
  asset_details: Asset; // Full library data
  optional_components: AssetComponentInstance[]; // The specific added components
  custom_fields: Record<string, unknown>;
}

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

export type FetchAssetsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryName?: string;
  manufacturerName?: string;
  ordering?: string;
};

function getHeadersObject() {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY ?? "",
  };
}

/**
 * Fetches a paginated list of assets from the primary API endpoint.
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
  if (opts.categoryName) params.set("category__name", opts.categoryName);
  if (opts.manufacturerName) params.set("manufacturer__name", opts.manufacturerName);
  if (opts.ordering) params.set("ordering", opts.ordering);

  const url = `${API_BASE_URL}/assets/?${params.toString()}`;

  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch assets: ${res.status}`);
  return (await res.json()) as PaginatedResponse<Asset>;
}

/**
 * NEW: Fetches a single Asset Instance with all its nested components.
 */
export async function fetchAssetInstance(id: number): Promise<AssetInstance> {
  const url = `${API_BASE_URL}/instances/${id}/`;
  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch instance: ${res.status}`);
  return (await res.json()) as AssetInstance;
}

/**
 * Fetches AssetCategories for filter dropdowns.
 */
export async function fetchAllCategories(): Promise<AssetCategory[]> {
  const url = `${API_BASE_URL}/assets/all_categories/`;
  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return (await res.json()) as AssetCategory[];
}

/**
 * Fetches Manufacturers for filter dropdowns.
 */
export async function fetchAllManufacturers(): Promise<AssetManufacturer[]> {
  const url = `${API_BASE_URL}/assets/all_manufacturers/`;
  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch manufacturers: ${res.status}`);
  return (await res.json()) as AssetManufacturer[];
}