import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { AttributeForm, type AttributeFormValues } from "../components/forms/AttributeForm";
import { fetchAttribute, createAttribute, updateAttribute, deleteAttribute } from "../api/assets";

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

const DEFAULTS: AttributeFormValues = {
  name: "",
  scope: "type",
  data_type: "str",
  unit_type: "none",
};

export function AttributeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState<AttributeFormValues>(DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAttribute(Number(id))
      .then((a) =>
        setValues({ name: a.name, scope: a.scope, data_type: a.data_type, unit_type: a.unit_type })
      )
      .catch(() => setFormError("Failed to load attribute."));
  }, [id]);

  function handleChange(field: keyof AttributeFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit) {
        await updateAttribute(Number(id), values);
      } else {
        await createAttribute(values);
      }
      navigate("/attributes");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this attribute? Any assets using it as a custom field will be affected.")) return;
    try {
      await deleteAttribute(Number(id));
      navigate("/attributes");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  return (
    <FormPageLayout
      title={isEdit ? "Edit Attribute" : "New Attribute"}
      onSubmit={handleSubmit}
      onDelete={isEdit ? handleDelete : undefined}
      submitting={submitting}
      error={formError}
    >
      <AttributeForm values={values} onChange={handleChange} errors={errors} />
    </FormPageLayout>
  );
}
