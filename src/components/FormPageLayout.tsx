import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  submitting?: boolean;
  error?: string | null;
  children: ReactNode;
};

export function FormPageLayout({ title, onSubmit, onDelete, submitting, error, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        {children}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
