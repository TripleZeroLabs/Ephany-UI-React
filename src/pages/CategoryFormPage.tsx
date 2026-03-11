import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { CategoryForm, type CategoryFormValues } from "../components/forms/CategoryForm";
import { fetchCategory, createCategory, updateCategory, deleteCategory } from "../api/assets";

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

export function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<CategoryFormValues>({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchCategory(Number(id))
      .then((c) => setValues({ name: c.name, description: c.description ?? "" }))
      .catch(() => setFormError("Failed to load category."));
  }, [id]);

  function handleChange(field: keyof CategoryFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit) {
        await updateCategory(Number(id), values);
      } else {
        await createCategory(values);
      }
      navigate("/categories");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;
    try {
      await deleteCategory(Number(id));
      navigate("/categories");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Category" : "New Category"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      <CategoryForm values={values} onChange={handleChange} errors={errors} />
    </FormPageLayout>
  );
}
