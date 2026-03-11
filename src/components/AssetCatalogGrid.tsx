import type { Asset } from "../api/assets";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/** Resolve a catalog_img value to an absolute URL, or null if absent. */
function resolveImgUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // strip leading slash duplication
  return `${API_BASE_URL.replace(/\/api$/, "")}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

interface AssetCatalogGridProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
}

export function AssetCatalogGrid({ assets, onSelect, onEdit }: AssetCatalogGridProps) {
  if (assets.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
        No assets found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {assets.map((asset) => {
        const imgUrl = resolveImgUrl(asset.catalog_img);
        return (
          <div
            key={asset.id}
            onClick={() => onSelect(asset)}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            {/* Thumbnail */}
            <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={asset.name}
                  className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col gap-0.5 p-2">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {asset.type_id || <span className="text-slate-400">—</span>}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {asset.manufacturer_name || <span className="text-slate-300 dark:text-slate-600">—</span>}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {asset.model || ""}
              </p>
            </div>

            {/* Edit button — visible on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(asset); }}
              className="absolute right-1.5 top-1.5 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 opacity-0 shadow-sm ring-1 ring-slate-200 transition-opacity group-hover:opacity-100 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600"
            >
              Edit
            </button>
          </div>
        );
      })}
    </div>
  );
}
