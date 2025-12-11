import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "./components/DataTable";
import {
	FiltersPanel,
	type SelectFilterConfig,
} from "./components/FiltersPanel";
import { fetchManufacturers, type Manufacturer } from "./api/manufacturers";

export function ManufacturersPage() {
	const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [countryFilter, setCountryFilter] = useState<string>("");

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchManufacturers();
				setManufacturers(data);
			} catch (err: any) {
				setError(err?.message ?? "Unknown error");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	// Unique list of countries (or any category field you prefer)
	const countries = useMemo(() => {
		const names = Array.from(
			new Set(
				manufacturers
					.map((m) => m.country)
					.filter((name): name is string => !!name)
			)
		);
		names.sort((a, b) => a.localeCompare(b));
		return names;
	}, [manufacturers]);

	// Filtered list
	const filteredManufacturers = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();

		return manufacturers.filter((m) => {
			// Country filter
			if (countryFilter && m.country !== countryFilter) {
				return false;
			}

			// Search across entire manufacturer object
			if (!term) return true;
			const haystack = JSON.stringify(m).toLowerCase();
			return haystack.includes(term);
		});
	}, [manufacturers, countryFilter, searchTerm]);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleCountryChange = (value: string) => {
		setCountryFilter(value);
	};

	const selectFilters: SelectFilterConfig[] = countries.length
		? [
				{
					id: "country-filter",
					label: "Country",
					value: countryFilter,
					options: countries,
					onChange: handleCountryChange,
				},
		  ]
		: [];

	const columns: ColumnDef<Manufacturer>[] = [
		{ key: "name", header: "Name" },
		{ key: "website", header: "Website" },
		{ key: "country", header: "Country" },
	];

	if (loading) return <div className="p-6 text-sm text-slate-600">Loading manufacturers…</div>;
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
				searchPlaceholder="Search name, website, country…"
				selectFilters={selectFilters}
				summary={
					<>
						Showing {filteredManufacturers.length} of {manufacturers.length} manufacturers
					</>
				}
			/>

			<DataTable
				rows={filteredManufacturers}
				columns={columns}
				getRowKey={(m) => m.id}
			/>
		</div>
	);
}
