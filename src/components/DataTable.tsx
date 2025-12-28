import type { ReactNode } from "react";

/**
 * Configuration for a single table column.
 * Using 'extends object' allows flexible interface support.
 */
export type ColumnDef<T extends object> = {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (row: T) => ReactNode;
};

/**
 * Component props for the DataTable.
 */
interface DataTableProps<T extends object> {
    rows: T[];
    columns: ColumnDef<T>[];
    getRowKey: (row: T) => string | number;
    onRowClick?: (row: T) => void;

    // Sorting Props
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    onSort?: (key: string) => void;
}

export function DataTable<T extends object>({
    rows,
    columns,
    getRowKey,
    onRowClick,
    sortColumn,
    sortDirection,
    onSort,
}: DataTableProps<T>) {
    return (
       <section className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="min-w-full border-collapse text-sm">
             <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                   {columns.map((col) => {
                      const isActive = sortColumn === col.key;

                      return (
                         <th
                            key={col.key}
                            className={`border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors group ${
                               col.sortable ? "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700" : ""
                            }`}
                            onClick={() => col.sortable && onSort?.(col.key)}
                         >
                            <div className="flex items-center gap-1.5">
                               <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-300"}>
                                  {col.header}
                               </span>

                               {col.sortable && (
                                  <span className="inline-flex items-center justify-center w-4 h-4">
                                     {isActive ? (
                                        // Active State: Show only ONE arrow
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                           {sortDirection === "asc" ? "↑" : "↓"}
                                        </span>
                                     ) : (
                                        // Inactive State: Show neutral sort icon (only on hover or always faint)
                                        <span className="text-slate-300 dark:text-slate-600 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                           ↕
                                        </span>
                                     )}
                                  </span>
                               )}
                            </div>
                         </th>
                      );
                   })}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length > 0 ? (
                    rows.map((row) => (
                    <tr
                        key={getRowKey(row)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            onRowClick ? "cursor-pointer" : ""
                        }`}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                        {columns.map((col) => {
                            // Cast to Record<string, unknown> to satisfy no-explicit-any
                            const cellValue = (row as Record<string, unknown>)[col.key];

                            return (
                                <td
                                    key={col.key}
                                    className="whitespace-nowrap px-3 py-3 text-slate-700 dark:text-slate-300"
                                >
                                    {col.render ? col.render(row) : (cellValue as ReactNode)}
                                </td>
                            );
                        })}
                    </tr>
                    ))
                ) : (
                   <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 italic">
                         No records found.
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
       </section>
    );
}