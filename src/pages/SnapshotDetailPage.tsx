import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  type Snapshot,
  type AssetInstance,
  fetchSnapshotDetail,
  fetchInstancesForSnapshot,
  fetchProjectDetail
} from "../api/projects";
import { type Project } from "../api/projects";
import { DetailModal } from "../components/DetailModal";
import {usePageTitle} from "../hooks/usePageTitle.ts";

export function SnapshotDetailView() {
  usePageTitle("Project Snapshot");
  const { id } = useParams<{ id: string }>();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FIX: Store the full selected instance object instead of just the ID ---
  const [selectedInstance, setSelectedInstance] = useState<AssetInstance | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const snapData = await fetchSnapshotDetail(Number(id));
        setSnapshot(snapData);

        const [projData, instanceData] = await Promise.all([
          fetchProjectDetail(snapData.project),
          fetchInstancesForSnapshot(Number(id))
        ]);

        setProject(projData);
        setInstances(instanceData);
      } catch (err) {
        console.error("Failed to load snapshot details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading Snapshot Data...</div>;
  if (!snapshot || !project) return <div className="p-8 text-center">Snapshot not found.</div>;

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* 1) Breadcrumbs */}
      <nav className="mb-4 text-sm text-slate-500 flex items-center gap-2">
        <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-400">{project.name}</span>
        <span>/</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{snapshot.name}</span>
      </nav>

      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{snapshot.name}</h1>
          <p className="text-slate-500">
            State of assets on {new Date(snapshot.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Asset Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Manufacturer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
            {instances.map((instance) => (
              <tr
                key={instance.id}
                onClick={() => setSelectedInstance(instance)}
                className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group"
              >
                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {instance.asset_details.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  {instance.asset_details.manufacturer_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  {instance.location || (
                    <span className="text-slate-300 dark:text-slate-700 italic">Not set</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                  {instance.asset_details.model}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3) Updated DetailModal logic:
         We pass the 'asset_details' part of the instance so the modal
         renders the library technical specs.
      */}
      {selectedInstance && (
        <DetailModal
          open={!!selectedInstance}
          item={selectedInstance.asset_details}
          title={selectedInstance.asset_details.name}
          onClose={() => setSelectedInstance(null)}
        />
      )}
    </div>
  );
}