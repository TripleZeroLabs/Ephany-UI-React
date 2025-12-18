import { useEffect, useMemo, useState } from "react";
import {
  fetchAssets,
  fetchAllCategories,
  fetchAllManufacturers, // <-- Import new function
  type Asset,
  type AssetCategory,
  type AssetManufacturer, // <-- Import new type
} from "../api/assets.ts";
import { FiltersPanel, type SelectFilterConfig } from "../components/FiltersPanel.tsx";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { DetailModal } from "../components/DetailModal.tsx";
import { usePageTitle } from "../hooks/usePageTitle.ts";

export function AssetsPage() {
  usePageTitle("Assets");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Static filter options
  const [allCategories, setAllCategories] = useState<AssetCategory[]>([]);
  const [allManufacturers, setAllManufacturers] = useState<AssetManufacturer[]>([]);

  // Server-side paging + search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  const [searchTerm, setSearchTerm] = useState("");
  // Server-side filters
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  /**
   * Effect for fetching paginated asset data.
   */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAssets({
          page,
          pageSize,
          search: searchTerm.trim() || undefined,
          // Pass BOTH filters to the server
          categoryName: categoryFilter || undefined,
          manufacturerName: manufacturerFilter || undefined,
        });

        if (!mounted) return;
        setAssets(data.results);
        setTotalCount(data.count);
      } catch (err: unknown) {
        if (!mounted) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [
    page,
    pageSize,
    searchTerm,
    categoryFilter,
    manufacturerFilter, // <-- Added to dependency array
  ]);

  /**
   * Effect for fetching static filter data (Categories & Manufacturers).
   */
  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Run fetches in parallel
        const [categories, manufacturers] = await Promise.all([
          fetchAllCategories(),
          fetchAllManufacturers(),
        ]);

        setAllCategories(categories);
        setAllManufacturers(manufacturers);
      } catch (err: unknown) {
        console.error("Failed to load filter options:", err);
      }
    };
    loadFilters();
  }, []);

  // Removed: Client-side calculation of manufacturers
  // Removed: Client-side filtering logic (filteredAssets)

  // Handlers
  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  const handleManufacturerChange = (value: string) => {
    setPage(1);
    setManufacturerFilter(value);
  };

  const handleCategoryChange = (value: string) => {
    setPage(1);
    setCategoryFilter(value);
  };

  const selectFilters: SelectFilterConfig[] = [
    // Manufacturer filter (now using static server list)
    ...(allManufacturers.length
      ? [
          {
            id: "manufacturer-filter",
            label: "Manufacturer",
            value: manufacturerFilter,
            options: allManufacturers.map((m) => m.name),
            onChange: handleManufacturerChange,
          } as SelectFilterConfig,
        ]
      : []),
    // Category filter (using static server list)
    ...(allCategories.length
      ? [
          {
            id: "category-filter",
            label: "Category",
            value: categoryFilter,
            options: allCategories.map((c) => c.name),
            onChange: handleCategoryChange,
          } as SelectFilterConfig,
        ]
      : []),
  ];

  const columns: ColumnDef<Asset>[] = [
    { key: "type_id", header: "Type ID" },
    { key: "name", header: "Name" },
    { key: "manufacturer_name", header: "Manufacturer" },
    { key: "model", header: "Model" },
    {
      key: "door_type",
      header: "Door Type",
      render: (asset) => {
        if (!asset.custom_fields) return "—";
        const value = asset.custom_fields["door_type"] as string | undefined;
        return value ?? "—";
      },
    },
  ];

  const PaginationBar = () => {
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);

    return (
      <div className="flex flex-col gap-2 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="items-center gap-2 flex">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Page {page} of {totalPages}
          </span>
          <span className="text-slate-400">•</span>
          <span>
            Showing {from}-{to} of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="hidden sm:block text-slate-500 dark:text-slate-400">
            Rows:
          </label>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading && assets.length === 0) {
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
    <div>
      <FiltersPanel
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search name, description, manufacturer, model…"
        selectFilters={selectFilters}
      />

      <PaginationBar />

      <DataTable
        rows={assets} // <-- Passed 'assets' directly now, not 'filteredAssets'
        columns={columns}
        getRowKey={(asset) => asset.id}
        onRowClick={(asset) => setSelectedAsset(asset)}
      />

      <div className="border-t border-slate-200 dark:border-slate-800">
        <PaginationBar />
      </div>

      <DetailModal
        open={!!selectedAsset}
        item={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={
          selectedAsset
            ? selectedAsset.name || selectedAsset.type_id || "Asset details"
            : "Asset details"
        }
      />
    </div>
  );
}