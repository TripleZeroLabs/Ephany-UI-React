import {type Asset, type AssetComponent} from "./assets";

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
    instance_count?: number; // Added from SnapshotSerializer
}

/**
 * Represents a Project entity.
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
    snapshots?: Snapshot[];
    latest_snapshot_date?: string; // Annotated field from ProjectViewSet
}

/**
 * Represents an instance of an optional asset component.
 * Links a library AssetComponent definition to a specific AssetInstance.
 */
export interface AssetComponentInstance {
    id: number;
    asset_instance: number;
    asset_component: AssetComponent; // Full nested definition for UI rendering
    quantity: number;
    // Read-only helpers from serializer
    component_name?: string;
    component_type_id?: string;
    component_quantity?: number;
}

/**
 * Represents an occurrence of a library Asset within a Snapshot.
 */
export interface AssetInstance {
    id: number;
    snapshot: number;
    asset: number;
    asset_details: Asset;
    instance_id: string;
    location: string;
    optional_components: AssetComponentInstance[];
    custom_fields: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

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
 * Fetches projects with support for searching and sorting by latest snapshot date.
 */
export async function fetchProjects(
    opts: FetchProjectsOptions = {}
): Promise<PaginatedResponse<Project>> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (opts.search) params.set("search", opts.search);
    if (opts.ordering) params.set("ordering", opts.ordering);

    const url = `${API_BASE_URL}/projects/?${params.toString()}`;

    const res = await fetch(url, {headers: getHeadersObject()});
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
    return (await res.json()) as PaginatedResponse<Project>;
}

/**
 * Fetches details for a single project.
 */
export async function fetchProjectDetail(id: number): Promise<Project> {
    const url = `${API_BASE_URL}/projects/${id}/`;
    const res = await fetch(url, {headers: getHeadersObject()});
    if (!res.ok) throw new Error(`Failed to fetch project detail: ${res.status}`);
    return (await res.json()) as Project;
}

/**
 * Fetches snapshots for a project, typically for a history list.
 */
export async function fetchSnapshotsForProject(
    projectId: number
): Promise<Snapshot[]> {
    const params = new URLSearchParams();
    params.set("project", String(projectId));
    params.set("page_size", "100");

    const url = `${API_BASE_URL}/snapshots/?${params.toString()}`;

    const res = await fetch(url, {headers: getHeadersObject()});
    if (!res.ok) throw new Error(`Failed to fetch snapshots: ${res.status}`);

    const data = (await res.json()) as PaginatedResponse<Snapshot>;
    return data.results;
}

/**
 * Fetches a single snapshot's details by ID.
 */
export async function fetchSnapshotDetail(id: number): Promise<Snapshot> {
    const url = `${API_BASE_URL}/snapshots/${id}/`;

    const res = await fetch(url, {headers: getHeadersObject()});
    if (!res.ok) throw new Error(`Failed to fetch snapshot detail: ${res.status}`);
    return (await res.json()) as Snapshot;
}

/**
 * Fetches all asset instances in a snapshot with fully pre-fetched nested library data.
 */
export async function fetchInstancesForSnapshot(
    snapshotId: number
): Promise<AssetInstance[]> {
    const params = new URLSearchParams();
    params.set("snapshot", String(snapshotId));
    params.set("page_size", "1000");

    const url = `${API_BASE_URL}/instances/?${params.toString()}`;

    const res = await fetch(url, {headers: getHeadersObject()});
    if (!res.ok) throw new Error(`Failed to fetch instances: ${res.status}`);

    const data = (await res.json()) as PaginatedResponse<AssetInstance>;
    return data.results;
}