import {useEffect, useState, useMemo} from "react";
import {useParams, Link} from "react-router-dom";
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

// Expanded palette for up to 25 items + 1 "Other"
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
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl pointer-events-none transition-colors">
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

export function SnapshotDetailView() {
    usePageTitle("Project Snapshot");
    const {id} = useParams<{ id: string }>();

    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [instances, setInstances] = useState<AssetInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
    const [groupSortKey] = useState<GroupSortKey>("quantity");
    const [flatSort, setFlatSort] = useState<SortConfig>({key: "instance_id", direction: "asc"});
    const [topCount, setTopCount] = useState<TopRange>(5);

    const [expandedAssetIds, setExpandedAssetIds] = useState<Set<number>>(new Set());
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
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
        loadData().catch(console.error);
        return () => { isMounted = false; };
    }, [id]);

    const activePalette = isDarkMode ? PALETTE_DARK : PALETTE_LIGHT;

    const formatCategory = (cat: unknown): string => {
        if (typeof cat !== "string") return "—";
        return cat.replace(/\s*\/\/\s*/g, ", ");
    };

    const { donutData, totalMerchandisableLF } = useMemo(() => {
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

        return {
            donutData: donutSet,
            totalMerchandisableLF: totalLF.toFixed(1)
        };
    }, [instances, topCount]);

    const handleFlatSort = (key: FlatSortKey) => {
        setFlatSort((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const renderSortArrow = (key: FlatSortKey) => {
        if (flatSort.key !== key) return <span className="ml-1 opacity-20">↕</span>;
        return <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold">{flatSort.direction === "asc" ? "↑" : "↓"}</span>;
    };

    const groupedData = useMemo(() => {
        const groups: Record<number, AssetGroup> = {};
        instances.forEach((inst) => {
            const assetId = inst.asset_details.id;
            if (!groups[assetId]) groups[assetId] = {asset: inst.asset_details, items: []};
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
            // FIX: Removed redundant initializers to resolve "Variable initializer is redundant" warnings
            let valA: string | number;
            let valB: string | number;
            switch (flatSort.key) {
                case "asset_name": valA = a.asset_details.name; valB = b.asset_details.name; break;
                case "type_id": valA = a.asset_details.type_id; valB = b.asset_details.type_id; break;
                case "merch_category": valA = formatCategory(a.custom_fields?.merch_category); valB = formatCategory(b.custom_fields?.merch_category); break;
                default: valA = (a[flatSort.key as keyof AssetInstance] as string | number) || ""; valB = (b[flatSort.key as keyof AssetInstance] as string | number) || "";
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div>
                    <nav className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
                        <span>/</span> <span>{project.name}</span>
                    </nav>
                    <h1 className="text-4xl text-slate-900 dark:text-white font-black tracking-tight leading-none">{snapshot.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">{new Date(snapshot.date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* MERCHANDISING DASHBOARD - Full Width Layout */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Merchandising Analysis</h2>

                    <div className="flex bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-lg shadow-inner">
                        {[5, 10, 25].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTopCount(range as TopRange)}
                                className={`px-4 py-1 text-xs font-bold uppercase transition-all rounded-md ${topCount === range ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Top {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 flex flex-col lg:flex-row items-center justify-center gap-12 min-h-[320px]">
                    {/* CHART AREA */}
                    <div className="w-full lg:w-1/3 h-[300px] relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                {totalMerchandisableLF}
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Total LF</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {donutData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === donutData.length - 1 && donutData[index].name === "Other Merchandising"
                                                ? (isDarkMode ? "#475569" : "#94a3b8")
                                                : activePalette[index % activePalette.length]
                                            }
                                            className="outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip/>} wrapperStyle={{zIndex: 50}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* DYNAMIC LEGEND AREA (Replaces Static Table) */}
                    <div className="w-full lg:w-2/3 flex flex-col justify-center bg-slate-50/30 dark:bg-slate-800/20 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Categories</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 pr-2">
                            {donutData.map((item, index) => (
                                <div key={item.name} className="flex justify-between items-center bg-white dark:bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors group">
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{
                                            backgroundColor: index === donutData.length - 1 && item.name === "Other Merchandising"
                                                ? (isDarkMode ? "#475569" : "#94a3b8")
                                                : activePalette[index % activePalette.length]
                                        }}/>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 ml-2">{item.value} LF</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* INVENTORY MANIFEST */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Inventory Manifest</h2>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-800 p-1 shadow-inner">
                        <button onClick={() => setViewMode("grouped")} className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === "grouped" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500"}`}>By Type</button>
                        <button onClick={() => setViewMode("flat")} className={`px-5 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${viewMode === "flat" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500"}`}>Instances</button>
                    </div>
                </div>

                <div className="p-6">
                    {viewMode === "grouped" ? (
                        <div className="space-y-4">
                            {groupedData.map((group) => (
                                <div key={group.asset.id} className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm">
                                    <div className="flex items-center justify-between p-4 bg-slate-50/30 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                {group.asset.catalog_img ? <img src={group.asset.catalog_img} className="h-full w-full object-contain" alt=""/> : <div className="h-full flex items-center justify-center text-xs text-slate-300 dark:text-slate-600 font-bold uppercase font-mono">IMG</div>}
                                            </div>
                                            <div>
                                                <div className="text-xs font-mono text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-tight">{group.asset.type_id}</div>
                                                <div className="font-bold text-slate-900 dark:text-white text-base leading-tight">{group.asset.name}</div>
                                                <div className="text-sm text-slate-400 dark:text-slate-500 font-normal uppercase leading-none mt-1">{group.asset.manufacturer_name} • {group.asset.model}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right px-4 border-r border-slate-200 dark:border-slate-800">
                                                <div className="text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-1 leading-none">Qty</div>
                                                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{group.items.length}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectedAsset(group.asset); }}
                                                className="rounded-md bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Asset Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const idVal = group.asset.id;
                                                    setExpandedAssetIds((p) => {
                                                        const next = new Set(p);
                                                        if (next.has(idVal)) next.delete(idVal); else next.add(idVal);
                                                        return next;
                                                    });
                                                }}
                                                className={`p-2 transition-transform ${expandedAssetIds.has(group.asset.id) ? "rotate-180 text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600"}`}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    </div>

                                    {expandedAssetIds.has(group.asset.id) && (
                                        <div className="bg-slate-50/20 dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-slate-800">
                                            {group.items.map((item) => (
                                                <div key={item.id} className="flex flex-col sm:flex-row px-6 py-3.5 hover:bg-white dark:hover:bg-slate-800 transition-colors gap-y-2">
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-[140px] flex items-center gap-2 text-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm"/>
                                                        {item.instance_id || `INST-${item.id}`}
                                                    </span>
                                                    <div className="flex flex-1 gap-x-12">
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase leading-none mb-1 tracking-tight">Location</span>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{item.location || "—"}</span>
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase leading-none mb-1 tracking-tight">Merchandising</span>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-none">{formatCategory(item.custom_fields?.merch_category)}</span>
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
                        <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                    <th onClick={() => handleFlatSort("instance_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Tag {renderSortArrow("instance_id")}</th>
                                    <th onClick={() => handleFlatSort("type_id")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Type ID {renderSortArrow("type_id")}</th>
                                    <th onClick={() => handleFlatSort("asset_name")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Asset {renderSortArrow("asset_name")}</th>
                                    <th onClick={() => handleFlatSort("merch_category")} className="px-6 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Category {renderSortArrow("merch_category")}</th>
                                    <th className="px-6 py-4 text-left text-slate-400 dark:text-slate-500">Location</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {sortedInstances.map((inst) => (
                                    <tr key={inst.id} onClick={() => setSelectedAsset(inst.asset_details)} className="cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{inst.instance_id}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">{inst.asset_details.type_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{inst.asset_details.name}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{inst.asset_details.manufacturer_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{formatCategory(inst.custom_fields?.merch_category)}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-600">{inst.location || "—"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedAsset && (
                <DetailModal open={!!selectedAsset} item={selectedAsset} title={selectedAsset.name} onClose={() => setSelectedAsset(null)} />
            )}
        </div>
    );
}