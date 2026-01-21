import {useEffect, useState, useMemo, Fragment} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
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
import {type Asset} from "../api/assets";
import {DetailModal} from "../components/DetailModal";
import {usePageTitle} from "../hooks/usePageTitle.ts";

// --- TYPES ---
type FlatSortKey = keyof AssetInstance | "asset_name" | "type_id" | "manufacturer" | "merch_category";
type GroupSortKey = "name" | "manufacturer_name" | "type_id" | "quantity";
type TopRange = 5 | 10 | 25;

interface BOMItem {
    assetId: number;
    typeId: string;
    name: string;
    manufacturer: string;
    model: string;
    totalQuantity: number;
    isComponent: boolean;
    contributingParents: Set<string>;
    originalAsset: Asset;
}

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

const PALETTE_LIGHT = [
    "#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#4f46e5",
    "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#bfdbfe",
    "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8",
    "#1e40af", "#1e3a8a", "#172554", "#0f172a", "#020617"
];
const PALETTE_DARK = [
    "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5",
    "#4338ca", "#3730a3", "#312e81", "#1e1b4b", "#334155",
    "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0",
    "#f1f5f9", "#f8fafc", "#ffffff", "#e0e7ff", "#c7d2fe"
];

const CustomTooltip = ({active, payload}: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload;
        return (
            <div
                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl pointer-events-none transition-colors">
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{data.name}</p>
                <div className="flex flex-col gap-0.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-base">{data.value} LF</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">
                        {data.percentage}% of Merchandising
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

// Helper to safely extract manufacturer name
const getManufacturerName = (asset: Asset | null): string => {
    if (!asset) return "—";
    const mfrRaw = asset.manufacturer as unknown;
    if (mfrRaw && typeof mfrRaw === 'object' && 'name' in (mfrRaw as Record<string, unknown>)) {
        return (mfrRaw as { name: string }).name;
    }
    return asset.manufacturer_name || "—";
};

export function SnapshotDetailView() {
    usePageTitle("Project Snapshot");

    const {id, tab} = useParams<{ id: string; tab?: string }>();
    const navigate = useNavigate();

    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [instances, setInstances] = useState<AssetInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const activeTab = (tab === "bom") ? "bom" : "merch";

    // View Modes for each tab
    const [merchViewMode, setMerchViewMode] = useState<"flat" | "grouped">("grouped");
    const [bomViewMode, setBomViewMode] = useState<"aggregated" | "instances">("aggregated");

    const [groupSortKey] = useState<GroupSortKey>("quantity");
    const [flatSort, setFlatSort] = useState<SortConfig>({key: "instance_id", direction: "asc"});

    const [topCount, setTopCount] = useState<TopRange>(5);
    const [expandedAssetIds, setExpandedAssetIds] = useState<Set<number>>(new Set());
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ["class"]});
        checkTheme();
        return () => observer.disconnect();
    }, []);

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
        void loadData();
        return () => {
            isMounted = false;
        };
    }, [id]);

    const activePalette = isDarkMode ? PALETTE_DARK : PALETTE_LIGHT;

    const formatCategory = (cat: unknown): string => {
        if (typeof cat !== "string") return "—";
        return cat.replace(/\s*\/\/\s*/g, ", ");
    };

    const {donutData, totalMerchandisableLF} = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        let totalLF = 0;

        instances.forEach((inst) => {
            const widthMM = Number(inst.asset_details?.overall_width) || 0;
            const catString = (inst.custom_fields?.merch_category as string) || "";
            if (!catString.trim()) return;

            const categories = catString.split("//").map(s => s.trim()).filter(Boolean);
            const lfShare = (widthMM / categories.length) / 304.8;

            categories.forEach((cat) => {
                categoryMap[cat] = (categoryMap[cat] || 0) + lfShare;
                totalLF += lfShare;
            });
        });

        const sortedCategories = Object.keys(categoryMap)
            .map((cat): ChartItem => {
                const val = categoryMap[cat];
                return {
                    name: cat.replace(/\s*\/\/\s*/g, ", "),
                    value: Number(val.toFixed(2)),
                    percentage: totalLF > 0 ? Number(((val / totalLF) * 100).toFixed(1)) : 0,
                };
            })
            .sort((a, b) => b.value - a.value);

        const topSlice = sortedCategories.slice(0, topCount);
        const others = sortedCategories.slice(topCount);

        const donutSet = [...topSlice];
        if (others.length > 0) {
            const otherValue = others.reduce((sum, item) => sum + item.value, 0);
            donutSet.push({
                name: "Other Merchandising",
                value: Number(otherValue.toFixed(2)),
                percentage: totalLF > 0 ? Number(((otherValue / totalLF) * 100).toFixed(1)) : 0,
            });
        }

        return {donutData: donutSet, totalMerchandisableLF: totalLF.toFixed(1)};
    }, [instances, topCount]);

    // --- AGGREGATED BOM LOGIC ---
    const aggregatedBOM = useMemo(() => {
        const bomMap = new Map<number, BOMItem>();

        const addItem = (asset: Asset, qty: number, isComp: boolean, parentName?: string) => {
            if (!asset) return;

            const existing = bomMap.get(asset.id);
            if (existing) {
                existing.totalQuantity += qty;
                if (parentName) {
                    existing.contributingParents.add(parentName);
                }
            } else {
                const parents = new Set<string>();
                if (parentName) parents.add(parentName);

                bomMap.set(asset.id, {
                    assetId: asset.id,
                    typeId: asset.type_id || "—",
                    name: asset.name,
                    manufacturer: getManufacturerName(asset),
                    model: asset.model || "—",
                    totalQuantity: qty,
                    isComponent: isComp,
                    contributingParents: parents,
                    originalAsset: asset
                });
            }
        };

        instances.forEach(inst => {
            const parent = inst.asset_details;
            if (!parent) return;

            addItem(parent, 1, false);

            if (parent.components) {
                parent.components.forEach(comp => {
                    if (!comp.can_add_per_instance && comp.child_asset) {
                        addItem(comp.child_asset, comp.quantity_required, true, parent.name);
                    }
                });
            }

            if (inst.optional_components) {
                inst.optional_components.forEach(opt => {
                    const child = opt.asset_component?.child_asset;
                    if (child) {
                        addItem(child, opt.quantity, true, parent.name);
                    }
                });
            }
        });

        return Array.from(bomMap.values()).sort((a, b) => {
            if (a.isComponent === b.isComponent) {
                return a.typeId.localeCompare(b.typeId);
            }
            return a.isComponent ? 1 : -1;
        });
    }, [instances]);

    const handleFlatSort = (key: FlatSortKey) => {
        setFlatSort((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const renderSortArrow = (key: FlatSortKey) => {
        if (flatSort.key !== key) return <span className="ml-1 opacity-20">↕</span>;
        return <span
            className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold">{flatSort.direction === "asc" ? "↑" : "↓"}</span>;
    };

    const groupedData = useMemo(() => {
        const groups: Record<number, AssetGroup> = {};
        instances.forEach((inst) => {
            if (!inst.asset_details) return;
            const assetId = inst.asset_details.id;
            if (!groups[assetId]) groups[assetId] = {asset: inst.asset_details, items: []};
            groups[assetId].items.push(inst);
        });

        return Object.values(groups).sort((a, b) => {
            if (groupSortKey === "quantity") return b.items.length - a.items.length;
            const valA = String(a.asset[groupSortKey as keyof Asset] || "").toLowerCase();
            const valB = String(b.asset[groupSortKey as keyof Asset] || "").toLowerCase();
            return valA.localeCompare(valB);
        });
    }, [instances, groupSortKey]);

    const sortedInstances = useMemo(() => {
        const items = instances.filter((i): i is AssetInstance & { asset_details: Asset } => !!i.asset_details);
        items.sort((a, b) => {
            let valA: string | number = "";
            let valB: string | number = "";
            switch (flatSort.key) {
                case "asset_name":
                    valA = a.asset_details.name;
                    valB = b.asset_details.name;
                    break;
                case "type_id":
                    valA = a.asset_details.type_id;
                    valB = b.asset_details.type_id;
                    break;
                case "manufacturer":
                    valA = a.asset_details.manufacturer_name;
                    valB = b.asset_details.manufacturer_name;
                    break;
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

    if (loading) return <div className="p-12 text-center font-medium text-slate-400">Loading Merchandising...</div>;
    if (!snapshot || !project) return <div className="p-12 text-center text-slate-400">Snapshot not found.</div>;

    return (
        <div className="mx-auto max-w-7xl py-3 space-y-6">
            {/* Header */}
            <div
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <nav className="-mb-2.5 flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => navigate(`/snapshots/${id}/merch`)}
                        className={`${
                            activeTab === "merch"
                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        } whitespace-nowrap border-b-2 py-4 px-1 text-xs font-bold uppercase tracking-wide transition-colors`}
                    >
                        Merchandising
                    </button>
                    <button
                        onClick={() => navigate(`/snapshots/${id}/bom`)}
                        className={`${
                            activeTab === "bom"
                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        } whitespace-nowrap border-b-2 py-4 px-1 text-xs font-bold uppercase tracking-wide transition-colors`}
                    >
                        Bill of Materials
                    </button>
                </nav>

                <div className="text-right">
                    <nav
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-end gap-2 mb-1">
                        <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
                        <span>/</span> <span>{project.name}</span>
                    </nav>
                    <div className="flex items-baseline justify-end gap-3">
                        <h1 className="text-2xl text-slate-800 dark:text-white font-bold tracking-tight">{snapshot.name}</h1>
                        <span
                            className="text-xs font-medium text-slate-400 dark:text-slate-500">{new Date(snapshot.date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: MERCHANDISING */}
            {activeTab === "merch" && (
                <div className="space-y-6 animate-fadeIn">
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 min-h-[320px]">
                            <div className="w-full lg:w-1/3 h-[300px] relative">
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                    <span
                                        className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{totalMerchandisableLF}</span>
                                    <span
                                        className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total LF</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                                             paddingAngle={2} dataKey="value" stroke="none">
                                            {donutData.map((_, index) => (
                                                <Cell key={`cell-${index}`}
                                                      fill={activePalette[index % activePalette.length]}/>
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip/>}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div
                                className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                {donutData.map((item, index) => (
                                    <div key={item.name}
                                         className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-2.5 truncate">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                 style={{backgroundColor: activePalette[index % activePalette.length]}}/>
                                            <span
                                                className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase truncate">{item.name}</span>
                                        </div>
                                        <span
                                            className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 ml-2">{item.value} LF</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 gap-2">
                            {([5, 10, 25] as TopRange[]).map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setTopCount(val)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${topCount === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-400 hover:text-indigo-600'}`}
                                >
                                    Top {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ASSET SCHEDULE */}
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Asset Schedule</h2>
                            <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-800 p-1">
                                <button onClick={() => setMerchViewMode("grouped")}
                                        className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${merchViewMode === "grouped" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}>By
                                    Type
                                </button>
                                <button onClick={() => setMerchViewMode("flat")}
                                        className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${merchViewMode === "flat" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}>Instances
                                </button>
                            </div>
                        </div>

                        {merchViewMode === "grouped" ? (
                            <div className="space-y-4">
                                {groupedData.map((group) => (
                                    <div key={group.asset.id}
                                         className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-4 bg-slate-50/30 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div
                                                    className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-slate-200 dark:border-slate-700">
                                                    {group.asset.catalog_img ? <img src={group.asset.catalog_img}
                                                                                    className="h-full w-full object-contain"
                                                                                    alt=""/> : <div
                                                        className="h-full flex items-center justify-center text-xs text-slate-300 font-bold uppercase font-mono">IMG</div>}
                                                </div>
                                                <div>
                                                    <div
                                                        className="text-xs font-mono text-indigo-500 font-bold">{group.asset.type_id}</div>
                                                    <div
                                                        className="font-bold text-slate-900 dark:text-white">{group.asset.name}</div>
                                                    <div
                                                        className="text-sm text-slate-400">{getManufacturerName(group.asset)} • {group.asset.model}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="text-right px-4 border-r border-slate-200 dark:border-slate-800">
                                                    <div className="text-xs uppercase text-slate-400 font-bold">Qty
                                                    </div>
                                                    <div
                                                        className="text-xl font-black text-indigo-600">{group.items.length}</div>
                                                </div>
                                                <button onClick={() => setSelectedAsset(group.asset)}
                                                        className="rounded-md bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-slate-300 dark:ring-slate-700">Asset
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => setExpandedAssetIds(prev => {
                                                        const n = new Set(prev);
                                                        if (n.has(group.asset.id)) {
                                                            n.delete(group.asset.id);
                                                        } else {
                                                            n.add(group.asset.id);
                                                        }
                                                        return n;
                                                    })}
                                                    className={`p-2 transition-transform ${expandedAssetIds.has(group.asset.id) ? "rotate-180 text-indigo-600" : "text-slate-300"}`}
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>
                                        {expandedAssetIds.has(group.asset.id) && (
                                            <div
                                                className="bg-slate-50/20 divide-y divide-slate-100 dark:divide-slate-800">
                                                {group.items.map(item => (
                                                    <div key={item.id}
                                                         className="flex px-6 py-3.5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                                        <span
                                                            className="font-mono font-bold text-indigo-600 min-w-[140px] text-sm">{item.instance_id || `INST-${item.id}`}</span>
                                                        <span
                                                            className="text-sm font-bold text-slate-700 dark:text-slate-300 flex-1">{item.location || "General Area"}</span>
                                                        <span
                                                            className="text-sm text-slate-400">{formatCategory(item.custom_fields?.merch_category)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                                    <th onClick={() => handleFlatSort("instance_id")}
                                        className="px-6 py-4 text-left cursor-pointer">Tag {renderSortArrow("instance_id")}</th>
                                    <th onClick={() => handleFlatSort("type_id")}
                                        className="px-6 py-4 text-left cursor-pointer">Type
                                        ID {renderSortArrow("type_id")}</th>
                                    <th onClick={() => handleFlatSort("asset_name")}
                                        className="px-6 py-4 text-left cursor-pointer">Asset {renderSortArrow("asset_name")}</th>
                                    <th className="px-6 py-4 text-left">Location</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedInstances.map(inst => (
                                    <tr key={inst.id} onClick={() => setSelectedAsset(inst.asset_details)}
                                        className="cursor-pointer hover:bg-indigo-50/30">
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{inst.instance_id}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{inst.asset_details.type_id}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{inst.asset_details.name}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{inst.location || "—"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: BILL OF MATERIALS */}
            {activeTab === "bom" && (
                <div
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
                    <div
                        className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Parts List</h2>
                        <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-800 p-1">
                            <button onClick={() => setBomViewMode("aggregated")}
                                    className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${bomViewMode === "aggregated" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}>By
                                Type
                            </button>
                            <button onClick={() => setBomViewMode("instances")}
                                    className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${bomViewMode === "instances" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500"}`}>Instances
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            {bomViewMode === "aggregated" ? (
                                <>
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                        <th className="px-6 py-4 text-left w-16">Role</th>
                                        <th className="px-6 py-4 text-center w-24">Total Qty</th>
                                        <th className="px-6 py-4 text-left">Asset Name</th>
                                        <th className="px-6 py-4 text-left">Manufacturer</th>
                                        <th className="px-6 py-4 text-left">Model</th>
                                        <th className="px-6 py-4 text-left w-32">Type ID</th>
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {aggregatedBOM.length > 0 ? (
                                        aggregatedBOM.map((item) => (
                                            <tr
                                                key={`${item.assetId}-${item.typeId}`}
                                                onClick={() => setSelectedAsset(item.originalAsset)}
                                                className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-3">
                                                    <span
                                                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold cursor-help transition-colors
                                                        ${item.isComponent ? "bg-indigo-400" : "bg-indigo-600"}`}
                                                        title={item.isComponent ? `Component of: \n• ${Array.from(item.contributingParents).join("\n• ")}` : "Parent Asset"}
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click when just checking tooltip
                                                    >
                                                        {item.isComponent ? "C" : "P"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span
                                                        className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-700 dark:text-slate-300">
                                                        {item.totalQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div
                                                        className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {item.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                                                    {item.manufacturer}
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 dark:text-slate-400 font-mono">
                                                    {item.model}
                                                </td>
                                                <td className="px-6 py-3 font-mono dark:text-white font-bold text-indigo-600 group-hover:underline">
                                                    {item.typeId}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6}
                                                className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                                                No assets found in this snapshot.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                        <th className="px-6 py-4 text-left">Instance Tag</th>
                                        <th className="px-6 py-4 text-left">Type ID</th>
                                        <th className="px-6 py-4 text-center">Qty</th>
                                        <th className="px-6 py-4 text-left">Asset / Component</th>
                                        <th className="px-6 py-4 text-left">Manufacturer</th>
                                        <th className="px-6 py-4 text-left">Model</th>
                                    </tr>
                                    </thead>
                                    <tbody
                                        className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {sortedInstances.map((inst) => {
                                        const details = inst.asset_details;
                                        const required = details.components?.filter(c => !c.can_add_per_instance) ?? [];
                                        const optional = inst.optional_components ?? [];

                                        return (
                                            <Fragment key={inst.id}>
                                                {/* Parent Asset Row */}
                                                <tr
                                                    onClick={() => setSelectedAsset(details)}
                                                    className="text-sm bg-slate-50 dark:bg-slate-800/20 border-t-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors group"
                                                >
                                                    <td className="px-6 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{inst.instance_id}</td>
                                                    <td className="px-6 py-3 font-mono text-slate-500 dark:text-slate-400 font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:underline">
                                                        {details.type_id}
                                                    </td>
                                                    <td className="px-6 py-3 text-center font-bold text-slate-400 dark:text-slate-500">1</td>
                                                    <td className="px-6 py-3 font-bold text-slate-900 dark:text-white tracking-tight">{details.name}</td>
                                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{getManufacturerName(details)}</td>
                                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{details.model}</td>
                                                </tr>

                                                {/* Required Components */}
                                                {required.map(comp => {
                                                    const child = comp?.child_asset;
                                                    if (!child) return null;
                                                    return (
                                                        <tr
                                                            key={`req-${inst.id}-${comp.id}`}
                                                            onClick={() => setSelectedAsset(child)}
                                                            className="text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors opacity-90 cursor-pointer group text-slate-500 dark:text-slate-500"
                                                        >
                                                            <td className="text-xs px-6 py-2 font-mono pl-10">
                                                                ↳ REQUIRED
                                                            </td>
                                                            <td className="px-6 py-2 font-mono group-hover:text-indigo-600 group-hover:underline">
                                                                {child.type_id}
                                                            </td>
                                                            <td className="px-6 py-2 text-center font-bold">
                                                                {comp.quantity_required}
                                                            </td>
                                                            <td className="px-6 py-2 pl-10">{child.name}</td>
                                                            <td className="px-6 py-2">{getManufacturerName(child)}</td>
                                                            <td className="px-6 py-2">{child.model}</td>
                                                        </tr>
                                                    );
                                                })}

                                                {/* Optional Components */}
                                                {optional.map(opt => {
                                                    const child = opt?.asset_component?.child_asset;
                                                    if (!child) return null;
                                                    return (
                                                        <tr
                                                            key={`opt-${inst.id}-${opt.id}`}
                                                            onClick={() => setSelectedAsset(child)}
                                                            className="text-sm hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer group text-slate-500 dark:text-slate-500"
                                                        >
                                                            <td className="px-6 py-2 text-xs font-mono pl-10">
                                                                ↳ OPTIONAL
                                                            </td>
                                                            <td className="px-6 py-2 font-mono group-hover:underline">
                                                                {child.type_id}
                                                            </td>
                                                            <td className="px-6 py-2 text-center font-bold">
                                                                {opt.quantity}
                                                            </td>
                                                            <td className="px-6 py-2 pl-10">{child.name}</td>
                                                            <td className="px-6 py-2">{getManufacturerName(child)}</td>
                                                            <td className="px-6 py-2">{child.model}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        );
                                    })}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {selectedAsset && (
                <DetailModal open={!!selectedAsset} item={selectedAsset} title={selectedAsset.name}
                             onClose={() => setSelectedAsset(null)}/>
            )}
        </div>
    );
}