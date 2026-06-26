import { type ColumnDef, flexRender, type Table } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { TablePaginationProps } from "@/components/admin/table-pagination";
import { TablePagination } from "@/components/admin/table-pagination";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { formatDateFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contact, ContactFieldKey } from "@/types/database";
import { EmptyState, LoadingSpinner } from "./table-states";

// 셀 렌더마다 find() O(n) 호출을 방지하기 위해 모듈 초기화 시 Map으로 변환
const FIELD_MAP = new Map(CONTACT_FIELDS.map((f) => [f.key, f]));

export const columns: ColumnDef<Contact>[] = [
	// 미읽음 표시 (항상 첫 번째)
	{
		id: "read_indicator",
		header: "",
		size: 20,
		enableSorting: false,
		cell: ({ row }) =>
			row.original.is_read ? null : (
				<span className="flex justify-center">
					<span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
				</span>
			),
	},
	// 접수일시 (항상 두 번째)
	{
		accessorKey: "created_at",
		header: "접수일시",
		cell: ({ getValue }) => formatDateFull(getValue<string>()),
	},
	// CONTACT_FIELDS 기반 동적 컬럼 — contact-fields.ts에서 관리
	...CONTACT_FIELDS.map(
		(field): ColumnDef<Contact> => ({
			accessorKey: field.key,
			header: field.label,
			cell: ({ getValue, row }) => {
				const value = String(getValue<string>() ?? "");
				// 이름: 읽음 여부에 따라 강조 처리
				if (field.key === "name") {
					return (
						<span
							className={cn(
								"font-medium",
								row.original.is_read ? "text-zinc-400" : "text-zinc-900",
							)}
						>
							{value}
						</span>
					);
				}
				// 긴 텍스트: 말줄임 처리
				if (field.isLong) {
					return (
						<span className="line-clamp-2 text-zinc-500" title={value}>
							{value}
						</span>
					);
				}
				return value;
			},
		}),
	),
];

type ContactsTableProps = {
	table: Table<Contact>;
	isLoading: boolean;
	hasFilter: boolean;
	onRowClick: (contact: Contact) => void;
	paginationProps: TablePaginationProps;
};

export const ContactsTable = ({
	table,
	isLoading,
	hasFilter,
	onRowClick,
	paginationProps,
}: ContactsTableProps) => {
	const rows = table.getRowModel().rows;

	return (
		<div className="hidden min-h-0 flex-1 flex-col lg:flex">
			{isLoading ? (
				<LoadingSpinner />
			) : rows.length === 0 ? (
				<EmptyState hasFilter={hasFilter} />
			) : (
				// min-h-0 필수: flex 자식의 기본 min-height: auto를 override해야 overflow-y-auto가 작동
				<div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]">
					<table className="w-full min-w-[640px] table-fixed text-sm">
						<colgroup>
							{[
								<col key="_read" style={{ width: 40 }} />,
								<col key="_date" style={{ width: 155 }} />,
								...CONTACT_FIELDS.map((f) => (
									<col key={f.key} style={f.size ? { width: f.size } : undefined} />
								)),
							]}
						</colgroup>
						<thead className="sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id} className="border-zinc-200 border-b bg-zinc-50">
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											onClick={header.column.getToggleSortingHandler()}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													header.column.getToggleSortingHandler()?.(e);
												}
											}}
											tabIndex={header.column.getCanSort() ? 0 : undefined}
											className={cn(
												"whitespace-nowrap px-4 py-2.5 text-left font-medium text-[11px] uppercase tracking-wider",
												header.column.getIsSorted() ? "text-zinc-900" : "text-zinc-500",
												header.column.getCanSort() &&
													"cursor-pointer select-none transition-colors hover:text-zinc-800",
											)}
										>
											<span className="flex items-center gap-1">
												{flexRender(header.column.columnDef.header, header.getContext())}
												{header.column.getCanSort() && (
													<span
														className={cn(
															"transition-colors",
															header.column.getIsSorted() ? "text-zinc-900" : "text-zinc-300",
														)}
													>
														{header.column.getIsSorted() === "asc" ? (
															<ChevronUp className="h-3 w-3" />
														) : header.column.getIsSorted() === "desc" ? (
															<ChevronDown className="h-3 w-3" />
														) : (
															<ArrowUpDown className="h-3 w-3" />
														)}
													</span>
												)}
											</span>
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-zinc-100">
							{rows.map((row) => (
								<tr
									key={row.id}
									tabIndex={0}
									onClick={() => onRowClick(row.original)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											onRowClick(row.original);
										}
									}}
									className={cn(
										"cursor-pointer transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-inset",
										row.original.is_read && "opacity-60",
									)}
								>
									{row.getVisibleCells().map((cell) => {
										const field = FIELD_MAP.get(cell.column.id as ContactFieldKey);
										return (
											<td
												key={cell.id}
												className={cn(
													"py-3 text-sm text-zinc-700",
													cell.column.id === "read_indicator" ? "pr-2 pl-4" : "px-4",
													// isLong 필드(문의 내용 등)만 줄바꿈 허용, 나머지는 한 줄 고정
													!field?.isLong && "whitespace-nowrap",
												)}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="shrink-0">
				<TablePagination {...paginationProps} />
			</div>
		</div>
	);
};
