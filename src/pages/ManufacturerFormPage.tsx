import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { ManufacturerForm, type ManufacturerFormValues } from "../components/forms/ManufacturerForm";
import {
  fetchManufacturer,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from "../api/manufacturers";

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

export function ManufacturerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<ManufacturerFormValues>({ name: "", url: "", logo: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchManufacturer(Number(id))
      .then((m) => setValues({ name: m.name, url: m.url ?? "", logo: null }))
      .catch(() => setFormError("Failed to load manufacturer."));
  }, [id]);

  function handleChange(field: keyof ManufacturerFormValues, value: string | File | null) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("url", values.url);
      if (values.logo) fd.append("logo", values.logo);

      if (isEdit) {
        await updateManufacturer(Number(id), fd);
      } else {
        await createManufacturer(fd);
      }
      navigate("/manufacturers");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this manufacturer? This cannot be undone.")) return;
    try {
      await deleteManufacturer(Number(id));
      navigate("/manufacturers");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Manufacturer" : "New Manufacturer"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      <ManufacturerForm values={values} onChange={handleChange} errors={errors} />
    </FormPageLayout>
  );
}
