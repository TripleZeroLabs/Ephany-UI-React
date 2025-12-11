import { useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "./components/DataTable";
import {
	FiltersPanel,
	type SelectFilterConfig,
} from "./components/FiltersPanel";
import { fetchProjects, type Project } from "./api/projects";

export function ProjectsPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchProjects();
				setProjects(data);
			} catch (err: any) {
				setError(err?.message ?? "Unknown error");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	// Unique statuses, if available
	const statuses = useMemo(() => {
		const names = Array.from(
			new Set(
				projects
					.map((p) => p.status)
					.filter((name): name is string => !!name)
			)
		);
		names.sort((a, b) => a.localeCompare(b));
		return names;
	}, [projects]);

	const filteredProjects = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();

		return projects.filter((p) => {
			if (statusFilter && p.status !== statusFilter) {
				return false;
			}

			if (!term) return true;
			const haystack = JSON.stringify(p).toLowerCase();
			return haystack.includes(term);
		});
	}, [projects, statusFilter, searchTerm]);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleStatusChange = (value: string) => {
		setStatusFilter(value);
	};

	const selectFilters: SelectFilterConfig[] = statuses.length
		? [
				{
					id: "status-filter",
					label: "Status",
					value: statusFilter,
					options: statuses,
					onChange: handleStatusChange,
				},
		  ]
		: [];

	const columns: ColumnDef<Project>[] = [
		{ key: "name", header: "Name" },
		{ key: "code", header: "Code" },
		{ key: "status", header: "Status" },
		{ key: "region", header: "Region" },
	];

	if (loading) return <div className="p-6 text-sm text-slate-600">Loading projects…</div>;
	if (error)
		return (
			<div className="m-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				Error: {error}
			</div>
		);

	return (
		<div className="">
			<FiltersPanel
				searchValue={searchTerm}
				onSearchChange={handleSearchChange}
				searchPlaceholder="Search name, code, region…"
				selectFilters={selectFilters}
				summary={
					<>
						Showing {filteredProjects.length} of {projects.length} projects
					</>
				}
			/>

			<DataTable
				rows={filteredProjects}
				columns={columns}
				getRowKey={(p) => p.id}
			/>
		</div>
	);
}
