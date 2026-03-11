export interface Vendor {
  id: number;
  name: string;
  website: string;
  contact_email: string;
}

export interface VendorProduct {
  id: number;
  asset_id: number;
  vendor_id: number;
  asset_name: string;
  vendor_name: string;
  sku: string;
  cost: string;
  lead_time_days: number;
  url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

import { getAuthHeaders } from "./authHeaders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// --- Vendor CRUD ---

export async function fetchVendors(opts: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<Vendor>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("page_size", String(opts.pageSize ?? 20));
  if (opts.search) params.set("search", opts.search);
  const res = await fetch(`${API_BASE_URL}/vendors/?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch vendors: ${res.status}`);
  return (await res.json()) as PaginatedResponse<Vendor>;
}

export async function fetchVendor(id: number): Promise<Vendor> {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}/`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch vendor: ${res.status}`);
  return (await res.json()) as Vendor;
}

export async function createVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
  const res = await fetch(`${API_BASE_URL}/vendors/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Vendor;
}

export async function updateVendor(id: number, data: Partial<Omit<Vendor, 'id'>>): Promise<Vendor> {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as Vendor;
}

export async function deleteVendor(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete vendor: ${res.status}`);
}

// --- VendorProduct CRUD ---

export async function fetchVendorProducts(opts: { page?: number; pageSize?: number; vendor?: number; asset?: number } = {}): Promise<PaginatedResponse<VendorProduct>> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("page_size", String(opts.pageSize ?? 20));
  if (opts.vendor) params.set("vendor", String(opts.vendor));
  if (opts.asset) params.set("asset", String(opts.asset));
  const res = await fetch(`${API_BASE_URL}/vendor-products/?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch vendor products: ${res.status}`);
  return (await res.json()) as PaginatedResponse<VendorProduct>;
}

export async function createVendorProduct(data: { asset_id: number; vendor_id: number; sku?: string; cost: string; lead_time_days?: number; url?: string }): Promise<VendorProduct> {
  const res = await fetch(`${API_BASE_URL}/vendor-products/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as VendorProduct;
}

export async function updateVendorProduct(id: number, data: Partial<{ sku: string; cost: string; lead_time_days: number; url: string }>): Promise<VendorProduct> {
  const res = await fetch(`${API_BASE_URL}/vendor-products/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return (await res.json()) as VendorProduct;
}

export async function deleteVendorProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/vendor-products/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete vendor product: ${res.status}`);
}
