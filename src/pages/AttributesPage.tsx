import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { FiltersPanel } from "../components/FiltersPanel.tsx";
import { fetchAttributes, type AssetAttribute } from "../api/assets.ts";
import { usePageTitle } from "../hooks/usePageTitle.ts";

export function AttributesPage() {
  usePageTitle("Asset Attributes");
  const navigate = useNavigate();

  const [attributes, setAttributes] = useState<AssetAttribute[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchAttributes({ page, pageSize, search: searchTerm.trim() || undefined })
      .then((data) => {
        if (!mounted) return;
        setAttributes(data.results);
        setTotalCount(data.count);
      })
      .catch((err) => { if (mounted) setError(String(err)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [page, pageSize, searchTerm]);

  const SCOPE_LABELS: Record<string, string> = { type: "Asset Type", instance: "Instance", both: "Both" };
  const TYPE_LABELS: Record<string, string> = { str: "Text", int: "Integer", float: "Decimal", bool: "Boolean" };

  const columns: ColumnDef<AssetAttribute>[] = [
    { key: "name", header: "Name" },
    { key: "scope", header: "Scope", render: (a) => SCOPE_LABELS[a.scope] ?? a.scope },
    { key: "data_type", header: "Data Type", render: (a) => TYPE_LABELS[a.data_type] ?? a.data_type },
    {
      key: "unit_type",
      header: "Unit",
      render: (a) => a.unit_type === "none" ? <span className="text-slate-400">—</span> : <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{a.unit_type.split(":").pop()}</span>,
    },
    {
      key: "id",
      header: "",
      render: (a) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/attributes/${a.id}/edit`); }}
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
          <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    );
  };

  if (loading && attributes.length === 0) return <div className="p-6 text-sm text-slate-600 dark:text-slate-300">Loading attributes…</div>;
  if (error) return <div className="m-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Error: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between pt-4">
        <FiltersPanel searchValue={searchTerm} onSearchChange={(v) => { setPage(1); setSearchTerm(v); }} searchPlaceholder="Search attributes…" />
        <button onClick={() => navigate("/attributes/new")} className="ml-4 shrink-0 px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">+ New Attribute</button>
      </div>
      <PaginationBar />
      <DataTable rows={attributes} columns={columns} getRowKey={(a) => a.id} onRowClick={(a) => navigate(`/attributes/${a.id}/edit`)} />
      <div className="border-t border-slate-200 dark:border-slate-800"><PaginationBar /></div>
    </div>
  );
}
