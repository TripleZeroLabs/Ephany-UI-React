import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { AssetFileForm, type AssetFileFormValues } from "../components/forms/AssetFileForm";
import { fetchAssetFileRecord, createAssetFile, updateAssetFile, deleteAssetFile } from "../api/assets";

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

export function AssetFileFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<AssetFileFormValues>({ file: null, category: "ETC" });
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAssetFileRecord(Number(id))
      .then((f) => {
        setValues({ file: null, category: f.category });
        // Extract filename from URL
        const parts = f.file.split("/");
        setCurrentFileName(parts[parts.length - 1]);
      })
      .catch(() => setFormError("Failed to load file record."));
  }, [id]);

  function handleChange(field: keyof AssetFileFormValues, value: string | File | null) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !values.file) {
      setErrors((e) => ({ ...e, file: "A file is required." }));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("category", values.category);
      if (values.file) fd.append("file", values.file);

      if (isEdit) {
        await updateAssetFile(Number(id), fd);
      } else {
        await createAssetFile(fd);
      }
      navigate("/files");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this file record? This cannot be undone.")) return;
    try {
      await deleteAssetFile(Number(id));
      navigate("/files");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit File" : "New File"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      {isEdit && currentFileName && (
        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2">
          Current file: <span className="font-medium text-slate-700 dark:text-slate-200">{currentFileName}</span>
        </div>
      )}
      <AssetFileForm values={values} onChange={handleChange} errors={errors} isEdit={isEdit} />
    </FormPageLayout>
  );
}
