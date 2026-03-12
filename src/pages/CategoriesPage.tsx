import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { FiltersPanel } from "../components/FiltersPanel.tsx";
import { fetchAllCategories, type AssetCategory } from "../api/assets.ts";
import { usePageTitle } from "../hooks/usePageTitle.ts";

export function CategoriesPage() {
  usePageTitle("Asset Categories");
  const navigate = useNavigate();

  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [filtered, setFiltered] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  // fetchAllCategories returns all (non-paginated), so we paginate client-side
  useEffect(() => {
    setLoading(true);
    fetchAllCategories()
      .then((data) => setCategories(data))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    setFiltered(q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories);
    setPage(1);
  }, [categories, searchTerm]);

  const totalCount = filtered.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);
  const pageData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const columns: ColumnDef<AssetCategory>[] = [
    { key: "name", header: "Name" },
    { key: "description", header: "Description", render: (c) => c.description || <span className="text-slate-400">—</span> },
    {
      key: "id",
      header: "",
      render: (c) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/categories/${c.id}/edit`); }}
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
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">Page {page} of {totalPages}</span>
          <span className="text-slate-400">•</span>
          <span>Showing {from}–{to} of {totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="hidden sm:block text-slate-500 dark:text-slate-400">Rows:</label>
          <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-6 text-sm text-slate-600 dark:text-slate-300">Loading categories…</div>;
  if (error) return <div className="m-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Error: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between pt-4">
        <FiltersPanel searchValue={searchTerm} onSearchChange={(v) => setSearchTerm(v)} searchPlaceholder="Search categories…" />
        <button onClick={() => navigate("/categories/new")} className="ml-4 shrink-0 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">+ New Category</button>
      </div>
      <PaginationBar />
      <DataTable rows={pageData} columns={columns} getRowKey={(c) => c.id} onRowClick={(c) => navigate(`/categories/${c.id}/edit`)} />
      <div className="border-t border-slate-200 dark:border-slate-800"><PaginationBar /></div>
    </div>
  );
}
