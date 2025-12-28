import { type Asset } from "./assets";

/**
 * Represents a Snapshot entity.
 */
export interface Snapshot {
  id: number;
  project: number;
  name: string;
  date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a Project entity.
 * Updated: Included snapshots array to support "Latest Snapshot" display.
 */
export interface Project {
  id: number;
  job_id: string;
  name: string;
  description: string;
  portfolio_img?: string | null;
  created_at: string;
  updated_at: string;
  snapshot_count: number;
  snapshots?: Snapshot[]; // Added for nested snapshot access
}

/**
 * Represents an occurrence of a library Asset within a Snapshot.
 * Uses 'unknown' for custom_fields to satisfy ESLint rules against 'any'.
 */
export interface AssetInstance {
  id: number;
  snapshot: number;
  asset: number; // ID of the library asset
  asset_details: Asset; // Full nested object from AssetSerializer
  instance_id: string; // The physical tag/ID (e.g., P-101)
  location: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Standard Django REST Framework paginated response structure.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

// Updated: Added ordering to options
export type FetchProjectsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

/**
 * Helper to construct standardized headers for API requests.
 */
function getHeadersObject(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY ?? "",
  };
}

/**
 * Fetches a paginated list of projects from the backend.
 * Handles server-side searching, pagination, and sorting.
 */
export async function fetchProjects(
  opts: FetchProjectsOptions = {}
): Promise<PaginatedResponse<Project>> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (opts.search) {
    params.set("search", opts.search);
  }

  // Updated: Append the ordering parameter for server-side sorting
  if (opts.ordering) {
    params.set("ordering", opts.ordering);
  }

  const url = `${API_BASE_URL}/projects/?${params.toString()}`;

  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return (await res.json()) as PaginatedResponse<Project>;
}

/**
 * Fetches a single project's details.
 */
export async function fetchProjectDetail(id: number): Promise<Project> {
  const url = `${API_BASE_URL}/projects/${id}/`;
  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch project detail: ${res.status}`);
  return (await res.json()) as Project;
}

/**
 * Fetches the list of snapshots associated with a specific project.
 */
export async function fetchSnapshotsForProject(
  projectId: number
): Promise<Snapshot[]> {
  const params = new URLSearchParams();
  params.set("project", String(projectId));
  params.set("page_size", "100");

  const url = `${API_BASE_URL}/snapshots/?${params.toString()}`;

  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch snapshots: ${res.status}`);

  const data = (await res.json()) as PaginatedResponse<Snapshot>;
  return data.results;
}

/**
 * Fetches a single snapshot's details by ID.
 */
export async function fetchSnapshotDetail(id: number): Promise<Snapshot> {
  const url = `${API_BASE_URL}/snapshots/${id}/`;

  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch snapshot detail: ${res.status}`);
  return (await res.json()) as Snapshot;
}

/**
 * Fetches all asset instances assigned to a specific snapshot.
 */
export async function fetchInstancesForSnapshot(
  snapshotId: number
): Promise<AssetInstance[]> {
  const params = new URLSearchParams();
  params.set("snapshot", String(snapshotId));
  params.set("page_size", "1000");

  const url = `${API_BASE_URL}/instances/?${params.toString()}`;

  const res = await fetch(url, { headers: getHeadersObject() });
  if (!res.ok) throw new Error(`Failed to fetch instances: ${res.status}`);

  const data = (await res.json()) as PaginatedResponse<AssetInstance>;
  return data.results;
}