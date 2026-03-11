import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { VendorForm, type VendorFormValues } from "../components/forms/VendorForm";
import { fetchVendor, createVendor, updateVendor, deleteVendor } from "../api/vendors";

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

export function VendorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<VendorFormValues>({ name: "", website: "", contact_email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchVendor(Number(id))
      .then((v) => setValues({ name: v.name, website: v.website ?? "", contact_email: v.contact_email ?? "" }))
      .catch(() => setFormError("Failed to load vendor."));
  }, [id]);

  function handleChange(field: keyof VendorFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit) {
        await updateVendor(Number(id), values);
      } else {
        await createVendor(values);
      }
      navigate("/vendors");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this vendor? This cannot be undone.")) return;
    try {
      await deleteVendor(Number(id));
      navigate("/vendors");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Vendor" : "New Vendor"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      <VendorForm values={values} onChange={handleChange} errors={errors} />
    </FormPageLayout>
  );
}
