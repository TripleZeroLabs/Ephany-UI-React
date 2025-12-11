import type { ReactNode } from "react";
import "./DetailModal.css";

type DetailModalProps<T> = {
	open: boolean;
	item: T | null;
	onClose: () => void;
	title?: string;
};

export function DetailModal<T>({
	open,
	item,
	onClose,
	title,
}: DetailModalProps<T>) {
	if (!open || !item) return null;

	// Turn object into [key, value] rows
	const entries = Object.entries(item as any);

	const formatKey = (key: string) =>
		key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());

	const formatValue = (value: any): ReactNode => {
		if (value === null || value === undefined) {
			return <span className="text-slate-400">—</span>;
		}

		if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			return String(value);
		}

		// Objects / arrays → pretty JSON by default
		return (
			<pre className="whitespace-pre-wrap break-words text-xs text-slate-800 dark:text-slate-200">
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	};

	// For custom_fields & display_units: use the styled subtable
	const renderKeyValueTable = (raw: any) => {
		let obj = raw;

		// Handle JSON stored as a string (e.g. '{"length":"mm",...}')
		if (typeof obj === "string") {
			try {
				obj = JSON.parse(obj);
			} catch {
				// fall back to plain text
				return (
					<pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700 dark:text-slate-200">
						{obj}
					</pre>
				);
			}
		}

		if (!obj || typeof obj !== "object") {
			return <span className="text-slate-400">—</span>;
		}

		const rows = Object.entries(obj);
		if (rows.length === 0) {
			return <span className="text-slate-400">No data</span>;
		}

		return (
			<div className="detail-subtable-wrapper">
				<table className="detail-subtable">
					<tbody>
						{rows.map(([k, v]) => (
							<tr key={k} className="detail-subtable-row">
								<td className="detail-subtable-cell-key">
									{formatKey(k)}
								</td>
								<td className="detail-subtable-cell-value">
									{formatValue(v)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	// For files: simple list of links (no bullets)
	const renderFilesList = (files: any) => {
		if (!Array.isArray(files) || files.length === 0) {
			return <span className="text-slate-400">No files</span>;
		}

		return (
			<ul className="detail-files-list">
				{files.map((file: any, index: number) => {
					const href = file.file; // URL field from API
					const label =
						file.category_display ||
						file.name ||
						file.filename ||
						`File ${index + 1}`;

					if (!href) {
						// No usable URL; fall back to JSON
						return (
							<li key={file.id ?? index} className="detail-files-item">
								<pre className="whitespace-pre-wrap break-words text-[11px] text-slate-700 dark:text-slate-200">
									{JSON.stringify(file, null, 2)}
								</pre>
							</li>
						);
					}

					return (
						<li key={file.id ?? index} className="detail-files-item">
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="detail-subtable-link"
							>
								{label}
							</a>
						</li>
					);
				})}
			</ul>
		);
	};

	return (
		<div
			className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
			onClick={onClose}
		>
			<div
				className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
					<h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						{title || "Details"}
					</h2>
					<button
						onClick={onClose}
						className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
					>
						Close
					</button>
				</div>

				{/* Body: key/value table */}
				<div className="max-h-[70vh] overflow-y-auto px-4 py-3">
					<table className="w-full border-collapse text-xs">
						<tbody>
							{entries.map(([key, value]) => {
								const lowerKey = key.toLowerCase();
								const isCustomFields = lowerKey === "custom_fields";
								// Match "display_units", "display_units_display", etc.
								const isDisplayUnits = lowerKey.includes("display_units");
								const isFiles = lowerKey === "files";

								return (
									<tr
										key={key}
										className="border-b border-slate-100 last:border-0 dark:border-slate-800"
									>
										<td className="w-1/3 py-2 pr-3 align-top font-medium text-slate-600 dark:text-slate-300">
											{formatKey(key)}
										</td>
										<td className="w-2/3 py-2 text-slate-900 dark:text-slate-100 break-words">
											{isCustomFields || isDisplayUnits
												? renderKeyValueTable(value)
												: isFiles
												? renderFilesList(value)
												: formatValue(value)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
