import type { Row } from "@tanstack/react-table";
import type { TablePaginationProps } from "@/components/admin/table-pagination";
import { TablePagination } from "@/components/admin/table-pagination";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/database";
import { EmptyState, LoadingSpinner } from "./table-states";

// 이름 제외 단순 필드 (email, phone 등) — 카드 서브라인으로 표시
const subtitleFields = CONTACT_FIELDS.filter((f) => !f.isLong && f.key !== "name");
// 긴 텍스트 필드 (message 등) — 카드 하단 본문으로 표시
const longField = CONTACT_FIELDS.find((f) => f.isLong);

type ContactsMobileListProps = {
	rows: Row<Contact>[];
	isLoading: boolean;
	hasFilter: boolean;
	onRowClick: (contact: Contact) => void;
	paginationProps: TablePaginationProps;
};

export const ContactsMobileList = ({
	rows,
	isLoading,
	hasFilter,
	onRowClick,
	paginationProps,
}: ContactsMobileListProps) => {
	return (
		<div className="flex min-h-0 flex-1 flex-col lg:hidden">
			{isLoading ? (
				<LoadingSpinner />
			) : rows.length === 0 ? (
				<EmptyState hasFilter={hasFilter} />
			) : (
				<div className="flex-1 divide-y divide-zinc-100 overflow-y-auto [scrollbar-gutter:stable]">
					{rows.map((row) => {
						const c = row.original;
						return (
							<button
								key={row.id}
								type="button"
								onClick={() => onRowClick(c)}
								className={cn(
									"w-full p-4 text-left transition-colors hover:bg-zinc-50",
									c.is_read && "opacity-60",
								)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2">
										{!c.is_read && (
											<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
										)}
										<span
											className={cn(
												"font-semibold text-sm",
												c.is_read ? "text-zinc-500" : "text-zinc-900",
											)}
										>
											{c.name}
										</span>
									</div>
									<span className="shrink-0 rounded border border-zinc-200 px-1.5 py-0.5 font-medium text-[10px] text-zinc-500">
										{formatDateCompact(c.created_at)}
									</span>
								</div>

								{/* 서브라인 필드 (phone, email 등) */}
								{subtitleFields.map((f) => {
									const val = String(c[f.key as keyof Contact] ?? "");
									return val ? (
										<p key={f.key} className="mt-0.5 text-xs text-zinc-500">
											{val}
										</p>
									) : null;
								})}

								{/* 본문 필드 (message 등) */}
								{longField && (
									<p className="mt-2 line-clamp-3 border-zinc-100 border-t pt-2 text-sm text-zinc-600">
										{String(c[longField.key as keyof Contact] ?? "")}
									</p>
								)}
							</button>
						);
					})}
				</div>
			)}

			{!isLoading && (
				<div className="shrink-0">
					<TablePagination {...paginationProps} />
				</div>
			)}
		</div>
	);
};
