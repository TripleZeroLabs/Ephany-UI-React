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

  // --- LOGIC: Unit Handling & Formatting Helpers ---

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

  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const roundToHundredths = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const getUnitForField = (rawKey: string): ReactNode | null => {
    const k = rawKey.toLowerCase();
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
    if (typeof value === "string") {
      const trimmed = value.trim();

      // 1. CHECK FOR URL
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline break-all"
          >
            {trimmed}
          </a>
        );
      }

      // 2. CHECK FOR NUMERIC STRING
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
    return null;
  };

  const formatValue = (value: any, keyForUnits?: string): ReactNode => {
    // If value is an object, check if it has a 'name' property (Common for nested Manufacturer/Category objects)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        if ("name" in value) return formatScalar(value.name, keyForUnits);
        if ("title" in value) return formatScalar(value.title, keyForUnits);
    }

    const scalar = formatScalar(value, keyForUnits);
    if (scalar !== null) return scalar;
    return (
      <pre className="whitespace-pre-wrap break-words text-xs text-slate-800 dark:text-slate-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  const KEY_COL = "w-[125px] min-w-[125px] max-w-[125px]";

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
        <table className="w-full table-fixed border-collapse text-xs">
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.key}-${i}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className={`${KEY_COL} py-2 pr-3 align-top font-medium text-slate-600 dark:text-slate-300`}>
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
      return <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700 dark:text-slate-200">{obj}</pre>;
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

  // --- RENDER: Image Component ---
  const renderImage = () => {
    const imgUrl = anyItem.catalog_img || anyItem.image;

    if (imgUrl) {
      return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <img
            src={imgUrl}
            alt="Asset Catalog"
            className="h-auto w-full object-contain"
            style={{ maxHeight: "300px", minHeight: "150px" }}
          />
        </div>
      );
    }

    // Placeholder
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <svg className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">No Image</span>
        </div>
      </div>
    );
  };

  // --- RENDER: Files (Simple List) ---
  const renderSimpleFiles = () => {
    const files = anyItem.files;
    if (!Array.isArray(files) || files.length === 0) return null;

    return (
      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Attachments
        </h4>
        <div className="space-y-2">
          {files.map((file: any, index: number) => {
             const href = file.file || file.url || file.href;
             const category = file.category_display || file.category || file.type || `File ${index + 1}`;

             if (!href) return null;

             const filename = file.filename || file.name || fileNameFromUrl(href);

             return (
               <div key={index} className="flex items-baseline gap-2 text-xs">
                 <span className="min-w-[80px] font-medium text-slate-600 dark:text-slate-300">
                   {category}:
                 </span>
                 <a
                   href={href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="break-all text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                 >
                   {filename}
                 </a>
               </div>
             );
          })}
        </div>
      </div>
    );
  };

  // --- RENDER: Main Layout ---

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className="relative flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl dark:bg-slate-900 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header (Fixed) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title || "Details"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">

          <div className="flex flex-col gap-8 md:flex-row">

            {/* 1. DATA COLUMN */}
            <div className="order-2 flex-1 md:order-1 space-y-8">

              {/* Core Attributes */}
              <div className="space-y-2">
                 <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Core Attributes
                  </div>
                <table className="w-full table-fixed border-collapse text-xs">
                  <tbody>
                    {entries
                      .filter(([key]) => {
                        const lowerKey = key.toLowerCase();

                        // Basic Exclusions
                        if (
                          lowerKey === "id" ||
                          lowerKey === "custom_fields" ||
                          lowerKey === "files" ||
                          lowerKey.includes("display_units") ||
                          lowerKey === "catalog_img" ||
                          lowerKey === "image"
                        ) return false;

                        // Smart Exclusion: Hide PK (ID) fields if a corresponding Name field exists
                        if ((lowerKey === "manufacturer" || lowerKey === "manufacturer_id") && (anyItem.manufacturer_name || anyItem.manufacturer_display)) return false;
                        if ((lowerKey === "category" || lowerKey === "category_id") && (anyItem.category_name || anyItem.category_display)) return false;

                        return true;
                      })
                      .map(([key, value]) => {
                        // Normalize Label: "manufacturer_name" -> "manufacturer" (so formatKey makes it "Manufacturer")
                        let labelKey = key;
                        if (key === "manufacturer_name") labelKey = "manufacturer";
                        if (key === "category_name") labelKey = "category";

                        return (
                          <tr key={key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                            <td className={`${KEY_COL} py-2 pr-3 align-top font-medium text-slate-600 dark:text-slate-300`}>
                              <span className="block break-words whitespace-normal">{formatKey(labelKey)}</span>
                            </td>
                            <td className="py-2 text-slate-900 dark:text-slate-100 break-words whitespace-normal">
                              {formatValue(value, labelKey)}
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>

              {/* Sub-Sections */}
              {"custom_fields" in anyItem && renderCustomFieldsSection(anyItem.custom_fields)}
            </div>

            {/* 2. IMAGE COLUMN */}
            <div className="order-1 w-full md:order-2 md:w-1/3 md:min-w-[250px]">
              <div className="sticky top-0">
                {renderImage()}
                {renderSimpleFiles()}
              </div>
            </div>

          </div>
        </div>

        {/* Footer (Fixed) */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50 rounded-b-lg">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}