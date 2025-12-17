import { useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "./components/DataTable";
import { FiltersPanel } from "./components/FiltersPanel";
import { fetchManufacturers, type Manufacturer } from "./api/manufacturers";
import { usePageTitle } from "./hooks/usePageTitle";

export function ManufacturersPage() {
  usePageTitle("Manufacturers");

  // Data state
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate total pages based on server count
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  /**
   * Effect to fetch paginated data from the server.
   * Runs whenever page, pageSize, or search term changes.
   */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchManufacturers({
          page,
          pageSize,
          search: searchTerm.trim() || undefined,
        });

        if (!mounted) return;
        setManufacturers(data.results);
        setTotalCount(data.count);
      } catch (err: unknown) {
        if (!mounted) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        // Only update loading state if the component is still mounted.
        // Avoids 'return' in finally block to prevent swallowing exceptions.
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, searchTerm]);

  const handleSearchChange = (value: string) => {
    setPage(1); // Reset to page 1 on new search
    setSearchTerm(value);
  };

  const columns: ColumnDef<Manufacturer>[] = [
    {
      key: "logo",
      header: "Logo",
      render: (m) =>
        m.logo ? (
          <img
            src={m.logo}
            alt={`${m.name} logo`}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800" />
        ),
    },
    { key: "name", header: "Company Name" },
    {
      key: "url",
      header: "Website",
      render: (m) =>
        m.url ? (
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            {m.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  const PaginationBar = () => {
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);

    return (
      <div className="flex flex-col gap-2 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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

  if (loading && manufacturers.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
        Loading manufacturers…
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
        searchPlaceholder="Search manufacturers…"
      />

      <PaginationBar />

      <DataTable
        rows={manufacturers}
        columns={columns}
        getRowKey={(m) => m.id}
      />

      <div className="border-t border-slate-200 dark:border-slate-800">
        <PaginationBar />
      </div>
    </div>
  );
}