import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
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

// --- TYPES ---
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

interface ChartItem {
  name: string;
  value: number;
  percentage: number;
  [key: string]: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartItem;
  }>;
}

const DONUT_PALETTE = ["#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#6366f1"];

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl pointer-events-none">
        <p className="text-sm font-black text-slate-900 mb-1">{data.name}</p>
        <div className="flex flex-col gap-0.5">
          <span className="text-indigo-600 font-black text-base">{data.value} LF</span>
          <span className="text-slate-400 text-[10px] font-bold uppercase">{data.percentage}% Allocation</span>
        </div>
      </div>
    );
  }
  return null;
};



export function SnapshotDetailView() {
  usePageTitle("Project Snapshot");
  const { id } = useParams<{ id: string }>();

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [instances, setInstances] = useState<AssetInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [groupSortKey] = useState<GroupSortKey>("quantity");
  const [flatSort, setFlatSort] = useState<SortConfig>({ key: "instance_id", direction: "asc" });

  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<number>>(new Set());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadData = async () => {
      try {
        const snapData = await fetchSnapshotDetail(Number(id));
        if (!isMounted) return;
        setSnapshot(snapData);

        const [projData, instanceData] = await Promise.all([
          fetchProjectDetail(snapData.project),
          fetchInstancesForSnapshot(Number(id)),
        ]);

        if (!isMounted) return;
        setProject(projData);
        setInstances(instanceData);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData().catch((err) => {
      console.error("Effect error:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatCategory = (cat: unknown): string => {
    if (typeof cat !== "string") return "—";
    return cat.replace(/\s*\/\/\s*/g, ", ");
  };

  const tableData = useMemo((): ChartItem[] => {
    const categoryMap: Record<string, number> = {};
    let totalCategorizedLF = 0;

    instances.forEach((inst) => {
      const widthMM = Number(inst.asset_details?.overall_width) || 0;
      const catString = (inst.custom_fields?.merch_category as string) || "";
      if (!catString.trim()) return;

      const categories = catString.split("//").map(s => s.trim()).filter(Boolean);
      const lfShare = (widthMM / categories.length) / 304.8;

      categories.forEach((cat) => {
        categoryMap[cat] = (categoryMap[cat] || 0) + lfShare;
        totalCategorizedLF += lfShare;
      });
    });

    return Object.keys(categoryMap)
      .map((cat): ChartItem => {
        const val = categoryMap[cat];
        return {
          name: cat.replace(/\s*\/\/\s*/g, ", "),
          value: Number(val.toFixed(2)),
          percentage: totalCategorizedLF > 0 ? Number(((val / totalCategorizedLF) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
  }, [instances]);

  const donutData = useMemo(() => tableData.slice(0, 5), [tableData]);

  // const displayDonutTotalLF = useMemo(() => {
  //   const total = donutData.reduce((sum, item) => sum + item.value, 0);
  //   return total.toFixed(1);
  // }, [donutData]);

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
      if (groupSortKey === "quantity") return b.items.length - a.items.length;
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

  if (loading) return <div className="p-12 text-center font-medium text-slate-400">Loading Snapshot...</div>;
  if (!snapshot || !project) return <div className="p-12 text-center text-slate-400">Snapshot not found.</div>;

  return (
    <div className="mx-auto max-w-7xl py-3 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
            <span>/</span> <span>{project.name}</span>
          </nav>
          <h1 className="text-4xl text-slate-900 tracking-tight leading-none">{snapshot.name}</h1>
          <p className="text-slate-500 font-medium mt-2">{new Date(snapshot.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Merchandise Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <div className="lg:col-span-2 p-4 flex flex-col md:flex-row items-center h-[320px] gap-6">
            <div className="flex-1 h-full relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                {/*<span className="text-3xl font-black text-slate-800 tracking-tight">{displayDonutTotalLF}</span>*/}
                {/*<span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Top 5 LF</span>*/}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DONUT_PALETTE[index % DONUT_PALETTE.length]}
                        className="outline-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full md:w-64 flex flex-col justify-center gap-1.5 pr-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Top 5 Categories</h3>
              {donutData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center bg-slate-50/50 rounded-lg px-3 py-1.5 border border-transparent hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_PALETTE[index % DONUT_PALETTE.length] }} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-500">{item.value} LF</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-slate-50/30">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Top 25 List</h3>
            </div>
            <div className="h-[273px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              <table className="min-w-full divide-y divide-slate-100">
                <tbody className="divide-y divide-slate-100 bg-transparent">
                  {tableData.map((data, i) => (
                    <tr key={i} className="hover:bg-white transition-colors">
                      <td className="px-6 py-2.5 text-xs font-bold text-slate-700 truncate max-w-[150px]">{data.name}</td>
                      <td className="px-6 py-2.5 text-[10px] text-right font-mono text-indigo-600 font-bold">{data.value} LF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Asset List</h2>
          <div className="flex rounded-lg bg-slate-200/50 p-1 shadow-inner">
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-5 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === "grouped" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              By Type
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-5 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === "flat" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              Instances
            </button>
          </div>
        </div>

        <div className="p-6">
          {viewMode === "grouped" ? (
            <div className="space-y-4">
              {groupedData.map((group) => (
                <div key={group.asset.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-slate-50/30">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-white">
                        {group.asset.catalog_img ? <img src={group.asset.catalog_img} className="h-full w-full object-contain" alt="" /> : <div className="h-full flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase font-mono">IMG</div>}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-indigo-500 font-bold uppercase tracking-tight">{group.asset.type_id}</div>
                        <div className="font-bold text-slate-900 text-base leading-tight">{group.asset.name}</div>
                        <div className="text-[12px] text-slate-400 font-normal uppercase leading-none mt-1">{group.asset.manufacturer_name} • {group.asset.model}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right px-4 border-r border-slate-200">
                        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1 leading-none">Qty</div>
                        <div className="text-xl font-black text-indigo-600 leading-none">{group.items.length}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(group.asset);
                        }}
                        className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        Asset Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const idVal = group.asset.id;
                          setExpandedAssetIds((p) => {
                            const next = new Set(p);
                            if (next.has(idVal)) { next.delete(idVal); } else { next.add(idVal); }
                            return next;
                          });
                        }}
                        className={`p-2 transition-transform ${expandedAssetIds.has(group.asset.id) ? "rotate-180 text-indigo-600" : "text-slate-300"}`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {expandedAssetIds.has(group.asset.id) && (
                    <div className="bg-slate-50/20 divide-y divide-slate-100">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row px-6 py-3.5 hover:bg-white transition-colors gap-y-2">
                          <span className="font-mono font-bold text-indigo-600 min-w-[140px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm" />
                            {item.instance_id || `INST-${item.id}`}
                          </span>
                          <div className="flex flex-1 gap-x-12">
                            <div className="flex flex-col text-left">
                                <span className="text-[12px] font-bold text-slate-300 uppercase leading-none mb-1 tracking-tighter">Location</span>
                                <span className="text-[14px] font-bold text-slate-700 leading-none">{item.location || "—"}</span>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[12px] font-bold text-slate-300 uppercase leading-none mb-1 tracking-tighter">Category</span>
                                <span className="text-[14px] font-bold text-slate-700 leading-none">{formatCategory(item.custom_fields?.merch_category)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-x-auto shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    <th onClick={() => handleFlatSort("instance_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors">Tag {renderSortArrow("instance_id")}</th>
                    <th onClick={() => handleFlatSort("type_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors">Type ID {renderSortArrow("type_id")}</th>
                    <th onClick={() => handleFlatSort("asset_name")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors">Asset {renderSortArrow("asset_name")}</th>
                    <th onClick={() => handleFlatSort("merch_category")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors">Category {renderSortArrow("merch_category")}</th>
                    <th className="px-6 py-4 text-left text-slate-400">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedInstances.map((inst) => (
                    <tr
                      key={inst.id}
                      onClick={() => {
                        setSelectedAsset(inst.asset_details);
                      }}
                      className="cursor-pointer hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{inst.instance_id}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{inst.asset_details.type_id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 leading-none mb-1">{inst.asset_details.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{inst.asset_details.manufacturer_name}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{formatCategory(inst.custom_fields?.merch_category)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{inst.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedAsset && (
        <DetailModal
          open={!!selectedAsset}
          item={selectedAsset}
          title={selectedAsset.name}
          onClose={() => {
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}