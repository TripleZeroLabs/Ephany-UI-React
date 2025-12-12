export type Manufacturer = {
  id: number | string;
  name: string;
  slug?: string;
  website?: string;
  country?: string;
  [key: string]: any;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY;

export async function fetchManufacturers(): Promise<Manufacturer[]> {
  const res = await fetch(`${API_BASE_URL}/manufacturers/`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY ?? "",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to fetch manufacturers: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  return (await res.json()) as Manufacturer[];
}
