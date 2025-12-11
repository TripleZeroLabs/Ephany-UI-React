// src/components/DataTable.tsx
import type { ReactNode } from "react";

export type ColumnDef<T> = {
	key: string;
	header: string;
	render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
	rows: T[];
	columns: ColumnDef<T>[];
	getRowKey: (row: T) => string | number;
	onRowClick?: (row: T) => void;   // NEW
};

export function DataTable<T>({
	rows,
	columns,
	getRowKey,
	onRowClick,
}: DataTableProps<T>) {
	return (
		<section className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
			<table className="min-w-full border-collapse text-sm">
				<thead className="bg-slate-50 dark:bg-slate-800">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								className="border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300"
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={getRowKey(row)}
							className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${
								onRowClick ? "cursor-pointer" : ""
							}`}
							onClick={onRowClick ? () => onRowClick(row) : undefined}
						>
							{columns.map((col) => (
								<td
									key={col.key}
									className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-100"
								>
									{col.render ? col.render(row) : (row as any)[col.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}
