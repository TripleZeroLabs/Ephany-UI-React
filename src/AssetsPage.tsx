// src/AssetsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchAssets,
  fetchAllCategories,
  type Asset,
  type AssetCategory,
} from "./api/assets";
import { FiltersPanel, type SelectFilterConfig } from "./components/FiltersPanel";
import { DataTable, type ColumnDef } from "./components/DataTable";
import { DetailModal } from "./components/DetailModal";
import { usePageTitle } from "./hooks/usePageTitle";

export function AssetsPage() {
  usePageTitle("Assets");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<AssetCategory[]>([]);

  // Server-side paging + search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  const [searchTerm, setSearchTerm] = useState("");
  // Filters now control the server-side query parameters.
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  /**
   * Effect for fetching paginated asset data.
   * Runs on changes to page, pageSize, search, and server-side filters.
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
          // Pass category filter to the server for correct pagination.
          categoryName: categoryFilter || undefined,
        });

        if (!mounted) return;
        setAssets(data.results);
        setTotalCount(data.count);
      } catch (err: unknown) {
        if (!mounted) return;
        // Type-safe error handling
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
  ]);

  /**
   * Effect for fetching static category data for the filter dropdown.
   * Runs only once on component mount.
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await fetchAllCategories();
        setAllCategories(categories);
      } catch (err: unknown) {
        // Log, but do not block asset loading if category options fail to load
        console.error("Failed to load all categories for filter:", err);
      }
    };
    loadCategories();
  }, []);

  // Manufacturer options (calculated from current page's assets)
  // This is still subject to the disappearing options bug until migrated to the server.
  const manufacturers = useMemo(() => {
    const names = Array.from(
      new Set(
        assets
          .map((a) => a.manufacturer_name)
          .filter((name): name is string => !!name),
      ),
    );
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [assets]);

  /**
   * Client-side filters. Only manufacturer filtering remains here
   * until it is also migrated to the server. Category filtering is handled on the server.
   */
  const filteredAssets = useMemo(() => {
    // If the Manufacturer filter is active, we still apply it client-side.
    return assets.filter((asset) => {
      if (manufacturerFilter && asset.manufacturer_name !== manufacturerFilter) {
        return false;
      }
      return true;
    });
  }, [assets, manufacturerFilter]);

  // FiltersPanel handlers
  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  const handleManufacturerChange = (value: string) => {
    // Reset page to 1 on filter change to ensure pagination remains correct.
    setPage(1);
    setManufacturerFilter(value);
  };

  const handleCategoryChange = (value: string) => {
    // Reset page to 1 on filter change to ensure pagination remains correct.
    setPage(1);
    setCategoryFilter(value);
  };

  const selectFilters: SelectFilterConfig[] = [
    // Manufacturer filter (options based on current page)
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
    // Category filter (options based on static, full list)
    ...(allCategories.length
      ? [
          {
            id: "category-filter",
            label: "Category",
            value: categoryFilter,
            // Map category objects [{id: 1, name: "A"}] to simple names ["A"]
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
        // Safe access using bracket notation instead of 'any' casting
        const value = asset.custom_fields["door_type"] as string | undefined;
        return value ?? "—";
      },
    },
  ];

  const PaginationBar = () => {
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);

    return (
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
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
        rows={filteredAssets}
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