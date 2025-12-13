type Props = {
  visible: boolean;
  version?: string;
};

export function UpdateBanner({ visible, version }: Props) {
  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-amber-50 px-4 py-2 text-sm text-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="min-w-0">
          A new version is available{version ? ` (${version})` : ""}. Refresh to update.
        </div>
        <button
          className="shrink-0 rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
