import { useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { FiltersPanel } from "../components/FiltersPanel.tsx";
import { fetchProjects, type Project } from "../api/projects.ts";
import { ProjectSnapshotsModal } from "../components/ProjectSnapshotsModal.tsx";
import { usePageTitle } from "../hooks/usePageTitle.ts";

/**
 * Renders the main Projects listing page with server-side pagination,
 * searching, and a detail modal for viewing project snapshots.
 */
export function ProjectsPage() {
  usePageTitle("Projects");

  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProjects({
          page,
          pageSize,
          search: searchTerm.trim() || undefined,
        });

        if (!mounted) return;
        setProjects(data.results);
        setTotalCount(data.count);
      } catch (err: unknown) {
        if (!mounted) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
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
    setPage(1);
    setSearchTerm(value);
  };

  const columns: ColumnDef<Project>[] = [
    { key: "job_id", header: "Job ID" },
    { key: "name", header: "Project Name" },
    { 
      key: "snapshot_count", 
      header: "Snapshots",
      render: (p) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {p.snapshot_count}
        </span>
      )
    },
    { 
      key: "updated_at", 
      header: "Last Updated",
      render: (p) => new Date(p.updated_at).toLocaleDateString() 
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

  if (loading && projects.length === 0) {
    return <div className="p-6 text-sm text-slate-600 dark:text-slate-300">Loading projects…</div>;
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
        searchPlaceholder="Search projects by name or ID…"
      />

      <PaginationBar />

      <DataTable
        rows={projects}
        columns={columns}
        getRowKey={(p) => p.id}
        onRowClick={(project) => setSelectedProject(project)}
      />

      <div className="border-t border-slate-200 dark:border-slate-800">
        <PaginationBar />
      </div>

      <ProjectSnapshotsModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </div>
  );
}