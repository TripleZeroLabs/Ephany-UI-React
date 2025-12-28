import { useEffect, useMemo, useState } from "react";
import { DataTable, type ColumnDef } from "../components/DataTable.tsx";
import { FiltersPanel } from "../components/FiltersPanel.tsx";
import { fetchProjects, type Project } from "../api/projects.ts";
import { ProjectSnapshotsModal } from "../components/ProjectSnapshotsModal.tsx";
import { usePageTitle } from "../hooks/usePageTitle.ts";

// --- TYPES ---
interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function ProjectsPage() {
  usePageTitle("Projects");

  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const [sort, setSort] = useState<SortConfig>({
    key: "latest_snapshot_date",
    direction: "desc",
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchProjects({
          page,
          pageSize,
          search: searchTerm.trim() || undefined,
          ordering: `${sort.direction === "desc" ? "-" : ""}${sort.key}`,
        });

        if (!mounted) return;
        setProjects(data.results);
        setTotalCount(data.count);
      } catch (err: unknown) {
        if (!mounted) return;
        setErrorMessage(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Fix: Use 'void' to explicitly ignore the returned promise
    void load();

    return () => {
      mounted = false;
    };
  }, [page, pageSize, searchTerm, sort]);

  const handleSortChange = (key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  // Explicitly typing the array as ColumnDef<Project>[] fixes inference errors
  const columns: ColumnDef<Project>[] = [
    {
      key: "job_id",
      header: "Job ID",
      sortable: true
    },
    {
      key: "name",
      header: "Project Name",
      sortable: true
    },
    {
      key: "snapshot_count",
      header: "Snapshots",
      sortable: true,
      render: (p: Project) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {p.snapshot_count}
        </span>
      ),
    },
    {
      key: "latest_snapshot_date",
      header: "Latest Snapshot",
      sortable: true,
      render: (p: Project) => {
        const latest = p.snapshots && p.snapshots.length > 0
          ? [...p.snapshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null;

        if (!latest) return <span className="text-slate-400 italic text-xs">No snapshots</span>;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {latest.name}
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
              {new Date(latest.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        );
      },
    },
  ];

  const PaginationBar = () => {
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);

    return (
      <div className="flex flex-col gap-2 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Page {page} of {totalPages}
          </span>
          <span className="text-slate-400">•</span>
          <span>Showing {from}-{to} of {totalCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
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
    return <div className="p-12 text-center text-sm text-slate-500 animate-pulse">Loading project data...</div>;
  }

  return (
    <div className="space-y-1">
      <FiltersPanel
        searchValue={searchTerm}
        onSearchChange={(val) => {
          setPage(1);
          setSearchTerm(val);
        }}
        searchPlaceholder="Search projects by name or job ID..."
      />

      <PaginationBar />

      <DataTable
        rows={projects}
        columns={columns}
        getRowKey={(p) => p.id}
        onRowClick={(project) => setSelectedProject(project)}
        sortColumn={sort.key}
        sortDirection={sort.direction}
        onSort={handleSortChange}
      />

      <div className="border-t border-slate-200 dark:border-slate-800">
        <PaginationBar />
      </div>

      <ProjectSnapshotsModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {errorMessage && (
        <div className="mx-4 my-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-100 text-xs">
          <strong>Sync Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}