import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormPageLayout } from "../components/FormPageLayout";
import { FormField } from "../components/FormField";
import { RelationshipField } from "../components/RelationshipField";
import { QuickCreateModal } from "../components/QuickCreateModal";
import { ManufacturerForm, type ManufacturerFormValues } from "../components/forms/ManufacturerForm";
import { CategoryForm, type CategoryFormValues } from "../components/forms/CategoryForm";
import { AssetFileForm, type AssetFileFormValues } from "../components/forms/AssetFileForm";
import {
  fetchAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  fetchAllAttributes,
  fetchAssetFiles,
  createCategory as apiCreateCategory,
  createAssetFile as apiCreateAssetFile,
  fetchAllCategories,
  type AssetAttribute,
  type AssetFile,
} from "../api/assets";
import { fetchManufacturers, createManufacturer as apiCreateManufacturer } from "../api/manufacturers";

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

export function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Core fields
  const [typeId, setTypeId] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [manufacturerId, setManufacturerId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [catalogImgFile, setCatalogImgFile] = useState<File | null>(null);
  const [overallHeight, setOverallHeight] = useState("");
  const [overallWidth, setOverallWidth] = useState("");
  const [overallDepth, setOverallDepth] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  // Relationship options
  const [manufacturers, setManufacturers] = useState<{ id: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; label: string }[]>([]);
  const [attributes, setAttributes] = useState<AssetAttribute[]>([]);
  const [allFiles, setAllFiles] = useState<AssetFile[]>([]);

  // Quick-create modals
  const [showNewMfr, setShowNewMfr] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [mfrValues, setMfrValues] = useState<ManufacturerFormValues>({ name: "", url: "", logo: null });
  const [catValues, setCatValues] = useState<CategoryFormValues>({ name: "", description: "" });
  const [fileValues, setFileValues] = useState<AssetFileFormValues>({ file: null, category: "ETC" });
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load relationship options
  useEffect(() => {
    fetchManufacturers({ pageSize: 200 }).then((r) =>
      setManufacturers(r.results.map((m) => ({ id: m.id, label: m.name })))
    );
    fetchAllCategories().then((cats) =>
      setCategories(cats.map((c) => ({ id: c.id, label: c.name })))
    );
    fetchAllAttributes().then(setAttributes);
    fetchAssetFiles({ pageSize: 200 }).then((r) => setAllFiles(r.results));
  }, []);

  // Load existing asset if editing
  useEffect(() => {
    if (!id) return;
    fetchAsset(Number(id)).then((a) => {
      setTypeId(a.type_id);
      setName(a.name);
      setModel(a.model);
      setDescription(a.description ?? "");
      setUrl(a.url ?? "");
      setManufacturerId(typeof a.manufacturer === "number" ? a.manufacturer : (a.manufacturer as any)?.id ?? null);
      setCategoryId(typeof a.category === "number" ? a.category : (a.category as any)?.id ?? null);
      setOverallHeight(a.overall_height != null ? String(a.overall_height) : "");
      setOverallWidth(a.overall_width != null ? String(a.overall_width) : "");
      setOverallDepth(a.overall_depth != null ? String(a.overall_depth) : "");
      if (a.custom_fields) {
        setCustomFields(Object.fromEntries(Object.entries(a.custom_fields).map(([k, v]) => [k, String(v ?? "")])));
      }
      if (Array.isArray(a.files)) {
        setSelectedFileIds(a.files.map((f: any) => f.id ?? f));
      }
    }).catch(() => setFormError("Failed to load asset."));
  }, [id]);

  function toggleFileId(fileId: number) {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((x) => x !== fileId) : [...prev, fileId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("type_id", typeId);
      fd.append("name", name);
      fd.append("model", model);
      fd.append("description", description);
      fd.append("url", url);
      if (manufacturerId != null) fd.append("manufacturer_id", String(manufacturerId));
      if (categoryId != null) fd.append("category_id", String(categoryId));
      if (catalogImgFile) fd.append("catalog_img", catalogImgFile);
      if (overallHeight !== "") {
        fd.append("overall_height", overallHeight);
        fd.append("input_units", JSON.stringify({ length: "mm" }));
      }
      if (overallWidth !== "") fd.append("overall_width", overallWidth);
      if (overallDepth !== "") fd.append("overall_depth", overallDepth);

      // Custom fields — only include ones with values
      const cf: Record<string, unknown> = {};
      for (const attr of attributes.filter((a) => a.scope === "type" || a.scope === "both")) {
        const val = customFields[attr.name];
        if (val != null && val !== "") {
          cf[attr.name] = attr.data_type === "int" ? parseInt(val) :
                          attr.data_type === "float" ? parseFloat(val) :
                          attr.data_type === "bool" ? val === "true" : val;
        }
      }
      if (Object.keys(cf).length > 0) {
        fd.append("custom_fields", JSON.stringify(cf));
      }

      // File IDs
      selectedFileIds.forEach((fid) => fd.append("file_ids", String(fid)));

      if (isEdit) {
        await updateAsset(Number(id), fd);
      } else {
        await createAsset(fd);
      }
      navigate("/assets");
    } catch (err) {
      setFormError(parseErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this asset? This cannot be undone.")) return;
    try {
      await deleteAsset(Number(id));
      navigate("/assets");
    } catch (err) {
      setFormError(parseErrors(err));
    }
  }

  // Quick-create handlers
  async function handleCreateManufacturer(e: React.FormEvent) {
    e.preventDefault();
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const fd = new FormData();
      fd.append("name", mfrValues.name);
      fd.append("url", mfrValues.url);
      if (mfrValues.logo) fd.append("logo", mfrValues.logo);
      const created = await apiCreateManufacturer(fd);
      setManufacturers((prev) => [...prev, { id: created.id, label: created.name }]);
      setManufacturerId(created.id);
      setShowNewMfr(false);
      setMfrValues({ name: "", url: "", logo: null });
    } catch (err) {
      setQuickError(parseErrors(err));
    } finally {
      setQuickSubmitting(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const created = await apiCreateCategory(catValues);
      setCategories((prev) => [...prev, { id: created.id, label: created.name }]);
      setCategoryId(created.id);
      setShowNewCat(false);
      setCatValues({ name: "", description: "" });
    } catch (err) {
      setQuickError(parseErrors(err));
    } finally {
      setQuickSubmitting(false);
    }
  }

  async function handleCreateFile(e: React.FormEvent) {
    e.preventDefault();
    if (!fileValues.file) {
      setQuickError("A file is required.");
      return;
    }
    setQuickSubmitting(true);
    setQuickError(null);
    try {
      const fd = new FormData();
      fd.append("category", fileValues.category);
      fd.append("file", fileValues.file);
      const created = await apiCreateAssetFile(fd);
      setAllFiles((prev) => [...prev, created]);
      setSelectedFileIds((prev) => [...prev, created.id]);
      setShowNewFile(false);
      setFileValues({ file: null, category: "ETC" });
    } catch (err) {
      setQuickError(parseErrors(err));
    } finally {
      setQuickSubmitting(false);
    }
  }

  const typeAttrs = attributes.filter((a) => a.scope === "type" || a.scope === "both");

  return (
    <>
      <FormPageLayout
        title={isEdit ? "Edit Asset" : "New Asset"}
        onSubmit={handleSubmit}
        onDelete={isEdit ? handleDelete : undefined}
        submitting={submitting}
        error={formError}
      >
        {/* Identity */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type ID" required value={typeId} onChange={(e) => setTypeId(e.target.value)} placeholder="e.g. MFR-MODEL-001" />
          <FormField label="Model" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. XR-500" />
        </div>
        <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
        <FormField as="textarea" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormField label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />

        {/* Relationships */}
        <RelationshipField
          label="Manufacturer"
          options={manufacturers}
          value={manufacturerId}
          onChange={setManufacturerId}
          onNew={() => { setQuickError(null); setShowNewMfr(true); }}
        />
        <RelationshipField
          label="Category"
          options={categories}
          value={categoryId}
          onChange={setCategoryId}
          onNew={() => { setQuickError(null); setShowNewCat(true); }}
        />

        {/* Catalog Image */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catalog Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCatalogImgFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {isEdit && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Leave blank to keep existing image.</p>}
        </div>

        {/* Dimensions (stored in mm) */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dimensions (mm)</p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Height" type="number" value={overallHeight} onChange={(e) => setOverallHeight(e.target.value)} placeholder="mm" />
            <FormField label="Width" type="number" value={overallWidth} onChange={(e) => setOverallWidth(e.target.value)} placeholder="mm" />
            <FormField label="Depth" type="number" value={overallDepth} onChange={(e) => setOverallDepth(e.target.value)} placeholder="mm" />
          </div>
        </div>

        {/* Custom Fields */}
        {typeAttrs.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Custom Fields</p>
            <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              {typeAttrs.map((attr) => (
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

        {/* Associated Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Associated Files</p>
            <button
              type="button"
              onClick={() => { setQuickError(null); setShowNewFile(true); }}
              className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              + Upload New
            </button>
          </div>
          {allFiles.length === 0 ? (
            <p className="text-sm text-slate-400">No files in library.</p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {allFiles.map((f) => {
                const name = f.file.split("/").pop() ?? f.file;
                return (
                  <label key={f.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input
                      type="checkbox"
                      checked={selectedFileIds.includes(f.id)}
                      onChange={() => toggleFileId(f.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{name}</span>
                    <span className="text-xs text-slate-400">{f.category_display}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </FormPageLayout>

      {/* Quick-create: Manufacturer */}
      <QuickCreateModal open={showNewMfr} title="New Manufacturer" onClose={() => setShowNewMfr(false)}>
        {quickError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{quickError}</p>}
        <form onSubmit={handleCreateManufacturer} className="space-y-4">
          <ManufacturerForm
            values={mfrValues}
            onChange={(f, v) => setMfrValues((prev) => ({ ...prev, [f]: v }))}
            errors={{}}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewMfr(false)} className="px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={quickSubmitting} className="px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
              {quickSubmitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </QuickCreateModal>

      {/* Quick-create: Category */}
      <QuickCreateModal open={showNewCat} title="New Category" onClose={() => setShowNewCat(false)}>
        {quickError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{quickError}</p>}
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <CategoryForm
            values={catValues}
            onChange={(f, v) => setCatValues((prev) => ({ ...prev, [f]: v }))}
            errors={{}}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewCat(false)} className="px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={quickSubmitting} className="px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
              {quickSubmitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </QuickCreateModal>

      {/* Quick-create: File */}
      <QuickCreateModal open={showNewFile} title="Upload File" onClose={() => setShowNewFile(false)}>
        {quickError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{quickError}</p>}
        <form onSubmit={handleCreateFile} className="space-y-4">
          <AssetFileForm
            values={fileValues}
            onChange={(f, v) => setFileValues((prev) => ({ ...prev, [f]: v }))}
            errors={{}}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewFile(false)} className="px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={quickSubmitting} className="px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
              {quickSubmitting ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </QuickCreateModal>
    </>
  );
}
