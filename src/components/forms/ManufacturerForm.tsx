import { FormField } from "../FormField";

export type ManufacturerFormValues = {
  name: string;
  url: string;
  logo: File | null;
};

type Props = {
  values: ManufacturerFormValues;
  onChange: (field: keyof ManufacturerFormValues, value: string | File | null) => void;
  errors: Record<string, string>;
};

export function ManufacturerForm({ values, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        label="Name"
        required
        value={values.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
        placeholder="e.g. Acme Corp"
      />
      <FormField
        label="Website URL"
        type="url"
        value={values.url}
        onChange={(e) => onChange("url", e.target.value)}
        error={errors.url}
        placeholder="https://example.com"
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Logo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange("logo", e.target.files?.[0] ?? null)}
          className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {errors.logo && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.logo}</p>}
      </div>
    </div>
  );
}
