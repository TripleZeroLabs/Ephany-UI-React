import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { FormField } from "../components/FormField";
import { RelationshipField } from "../components/RelationshipField";
import { QuickCreateModal } from "../components/QuickCreateModal";
import {
  fetchSnapshot,
  createSnapshot,
  updateSnapshot,
  deleteSnapshot,
  fetchProjects,
  createProject,
} from "../api/projects";

function parseErrors(err: unknown): string {
  try {
    const obj = JSON.parse((err as Error).message);
    if (typeof obj === "object") {
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n");
    }
  } catch { /* fall through */ }
  return String(err);
}

export function SnapshotFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [projectId, setProjectId] = useState<number | null>(
    searchParams.get("project") ? Number(searchParams.get("project")) : null
  );
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [projects, setProjects] = useState<{ id: number; label: string }[]>([]);

  // Quick-create project modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectJobId, setNewProjectJobId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects({ pageSize: 200 }).then((r) =>
      setProjects(r.results.map((p) => ({ id: p.id, label: `${p.job_id} — ${p.name}` })))
    );
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchSnapshot(Number(id))
      .then((s) => {
        setProjectId(s.project);
        setName(s.name);
        setDate(s.date);
      })
      .catch(() => setFormError("Failed to load snapshot."));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setFormError("A project is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit) {
        await updateSnapshot(Number(id), { project: projectId, name, date });
      } else {
        await createSnapshot({ project: projectId, name, date });
      }
      navigate(projectId ? `/projects` : "/snapshots");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this snapshot and all its asset instances? This cannot be undone.")) return;
    try {
      await deleteSnapshot(Number(id));
      navigate("/projects");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const fd = new FormData();
      fd.append("job_id", newProjectJobId);
      fd.append("name", newProjectName);
      const created = await createProject(fd);
      setProjects((prev) => [...prev, { id: created.id, label: `${created.job_id} — ${created.name}` }]);
      setProjectId(created.id);
      setShowNewProject(false);
      setNewProjectJobId("");
      setNewProjectName("");
    } catch (err) {
      setQuickError(parseErrors(err));
    } finally {
      setQuickSubmitting(false);
    }
  }

  return (
    <>
      <FormPageLayout
        title={isEdit ? "Edit Snapshot" : "New Snapshot"}
        onSubmit={handleSubmit}
        onDelete={isEdit ? handleDelete : undefined}
        submitting={submitting}
        error={formError}
      >
        <RelationshipField
          label="Project"
          required
          options={projects}
          value={projectId}
          onChange={setProjectId}
          onNew={() => { setQuickError(null); setShowNewProject(true); }}
        />
        <FormField label="Snapshot Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Schematic Design" />
        <FormField label="Date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormPageLayout>

      <QuickCreateModal open={showNewProject} title="New Project" onClose={() => setShowNewProject(false)}>
        {quickError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{quickError}</p>}
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job ID <span className="text-red-500">*</span></label>
            <input
              required
              value={newProjectJobId}
              onChange={(e) => setNewProjectJobId(e.target.value)}
              placeholder="e.g. PRJ-2025-001"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewProject(false)} className="px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={quickSubmitting} className="px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
              {quickSubmitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </QuickCreateModal>
    </>
  );
}
