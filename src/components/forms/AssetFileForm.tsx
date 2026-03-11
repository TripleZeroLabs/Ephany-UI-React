import { FormField } from "../FormField";

export type AssetFileFormValues = {
  file: File | null;
  category: string;
};

type Props = {
  values: AssetFileFormValues;
  onChange: (field: keyof AssetFileFormValues, value: string | File | null) => void;
  errors: Record<string, string>;
  isEdit?: boolean;
};

export function AssetFileForm({ values, onChange, errors, isEdit }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          File{!isEdit && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="file"
          onChange={(e) => onChange("file", e.target.files?.[0] ?? null)}
          required={!isEdit}
          className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {isEdit && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Leave blank to keep the existing file.
          </p>
        )}
        {errors.file && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.file}</p>}
      </div>
      <FormField
        as="select"
        label="Category"
        required
        value={values.category}
        onChange={(e) => onChange("category", e.target.value)}
        error={errors.category}
      >
        <option value="PDS">Cut Sheet</option>
        <option value="DWG">CAD File</option>
        <option value="RFA">Revit Family</option>
        <option value="ETC">Other</option>
      </FormField>
    </div>
  );
}
