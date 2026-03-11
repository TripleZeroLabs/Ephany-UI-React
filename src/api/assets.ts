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
  description?: string;
};

export type AssetManufacturer = {
  id: number;
  name: string;
};

export interface AssetFile {
  id: number;
  file: string;
  category: string;
  category_display: string;
  uploaded_at: string;
}

export interface AssetAttribute {
  id: number;
  name: string;
  scope: 'type' | 'instance' | 'both';
  data_type: 'str' | 'int' | 'float' | 'bool';
  unit_type: string;
}

import { getAuthHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type FetchAssetsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryName?: string;
  manufacturerName?: string;
  ordering?: string;
};

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

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch assets: ${res.status}`);
  return (await res.json()) as PaginatedResponse<Asset>;
}

/**
 * NEW: Fetches a single Asset Instance with all its nested components.
 */
export async function fetchAssetInstance(id: number): Promise<AssetInstance> {
  const url = `${API_BASE_URL}/instances/${id}/`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch instance: ${res.status}`);
  return (await res.json()) as AssetInstance;
}

/**
 * Fetches AssetCategories for filter dropdowns.
 */
export async function fetchAllCategories(): Promise<AssetCategory[]> {
  const url = `${API_BASE_URL}/assets/all_categories/`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return (await res.json()) as AssetCategory[];
}

/**
 * Fetches Manufacturers for filter dropdowns.
 */
export async function fetchAllManufacturers(): Promise<AssetManufacturer[]> {
  const url = `${API_BASE_URL}/assets/all_manufacturers/`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch manufacturers: ${res.status}`);
  return (await res.json()) as AssetManufacturer[];
}

// --- Asset CRUD ---

export async function fetchAsset(id: number): Promise<Asset> {
  const res = await fetch(`${API_BASE_URL}/assets/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch asset: ${res.status}`);
  return (await res.json()) as Asset;
}

export async function createAsset(data: FormData): Promise<Asset> {
  const res = await fetch(`${API_BASE_URL}/assets/`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Asset;
}

export async function updateAsset(id: number, data: FormData): Promise<Asset> {
  const res = await fetch(`${API_BASE_URL}/assets/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Asset;
}

export async function deleteAsset(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/assets/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete asset: ${res.status}`);
}

// --- AssetCategory CRUD ---

export async function fetchCategory(id: number): Promise<AssetCategory> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch category: ${res.status}`);
  return (await res.json()) as AssetCategory;
}

export async function createCategory(data: { name: string; description?: string }): Promise<AssetCategory> {
  const res = await fetch(`${API_BASE_URL}/categories/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetCategory;
}

export async function updateCategory(id: number, data: { name?: string; description?: string }): Promise<AssetCategory> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetCategory;
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete category: ${res.status}`);
}

// --- AssetFile CRUD ---

export async function fetchAssetFiles(opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<AssetFile>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("page_size", String(opts.pageSize ?? 20));
  const res = await fetch(`${API_BASE_URL}/files/?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
  return (await res.json()) as PaginatedResponse<AssetFile>;
}

export async function fetchAssetFileRecord(id: number): Promise<AssetFile> {
  const res = await fetch(`${API_BASE_URL}/files/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  return (await res.json()) as AssetFile;
}

export async function createAssetFile(data: FormData): Promise<AssetFile> {
  const res = await fetch(`${API_BASE_URL}/files/`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetFile;
}

export async function updateAssetFile(id: number, data: FormData): Promise<AssetFile> {
  const res = await fetch(`${API_BASE_URL}/files/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(false),
    body: data,
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetFile;
}

export async function deleteAssetFile(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/files/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete file: ${res.status}`);
}

// --- AssetAttribute CRUD ---

export async function fetchAllAttributes(): Promise<AssetAttribute[]> {
  const res = await fetch(`${API_BASE_URL}/attributes/?page_size=200`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch attributes: ${res.status}`);
  const data = (await res.json()) as PaginatedResponse<AssetAttribute>;
  return data.results;
}

export async function fetchAttributes(opts: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<AssetAttribute>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("page_size", String(opts.pageSize ?? 20));
  if (opts.search) params.set("search", opts.search);
  const res = await fetch(`${API_BASE_URL}/attributes/?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch attributes: ${res.status}`);
  return (await res.json()) as PaginatedResponse<AssetAttribute>;
}

export async function fetchAttribute(id: number): Promise<AssetAttribute> {
  const res = await fetch(`${API_BASE_URL}/attributes/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch attribute: ${res.status}`);
  return (await res.json()) as AssetAttribute;
}

export async function createAttribute(data: Omit<AssetAttribute, 'id'>): Promise<AssetAttribute> {
  const res = await fetch(`${API_BASE_URL}/attributes/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetAttribute;
}

export async function updateAttribute(id: number, data: Partial<Omit<AssetAttribute, 'id'>>): Promise<AssetAttribute> {
  const res = await fetch(`${API_BASE_URL}/attributes/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as AssetAttribute;
}

export async function deleteAttribute(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/attributes/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete attribute: ${res.status}`);
}