import type {ChangeEvent, ReactNode} from "react";

export type SelectFilterConfig = {
	id: string;
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
};

type FiltersPanelProps = {
	searchValue: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	selectFilters?: SelectFilterConfig[];
	summary?: ReactNode;
};

export function FiltersPanel({
	searchValue,
	onSearchChange,
	searchPlaceholder = "Search…",
	selectFilters = [],
	summary,
}: FiltersPanelProps) {
	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		onSearchChange(e.target.value);
	};

	return (
		<section className="filters rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
			{/* Top row: search + select filters */}
			<div className="flex flex-wrap items-end gap-3">
				{/* Search input */}
				<div className="flex-1 min-w-[220px]">
					<label
						htmlFor="global-search"
						className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
					>
						Search (any field)
					</label>
					<input
						id="global-search"
						type="text"
						value={searchValue}
						onChange={handleSearchChange}
						placeholder={searchPlaceholder}
						className="
							w-full rounded-md
							border border-slate-300 dark:border-slate-600
							bg-white dark:bg-slate-900
							px-3 py-2 text-sm
							text-slate-900 dark:text-slate-100
							shadow-sm
							placeholder:text-slate-400 dark:placeholder:text-slate-500
							focus:border-slate-500 dark:focus:border-slate-400
							focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10
						"
					/>
				</div>

				{/* Extra select filters */}
				{selectFilters.map((filter) => (
					<div
						key={filter.id}
						className="flex-none min-w-[180px] sm:min-w-[220px]"
					>
						<label
							htmlFor={filter.id}
							className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
						>
							{filter.label}
						</label>
						<select
							id={filter.id}
							value={filter.value}
							onChange={(e) => filter.onChange(e.target.value)}
							className="
								w-full rounded-md
								border border-slate-300 dark:border-slate-600
								bg-white dark:bg-slate-900
								px-3 py-2 text-sm
								text-slate-900 dark:text-slate-100
								shadow-sm
								focus:border-slate-500 dark:focus:border-slate-400
								focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10
							"
						>
							<option value="">{`All`}</option>
							{filter.options.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				))}
			</div>

			{/* Summary row */}
			{summary && (
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{summary}
				</p>
			)}
		</section>
	);
}
