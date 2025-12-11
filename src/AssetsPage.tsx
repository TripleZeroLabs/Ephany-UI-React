// src/AssetsPage.tsx
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { fetchAssets, type Asset } from "./api/assets";

export function AssetsPage() {
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [manufacturerFilter, setManufacturerFilter] = useState<string>("");

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchAssets();
				setAssets(data);
			} catch (err: any) {
				setError(err.message ?? "Unknown error");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	// Unique list of manufacturers for the dropdown
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

	// Filtered list based on search term + manufacturer filter
	const filteredAssets = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();

		return assets.filter((asset) => {
			// Manufacturer filter
			if (manufacturerFilter && asset.manufacturer_name !== manufacturerFilter) {
				return false;
			}

			// Keyword search across entire asset object
			if (!term) return true;
			const haystack = JSON.stringify(asset).toLowerCase();
			return haystack.includes(term);
		});
	}, [assets, manufacturerFilter, searchTerm]);

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const handleManufacturerChange = (e: ChangeEvent<HTMLSelectElement>) => {
		setManufacturerFilter(e.target.value);
	};

	if (loading) return <div>Loading assets…</div>;
	if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

	return (
		<div style={{ padding: "1.5rem" }}>
			<p>
				Showing {filteredAssets.length} of {assets.length} assets from framework.ephany.io
			</p>

			{/* Filters */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "0.75rem",
					marginBottom: "1rem",
					alignItems: "center",
				}}
			>
				<div style={{ flex: "1 1 220px", minWidth: "220px" }}>
					<label
						htmlFor="asset-search"
						style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}
					>
						Search (any field)
					</label>
					<input
						id="asset-search"
						type="text"
						value={searchTerm}
						onChange={handleSearchChange}
						placeholder="Type to search type, name, model, custom fields…"
						style={{
							width: "100%",
							padding: "0.4rem 0.6rem",
							borderRadius: "0.35rem",
							border: "1px solid #d1d5db",
							fontSize: "0.9rem",
						}}
					/>
				</div>

				<div style={{ flex: "0 0 220px", minWidth: "180px" }}>
					<label
						htmlFor="manufacturer-filter"
						style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}
					>
						Filter by manufacturer
					</label>
					<select
						id="manufacturer-filter"
						value={manufacturerFilter}
						onChange={handleManufacturerChange}
						style={{
							width: "100%",
							padding: "0.4rem 0.6rem",
							borderRadius: "0.35rem",
							border: "1px solid #d1d5db",
							fontSize: "0.9rem",
							backgroundColor: "#ffffff",
						}}
					>
						<option value="">All manufacturers</option>
						{manufacturers.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</div>
			</div>

			<div style={{ overflowX: "auto", width: "100%" }}>
				<table style={{ borderCollapse: "collapse", width: "100%" }}>
					<thead>
						<tr>
							<th style={{ borderBottom: "1px solid #ccc" }}>Type ID</th>
							<th style={{ borderBottom: "1px solid #ccc" }}>Name</th>
							<th style={{ borderBottom: "1px solid #ccc" }}>Manufacturer</th>
							<th style={{ borderBottom: "1px solid #ccc" }}>Model</th>
							<th style={{ borderBottom: "1px solid #ccc" }}>Door Type</th>
						</tr>
					</thead>
					<tbody>
						{filteredAssets.map((asset) => {
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

							return (
								<tr key={asset.id}>
									<td style={{ padding: "0.3rem 0.5rem" }}>{asset.type_id}</td>
									<td style={{ padding: "0.3rem 0.5rem" }}>{asset.name}</td>
									<td style={{ padding: "0.3rem 0.5rem" }}>{asset.manufacturer_name}</td>
									<td style={{ padding: "0.3rem 0.5rem" }}>{asset.model}</td>
									<td style={{ padding: "0.3rem 0.5rem" }}>{doorTypeDisplay}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}