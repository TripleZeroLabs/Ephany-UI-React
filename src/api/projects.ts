export type Project = {
	id: number | string;
	name: string;
	code?: string;
	status?: string;
	region?: string;
	[key: string]: any;
};

export async function fetchProjects(): Promise<Project[]> {
	const res = await fetch("/api/projects"); // adjust URL/proxy as needed
	if (!res.ok) throw new Error("Failed to fetch projects");
	return res.json();
}
