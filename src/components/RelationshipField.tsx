type Option = { id: number; label: string };

type RelationshipFieldProps = {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (id: number | null) => void;
  onNew?: () => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
};

export function RelationshipField({
  label,
  options,
  value,
  onChange,
  onNew,
  required,
  placeholder = "— Select —",
  error,
}: RelationshipFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          required={required}
          className="flex-1 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="shrink-0 px-3 py-2 text-sm font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors"
          >
            + New
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
