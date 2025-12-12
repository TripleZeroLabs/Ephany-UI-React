export type Project = {
  id: number | string;
  name: string;
  code?: string;
  status?: string;
  region?: string;
  [key: string]: any;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects/`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY ?? "",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to fetch projects: ${res.status} ${res.statusText} - ${text}`
    );
  }

  return (await res.json()) as Project[];
}
