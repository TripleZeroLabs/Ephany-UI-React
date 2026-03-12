import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAssets,
  fetchAllCategories,
  fetchAllManufacturers,
  type Asset,
  type AssetCategory,
  type AssetManufacturer,
} from "../api/assets.ts";
import { FiltersPanel, type SelectFilterConfig } from "../components/FiltersPanel.tsx";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { AssetCatalogGrid } from "../components/AssetCatalogGrid.tsx";
import { DetailModal } from "../components/DetailModal.tsx";
import { usePageTitle } from "../hooks/usePageTitle.ts";

type ViewMode = "table" | "catalog";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function AssetsPage() {
  usePageTitle("Assets");
  const navigate = useNavigate();

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

  // Sort state
  const [sort, setSort] = useState<SortConfig>({
    key: "type_id",
    direction: "asc",
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

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
          categoryName: categoryFilter || undefined,
          manufacturerName: manufacturerFilter || undefined,
          ordering: `${sort.direction === "desc" ? "-" : ""}${sort.key}`,
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
        // FIXED: Only update state if mounted; removed unsafe 'return'
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [
    page,
    pageSize,
    searchTerm,
    categoryFilter,
    manufacturerFilter,
    sort,
  ]);

  /**
   * Effect for fetching static filter data (Categories & Manufacturers).
   */
  useEffect(() => {
    const loadFilters = async () => {
      try {
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
    void loadFilters();
  }, []);

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

  const handleSortChange = (key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const selectFilters: SelectFilterConfig[] = [
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
    { key: "type_id", header: "Type ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "manufacturer_name", header: "Manufacturer", sortable: true },
    { key: "model", header: "Model", sortable: true },
    {
      key: "door_type",
      header: "Door Type",
      render: (asset) => {
        if (!asset.custom_fields) return "—";
        const fields = asset.custom_fields as Record<string, unknown>;
        const value = fields["door_type"] as string | undefined;
        return value ?? "—";
      },
    },
    {
      key: "id",
      header: "",
      render: (asset) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}/edit`); }}
          className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Edit
        </button>
      ),
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
      <div className="flex items-center justify-between pt-4">
        <FiltersPanel
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search name, description, manufacturer, model…"
          selectFilters={selectFilters}
        />
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              title="Table view"
              onClick={() => setViewMode("table")}
              className={`px-2 py-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                  : "bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:hover:text-slate-300"
              }`}
            >
              {/* Table / list icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
              </svg>
            </button>
            <button
              title="Catalog view"
              onClick={() => setViewMode("catalog")}
              className={`px-2 py-1.5 transition-colors border-l border-slate-200 dark:border-slate-700 ${
                viewMode === "catalog"
                  ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                  : "bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:hover:text-slate-300"
              }`}
            >
              {/* Grid / 4-squares icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => navigate("/assets/new")}
            className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            + New Asset
          </button>
        </div>
      </div>

      <PaginationBar />

      {viewMode === "table" ? (
        <DataTable
          rows={assets}
          columns={columns}
          getRowKey={(asset) => asset.id}
          onRowClick={(asset) => setSelectedAsset(asset)}
          sortColumn={sort.key}
          sortDirection={sort.direction}
          onSort={handleSortChange}
        />
      ) : (
        <AssetCatalogGrid
          assets={assets}
          onSelect={(asset) => setSelectedAsset(asset)}
          onEdit={(asset) => navigate(`/assets/${asset.id}/edit`)}
        />
      )}

      <div className="border-t border-slate-200 dark:border-slate-800">
        <PaginationBar />
      </div>

      <DetailModal
        open={!!selectedAsset}
        item={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onEdit={selectedAsset ? () => navigate(`/assets/${selectedAsset.id}/edit`) : undefined}
        title={
          selectedAsset
            ? selectedAsset.name || selectedAsset.type_id || "Asset details"
            : "Asset details"
        }
      />
    </div>
  );
}