// src/AssetsPage.tsx
import {type ChangeEvent, useEffect, useMemo, useState} from "react";
import {fetchAssets, type Asset} from "./api/assets";

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

    if (loading) {
        return (
            <div className="p-6 text-sm text-slate-600">
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
        <div className="mb-4">
            <section
                className="filters rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3">

                {/* Top row: Inputs */}
                <div className="flex flex-wrap items-end gap-3">

                    <div className="flex-1 min-w-[220px]">
                        <label
                            htmlFor="asset-search"
                            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                            Search (any field)
                        </label>

                        <input
                            id="asset-search"
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Type to search type, name, model, custom fields…"
                            className="
					w-full rounded-md
					border border-slate-300 dark:border-slate-600
					bg-white dark:bg-slate-900
					px-3 py-2 text-sm
					text-slate-900 dark:text-slate-100
					shadow-sm
					placeholder:text-slate-400 dark:placeholder:text-slate-500
					focus:border-slate-500 dark:focus:border-slate-400
					focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10
				"
                        />
                    </div>

                    <div className="flex-none min-w-[180px] sm:min-w-[220px]">
                        <label
                            htmlFor="manufacturer-filter"
                            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                            Filter by manufacturer
                        </label>

                        <select
                            id="manufacturer-filter"
                            value={manufacturerFilter}
                            onChange={handleManufacturerChange}
                            className="
					w-full rounded-md
					border border-slate-300 dark:border-slate-600
					bg-white dark:bg-slate-900
					px-3 py-2 text-sm
					text-slate-900 dark:text-slate-100
					shadow-sm
					focus:border-slate-500 dark:focus:border-slate-400
					focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10
				"
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

                {/* Bottom row: Summary */}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredAssets.length} of {assets.length} assets from{" "}
                    <span className="font-mono">framework.ephany.io</span>
                </p>

            </section>
            <section
                className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Type ID
                        </th>
                        <th className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Name
                        </th>
                        <th className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Manufacturer
                        </th>
                        <th className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Model
                        </th>
                        <th className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Door Type
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAssets.map((asset) => {
                        let doorTypeDisplay: string;

                        if (!asset.custom_fields) {
                            doorTypeDisplay = "no custom fields";
                        } else if (
                            !Object.prototype.hasOwnProperty.call(asset.custom_fields, "door_type")
                        ) {
                            doorTypeDisplay = "CUSTOM FIELD NOT FOUND";
                        } else {
                            const value = (asset.custom_fields as any).door_type;
                            doorTypeDisplay = value ?? "–";
                        }

                        return (
                            <tr
                                key={asset.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100">
                                    {asset.type_id}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100">
                                    {asset.name}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100">
                                    {asset.manufacturer_name}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100">
                                    {asset.model}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100">
                                    {doorTypeDisplay}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </section>
        </div>
    );
}