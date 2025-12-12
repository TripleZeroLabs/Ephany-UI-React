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

// If you want same-origin in dev, you can still use "/api"
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

const API_KEY = import.meta.env.VITE_API_KEY;

export async function fetchAssets(): Promise<Asset[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/assets/`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY ?? "",
      },
    });

    console.log("fetchAssets response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("fetchAssets error body:", text);
      throw new Error(
        `Failed to fetch assets: ${res.status} ${res.statusText} - ${text}`,
      );
    }

    const data = (await res.json()) as Asset[];
    return data;
  } catch (err) {
    console.error("fetchAssets network/other error:", err);
    throw err;
  }
}
