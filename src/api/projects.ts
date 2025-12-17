/**
 * Represents a Project entity.
 * Fields match the ProjectSerializer in the Django backend.
 */
export type Project = {
  id: number;
  job_id: string;
  name: string;
  description: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  snapshot_count: number; // Read-only field from serializer
};

/**
 * Represents a Snapshot entity.
 * Fields match the SnapshotSerializer in the Django backend.
 */
export type Snapshot = {
  id: number;
  project: number; // Foreign Key ID
  name: string;
  date: string; // ISO 8601 date string
  created_at: string; // ISO 8601 date string
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

type FetchProjectsOptions = {
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
 * Fetches a paginated list of projects from the backend.
 * @param opts Configuration object for pagination and search.
 * @returns A promise resolving to a PaginatedResponse containing Project objects.
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

  const url = `${API_BASE_URL}/projects/?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch projects: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    const data = (await res.json()) as PaginatedResponse<Project>;
    return data;
  } catch (err: unknown) {
    console.error("fetchProjects network/other error:", err);
    throw err;
  }
}

/**
 * Fetches the list of snapshots associated with a specific project.
 * Uses a large page size to retrieve all relevant snapshots in a single request for the modal.
 * @param projectId The ID of the project to filter by.
 * @returns A promise resolving to an array of Snapshot objects.
 */
export async function fetchSnapshotsForProject(
  projectId: number
): Promise<Snapshot[]> {
  const params = new URLSearchParams();
  // Filter by the 'project' field as defined in SnapshotViewSet.filterset_fields
  params.set("project", String(projectId));
  // Request a large page size to populate the modal list without internal pagination
  params.set("page_size", "100");

  const url = `${API_BASE_URL}/snapshots/?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: getHeadersObject(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch snapshots: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    // The API returns a PaginatedResponse, but we return the .results array for the UI
    const data = (await res.json()) as PaginatedResponse<Snapshot>;
    return data.results;
  } catch (err: unknown) {
    console.error("fetchSnapshotsForProject network/other error:", err);
    throw err;
  }
}