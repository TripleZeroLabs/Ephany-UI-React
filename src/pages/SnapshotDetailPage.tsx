import { useEffect, useState, useMemo, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import {
  type Snapshot,
  type AssetInstance,
  type Project,
  fetchSnapshotDetail,
  fetchInstancesForSnapshot,
  fetchProjectDetail,
} from "../api/projects";
import { type Asset } from "../api/assets";
import { DetailModal } from "../components/DetailModal";
import { usePageTitle } from "../hooks/usePageTitle.ts";

// Strict types for sorting to satisfy ESLint
type FlatSortKey = keyof AssetInstance | "asset_name" | "type_id" | "manufacturer" | "merch_category";
type GroupSortKey = "name" | "manufacturer_name" | "type_id" | "quantity";

interface SortConfig {
  key: FlatSortKey;
  direction: "asc" | "desc";
}

interface AssetGroup {
  asset: Asset;
  items: AssetInstance[];
}

export function SnapshotDetailView() {
  usePageTitle("Project Snapshot");
  const { id } = useParams<{ id: string }>();

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [groupSortKey, setGroupSortKey] = useState<GroupSortKey>("quantity");
  const [flatSort, setFlatSort] = useState<SortConfig>({ key: "instance_id", direction: "asc" });

  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<number>>(new Set());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const snapData = await fetchSnapshotDetail(Number(id));
        setSnapshot(snapData);
        const [projData, instanceData] = await Promise.all([
          fetchProjectDetail(snapData.project),
          fetchInstancesForSnapshot(Number(id)),
        ]);
        setProject(projData);
        setInstances(instanceData);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // --- HELPER: Format Merchandise Category ---
  const formatCategory = (cat: unknown): string => {
    if (typeof cat !== "string") return "—";
    return cat.replace(/\s*\/\/\s*/g, ", ");
  };

  // --- LOGIC: Grouping and Sorting ---

  const groupedData = useMemo(() => {
    const groups: Record<number, AssetGroup> = {};
    instances.forEach((inst) => {
      const assetId = inst.asset_details.id;
      if (!groups[assetId]) {
        groups[assetId] = { asset: inst.asset_details, items: [] };
      }
      groups[assetId].items.push(inst);
    });

    return Object.values(groups).sort((a, b) => {
      if (groupSortKey === "quantity") {
        return b.items.length - a.items.length;
      }
      const valA = String(a.asset[groupSortKey] || "").toLowerCase();
      const valB = String(b.asset[groupSortKey] || "").toLowerCase();
      return valA.localeCompare(valB);
    });
  }, [instances, groupSortKey]);

  const sortedInstances = useMemo(() => {
    const items = [...instances];
    items.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (flatSort.key) {
        case "asset_name": valA = a.asset_details.name; valB = b.asset_details.name; break;
        case "type_id": valA = a.asset_details.type_id; valB = b.asset_details.type_id; break;
        case "manufacturer": valA = a.asset_details.manufacturer_name; valB = b.asset_details.manufacturer_name; break;
        case "merch_category":
          valA = formatCategory(a.custom_fields?.merch_category);
          valB = formatCategory(b.custom_fields?.merch_category);
          break;
        default:
          valA = (a[flatSort.key as keyof AssetInstance] as string | number) || "";
          valB = (b[flatSort.key as keyof AssetInstance] as string | number) || "";
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return flatSort.direction === "asc" ? -1 : 1;
      if (strA > strB) return flatSort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [instances, flatSort]);

  const handleFlatSort = (key: FlatSortKey) => {
    setFlatSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortArrow = (key: FlatSortKey) => {
    if (flatSort.key !== key) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1 text-indigo-600 font-bold">{flatSort.direction === "asc" ? "↑" : "↓"}</span>;
  };

  const toggleExpand = (assetId: number) => {
    setExpandedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  if (loading) return <div className="p-8 text-center font-medium">Loading Snapshot Manifest...</div>;
  if (!snapshot || !project) return <div className="p-8 text-center">Snapshot not found.</div>;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <nav className="mb-4 text-sm text-slate-500 flex items-center gap-2">
        <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
        <span>/</span> <span className="text-slate-400">{project.name}</span>
        <span>/</span> <span className="font-medium text-slate-900 dark:text-slate-100">{snapshot.name}</span>
      </nav>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{snapshot.name}</h1>
          <p className="text-slate-500 font-medium">State as of {new Date(snapshot.date).toLocaleDateString()}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {viewMode === "grouped" && (
            <div className="flex items-center gap-3 w-full">
              <label className="text-xs font-bold uppercase text-slate-500">Sort By</label>
              <select
                value={groupSortKey}
                onChange={(e) => setGroupSortKey(e.target.value as GroupSortKey)}
                className="block w-full sm:w-64 text-sm rounded-md border-slate-200 py-1.5 dark:bg-slate-800 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="quantity">Quantity (Highest First)</option>
                <option value="name">Asset Name</option>
                <option value="manufacturer_name">Manufacturer</option>
                <option value="type_id">Type ID</option>
              </select>
            </div>
          )}

          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-6 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "grouped" ? "bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-indigo-400" : "text-slate-500"}`}
            >
              Totals
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-6 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "flat" ? "bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-indigo-400" : "text-slate-500"}`}
            >
              Instances
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grouped" ? (
        <ol className="space-y-4">
          {groupedData.map((group) => (
            <Fragment key={group.asset.id}>
              <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700 transition-all">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleExpand(group.asset.id)}>
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
                      {group.asset.catalog_img ? (
                        <img src={group.asset.catalog_img} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-400 font-bold uppercase">No Img</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-tight">{group.asset.type_id}</div>
                      <div className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{group.asset.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{group.asset.manufacturer_name} • {group.asset.model}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right px-6 border-r border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Qty</div>
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{group.items.length}</div>
                    </div>
                    <button onClick={() => setSelectedAsset(group.asset)} className="rounded-md bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 transition-colors">
                      View Specs
                    </button>
                    <button
                      onClick={() => toggleExpand(group.asset.id)}
                      className={`p-2 transition-transform duration-200 ${expandedAssetIds.has(group.asset.id) ? "rotate-180 text-indigo-600" : "text-slate-400"}`}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {expandedAssetIds.has(group.asset.id) && (
                  <ul className="divide-y divide-slate-100 bg-slate-50/20 dark:bg-slate-900/50 dark:divide-slate-800">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-8 px-8 py-3.5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-[140px] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm" />
                          {item.instance_id || `INST-${item.id}`}
                        </span>

                        <div className="flex gap-8 text-xs font-medium">
                          <span className="text-slate-600 dark:text-slate-400">
                            <span className="uppercase text-[9px] font-bold text-slate-400 mr-2 tracking-widest">Location</span>
                            {item.location || "—"}
                          </span>

                          <span className="text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-8">
                            <span className="uppercase text-[9px] font-bold text-slate-400 mr-2 tracking-widest">Category</span>
                            {formatCategory(item.custom_fields?.merch_category)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:bg-slate-900 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th onClick={() => handleFlatSort("instance_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Tag {renderSortArrow("instance_id")}
                </th>
                <th onClick={() => handleFlatSort("type_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Type ID {renderSortArrow("type_id")}
                </th>
                <th onClick={() => handleFlatSort("asset_name")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Asset {renderSortArrow("asset_name")}
                </th>
                <th onClick={() => handleFlatSort("merch_category")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Category {renderSortArrow("merch_category")}
                </th>
                <th onClick={() => handleFlatSort("location")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Location {renderSortArrow("location")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:bg-slate-900 dark:divide-slate-700">
              {sortedInstances.map((inst) => (
                <tr
                  key={inst.id}
                  onClick={() => setSelectedAsset(inst.asset_details)}
                  className="cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{inst.instance_id || "—"}</td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{inst.asset_details.type_id}</td>
                  <td className="px-6 py-4">
                     <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{inst.asset_details.name}</div>
                     <div className="text-[10px] text-slate-500 font-medium">{inst.asset_details.manufacturer_name}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatCategory(inst.custom_fields?.merch_category)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{inst.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAsset && (
        <DetailModal
          open={!!selectedAsset}
          item={selectedAsset}
          title={selectedAsset.name}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}