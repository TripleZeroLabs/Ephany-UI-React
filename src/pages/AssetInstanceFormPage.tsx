import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { FormField } from "../components/FormField";
import { fetchInstance, updateInstance } from "../api/projects";
import { fetchAllAttributes, type AssetAttribute } from "../api/assets";

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

export function AssetInstanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [instanceId, setInstanceId] = useState("");
  const [location, setLocation] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [attributes, setAttributes] = useState<AssetAttribute[]>([]);
  const [assetName, setAssetName] = useState("");
  const [snapshotName] = useState("");
  const [snapshotId, setSnapshotId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchInstance(Number(id)).then((inst) => {
      setInstanceId(inst.instance_id ?? "");
      setLocation(inst.location ?? "");
      setSnapshotId(inst.snapshot);
      if (inst.asset_details) {
        setAssetName(inst.asset_details.name);
      }
      if (inst.custom_fields) {
        setCustomFields(
          Object.fromEntries(Object.entries(inst.custom_fields).map(([k, v]) => [k, String(v ?? "")]))
        );
      }
    }).catch(() => setFormError("Failed to load instance."));

    fetchAllAttributes().then(setAttributes);
  }, [id]);

  const instanceAttrs = attributes.filter((a) => a.scope === "instance" || a.scope === "both");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const cf: Record<string, unknown> = {};
      for (const attr of instanceAttrs) {
        const val = customFields[attr.name];
        if (val != null && val !== "") {
          cf[attr.name] = attr.data_type === "int" ? parseInt(val) :
                          attr.data_type === "float" ? parseFloat(val) :
                          attr.data_type === "bool" ? val === "true" : val;
        }
      }
      await updateInstance(Number(id), {
        instance_id: instanceId,
        location,
        custom_fields: cf,
      });
      // Navigate back to the snapshot detail page if we know the snapshot
      if (snapshotId) {
        navigate(`/snapshots/${snapshotId}`);
      } else {
        navigate(-1);
      }
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPageLayout
      title="Edit Asset Instance"
      onSubmit={handleSubmit}
      submitting={submitting}
      error={formError}
    >
      {/* Read-only context */}
      {assetName && (
        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2">
          Asset: <span className="font-medium text-slate-700 dark:text-slate-200">{assetName}</span>
          {snapshotName && <> · Snapshot: <span className="font-medium text-slate-700 dark:text-slate-200">{snapshotName}</span></>}
        </div>
      )}

      <FormField label="Instance ID" value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="e.g. EQ-001" />
      <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kitchen Zone A" />

      {instanceAttrs.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Instance Custom Fields</p>
          <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            {instanceAttrs.map((attr) => (
              <div key={attr.name}>
                {attr.data_type === "bool" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`cf_${attr.name}`}
                      checked={customFields[attr.name] === "true"}
                      onChange={(e) =>
                        setCustomFields((prev) => ({ ...prev, [attr.name]: e.target.checked ? "true" : "false" }))
                      }
                      className="rounded border-slate-300"
                    />
                    <label htmlFor={`cf_${attr.name}`} className="text-sm text-slate-700 dark:text-slate-300">
                      {attr.name}
                    </label>
                  </div>
                ) : (
                  <FormField
                    label={attr.name}
                    type={attr.data_type === "int" || attr.data_type === "float" ? "number" : "text"}
                    step={attr.data_type === "float" ? "any" : undefined}
                    value={customFields[attr.name] ?? ""}
                    onChange={(e) =>
                      setCustomFields((prev) => ({ ...prev, [attr.name]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </FormPageLayout>
  );
}
