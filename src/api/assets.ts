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

const API_BASE_URL = "/api"; // note: no full domain

export async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE_URL}/assets/`);

  if (!res.ok) {
    throw new Error(`Failed to fetch assets: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Asset[];
  return data;
}
