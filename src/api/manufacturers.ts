export type Manufacturer = {
	id: number | string;
	name: string;
	slug?: string;
	website?: string;
	country?: string;
	[key: string]: any;
};

export async function fetchManufacturers(): Promise<Manufacturer[]> {
	const res = await fetch("/api/manufacturers"); // adjust to your proxy/URL
	if (!res.ok) throw new Error("Failed to fetch manufacturers");
	return res.json();
}
