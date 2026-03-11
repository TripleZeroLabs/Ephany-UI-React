import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { FormField } from "../components/FormField";
import { fetchProjectDetail, createProject, updateProject, deleteProject } from "../api/projects";

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

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [jobId, setJobId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioImg, setPortfolioImg] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProjectDetail(Number(id))
      .then((p) => {
        setJobId(p.job_id);
        setName(p.name);
        setDescription(p.description ?? "");
      })
      .catch(() => setFormError("Failed to load project."));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("job_id", jobId);
      fd.append("name", name);
      fd.append("description", description);
      if (portfolioImg) fd.append("portfolio_img", portfolioImg);

      if (isEdit) {
        await updateProject(Number(id), fd);
      } else {
        await createProject(fd);
      }
      navigate("/projects");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this project and all its snapshots? This cannot be undone.")) return;
    try {
      await deleteProject(Number(id));
      navigate("/projects");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Project" : "New Project"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      <FormField label="Job ID" required value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="e.g. PRJ-2025-001" />
      <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
      <FormField as="textarea" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Portfolio Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPortfolioImg(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {isEdit && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Leave blank to keep existing image.</p>}
      </div>
    </FormPageLayout>
  );
}
