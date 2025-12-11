import { useEffect, useMemo, useState } from "react";
import { fetchAssets, type Asset } from "./api/assets";
import {
	FiltersPanel,
	type SelectFilterConfig,
} from "./components/FiltersPanel";
import { DataTable, type ColumnDef } from "./components/DataTable";

export function AssetsPage() {
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [manufacturerFilter, setManufacturerFilter] = useState<string>("");
	const [categoryFilter, setCategoryFilter] = useState<string>("");

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchAssets();
				setAssets(data);
			} catch (err: any) {
				setError(err?.message ?? "Unknown error");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	// Unique list of manufacturers
	const manufacturers = useMemo(() => {
		const names = Array.from(
			new Set(
				assets
					.map((a) => a.manufacturer_name)
					.filter((name): name is string => !!name)
			)
		);
		names.sort((a, b) => a.localeCompare(b));
		return names;
	}, [assets]);

	// Unique list of categories (if your API has a category field)
	const categories = useMemo(() => {
		const names = Array.from(
			new Set(
				assets
					.map((a) => (a as any).category)
					.filter((name): name is string => !!name)
			)
		);
		names.sort((a, b) => a.localeCompare(b));
		return names;
	}, [assets]);

	// Filtered list
	const filteredAssets = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();

		return assets.filter((asset) => {
			// Manufacturer filter
			if (manufacturerFilter && asset.manufacturer_name !== manufacturerFilter) {
				return false;
			}

			// Category filter (if category exists)
			const category = (asset as any).category;
			if (categoryFilter && category !== categoryFilter) {
				return false;
			}

			// Keyword search across entire asset object
			if (!term) return true;
			const haystack = JSON.stringify(asset).toLowerCase();
			return haystack.includes(term);
		});
	}, [assets, manufacturerFilter, categoryFilter, searchTerm]);

	// Handlers passed into FiltersPanel
	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleManufacturerChange = (value: string) => {
		setManufacturerFilter(value);
	};

	const handleCategoryChange = (value: string) => {
		setCategoryFilter(value);
	};

	// Select filters config for FiltersPanel
	const selectFilters: SelectFilterConfig[] = [
		...(manufacturers.length
			? [
					{
						id: "manufacturer-filter",
						label: "Manufacturer",
						value: manufacturerFilter,
						options: manufacturers,
						onChange: handleManufacturerChange,
					} as SelectFilterConfig,
			  ]
			: []),
		...(categories.length
			? [
					{
						id: "category-filter",
						label: "Category",
						value: categoryFilter,
						options: categories,
						onChange: handleCategoryChange,
					} as SelectFilterConfig,
			  ]
			: []),
	];

	// Columns for DataTable
	const columns: ColumnDef<Asset>[] = [
		{ key: "type_id", header: "Type ID" },
		{ key: "name", header: "Name" },
		{ key: "manufacturer_name", header: "Manufacturer" },
		{ key: "model", header: "Model" },
		{
			key: "door_type",
			header: "Door Type",
			render: (asset) => {
				let doorTypeDisplay: string;

				if (!asset.custom_fields) {
					// The asset has no custom_fields object at all
					doorTypeDisplay = "no custom fields";
				} else if (
					!Object.prototype.hasOwnProperty.call(asset.custom_fields, "door_type")
				) {
					// The asset has custom_fields but this specific field is missing
					doorTypeDisplay = "CUSTOM FIELD NOT FOUND";
				} else {
					// The field exists (may still be null or empty)
					const value = (asset.custom_fields as any).door_type;
					doorTypeDisplay = value ?? "–";
				}

				return doorTypeDisplay;
			},
		},
	];

	if (loading) {
		return (
			<div className="p-6 text-sm text-slate-600 dark:text-slate-300">
				Loading assets…
			</div>
		);
	}

	if (error) {
		return (
			<div className="m-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				Error: {error}
			</div>
		);
	}

	return (
		<div className="">
			<FiltersPanel
				searchValue={searchTerm}
				onSearchChange={handleSearchChange}
				searchPlaceholder="Search type, name, model, custom fields…"
				selectFilters={selectFilters}
				summary={
					<>
						Showing {filteredAssets.length} of {assets.length} assets from{" "}
						<span className="font-mono">framework.ephany.io</span>
					</>
				}
			/>

			<DataTable
				rows={filteredAssets}
				columns={columns}
				getRowKey={(asset) => asset.id}
			/>
		</div>
	);
}
