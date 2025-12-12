import type { ReactNode } from "react";
import "./DetailModal.css";

type DetailModalProps<T> = {
  open: boolean;
  item: T | null;
  onClose: () => void;
  title?: string;
};

export function DetailModal<T>({ open, item, onClose, title }: DetailModalProps<T>) {
  if (!open || !item) return null;

  const anyItem = item as any;
  const entries = Object.entries(anyItem);

  // Pull display units once, hide it from rendering, and use it to suffix values.
  // Expected shape: { length: "mm", area: "m2", volume: "m3", mass: "kg" }
  const displayUnitsRaw =
    anyItem?._display_units ??
    anyItem?.display_units ??
    anyItem?._display_units_display ??
    anyItem?.display_units_display;

  const normalizeObjectLike = (raw: any): any => {
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  };

  const displayUnits = normalizeObjectLike(displayUnitsRaw);
  const unitMap: Record<string, string> =
    displayUnits && typeof displayUnits === "object" && !Array.isArray(displayUnits)
      ? (displayUnits as Record<string, string>)
      : {};

  // Helpers
  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const roundToHundredths = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // Map field name → unit abbreviation (extend as needed)
  const getUnitForField = (rawKey: string): string | null => {
    const k = rawKey.toLowerCase();

    // Your Asset shape shows overall_* dimensions. Treat these as "length".
    if (k.includes("height") || k.includes("width") || k.includes("depth")) {
      return unitMap.length ?? null;
    }

    if (k.includes("area")) return unitMap.area ?? null;
    if (k.includes("volume")) return unitMap.volume ?? null;
    if (k.includes("mass") || k.includes("weight")) return unitMap.mass ?? null;

    return null;
  };

  const formatScalar = (value: any, keyForUnits?: string): ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400">—</span>;
    }

    // Numbers: round to hundredths
    if (typeof value === "number") {
      const rounded = roundToHundredths(value);
      const unit = keyForUnits ? getUnitForField(keyForUnits) : null;
      return (
        <span className="break-words whitespace-normal">
          {unit ? `${rounded}${unit}` : String(rounded)}
        </span>
      );
    }

    if (typeof value === "boolean") {
      return <span className="break-words whitespace-normal">{String(value)}</span>;
    }

    // Strings: wrap, and if they are numeric strings, round too
    if (typeof value === "string") {
      const trimmed = value.trim();
      const numeric = trimmed !== "" && !Number.isNaN(Number(trimmed));
      if (numeric) {
        const rounded = roundToHundredths(Number(trimmed));
        const unit = keyForUnits ? getUnitForField(keyForUnits) : null;
        return (
          <span className="break-words whitespace-normal">
            {unit ? `${rounded}${unit}` : String(rounded)}
          </span>
        );
      }

      return <span className="break-words whitespace-normal">{value}</span>;
    }

    return null; // fall back handled by formatValue
  };

  const formatValue = (value: any, keyForUnits?: string): ReactNode => {
    const scalar = formatScalar(value, keyForUnits);
    if (scalar !== null) return scalar;

    // Objects / arrays → pretty JSON, but ensure wrap
    return (
      <pre className="whitespace-pre-wrap break-words text-xs text-slate-800 dark:text-slate-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  // Consistent key column width across all tables
  const KEY_COL = "w-[125px] min-w-[125px] max-w-[125px]";

  // Renders a "section" with a heading and key/value rows that match the main table styling
  const renderSection = (
    heading: string,
    rows: Array<{ key: string; value: ReactNode }>,
    emptyText: string = "No data"
  ) => {
    if (!rows || rows.length === 0) {
      return <span className="text-slate-400">{emptyText}</span>;
    }

    return (
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {heading}
        </div>

        {/* table-fixed + explicit key column width prevents column drift */}
        <table className="w-full table-fixed border-collapse text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td
                  className={`${KEY_COL} py-2 pr-3 align-top font-medium text-slate-600 dark:text-slate-300`}
                >
                  {/* Wrap long keys instead of expanding width */}
                  <span className="block break-words whitespace-normal">{formatKey(r.key)}</span>
                </td>
                <td className="py-2 text-slate-900 dark:text-slate-100 break-words whitespace-normal">
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCustomFieldsSection = (raw: any) => {
    const obj = normalizeObjectLike(raw);

    if (!obj) return <span className="text-slate-400">—</span>;
    if (typeof obj === "string") {
      return (
        <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700 dark:text-slate-200">
          {obj}
        </pre>
      );
    }
    if (typeof obj !== "object") return <span className="text-slate-400">—</span>;

    const rows = Object.entries(obj).map(([k, v]) => ({
      key: k,
      value: formatValue(v, k),
    }));

    return renderSection("Custom Fields", rows, "No custom fields");
  };

  const fileNameFromUrl = (url: string) => {
    try {
      const u = new URL(url, window.location.origin);
      const last = u.pathname.split("/").filter(Boolean).pop();
      return last ?? url;
    } catch {
      const clean = url.split("?")[0].split("#")[0];
      const last = clean.split("/").filter(Boolean).pop();
      return last ?? url;
    }
  };

  const renderFilesSection = (files: any) => {
    if (!Array.isArray(files) || files.length === 0) {
      return <span className="text-slate-400">No files</span>;
    }

    const rows = files.map((file: any, index: number) => {
      const href: string | undefined = file.file || file.url || file.href;
      const category: string =
        file.category_display ||
        file.category ||
        file.type_display ||
        file.type ||
        `File ${index + 1}`;

      if (!href) {
        return {
          key: category,
          value: (
            <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700 dark:text-slate-200">
              {JSON.stringify(file, null, 2)}
            </pre>
          ),
        };
      }

      const filename = file.filename || file.name || fileNameFromUrl(href);

      return {
        key: category,
        value: (
          <a href={href} target="_blank" rel="noopener noreferrer" className="detail-subtable-link">
            <span className="break-words whitespace-normal">{filename}</span>
          </a>
        ),
      };
    });

    return renderSection("Files", rows, "No files");
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title || "Details"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {/* table-fixed + wrapping to prevent horizontal scroll */}
          <table className="w-full table-fixed border-collapse text-xs">
            <tbody>
              {entries.map(([key, value]) => {
                const lowerKey = key.toLowerCase();

                const isId = lowerKey === "id";
                const isCustomFields = lowerKey === "custom_fields";
                const isFiles = lowerKey === "files";
                const isDisplayUnits = lowerKey.includes("display_units");

                // Skip non-display fields
                if (isId || isCustomFields || isFiles || isDisplayUnits) return null;

                return (
                  <tr
                    key={key}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td
                      className={`${KEY_COL} py-2 pr-3 align-top font-medium text-slate-600 dark:text-slate-300`}
                    >
                      <span className="block break-words whitespace-normal">{formatKey(key)}</span>
                    </td>
                    <td className="py-2 text-slate-900 dark:text-slate-100 break-words whitespace-normal">
                      {formatValue(value, key)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Sections */}
          <div className="mt-4 space-y-5">
            {"custom_fields" in anyItem && renderCustomFieldsSection(anyItem.custom_fields)}
            {Array.isArray(anyItem.files) && anyItem.files.length > 0 && (renderFilesSection(anyItem.files))}
          </div>
        </div>
      </div>
    </div>
  );
}
