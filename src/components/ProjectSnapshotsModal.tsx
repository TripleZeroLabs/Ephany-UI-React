import { useEffect, useState } from "react";
import { type Project, type Snapshot, fetchSnapshotsForProject } from "../api/projects";

type ProjectSnapshotsModalProps = {
  project: Project | null;
  onClose: () => void;
};

export function ProjectSnapshotsModal({ project, onClose }: ProjectSnapshotsModalProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project) return;

    let mounted = true;
    setLoading(true);
    setSnapshots([]);

    fetchSnapshotsForProject(project.id)
      .then((data) => {
        if (mounted) setSnapshots(data);
      })
      .catch((err) => {
        console.error("Failed to load snapshots:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [project]);

  if (!project) return null;

  return (
    // z-[100] ensures this is on top of everything else (sidebars, headers, etc.)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

      {/* Backdrop: Semi-transparent dark background */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative flex w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl dark:bg-slate-900 max-h-[85vh]">

        {/* Header (Fixed) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {project.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Job ID: {project.job_id}
            </p>
          </div>

          {/* Top Right 'X' Close Button */}
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <svg className="mb-3 h-8 w-8 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Loading snapshots...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-md border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 text-slate-500">
              <p>No snapshots found for this project.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                      Snapshot Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">
                      Date Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {snapshots.map((snap) => (
                    <tr
                      key={snap.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                        {snap.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {new Date(snap.date).toLocaleDateString()} at {new Date(snap.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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