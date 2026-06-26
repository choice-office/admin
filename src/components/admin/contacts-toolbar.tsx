import { Download, Search } from "lucide-react";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { exportContactsToExcel } from "@/lib/excel";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/database";

type ContactsToolbarProps = {
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	startDate: string;
	endDate: string;
	onRangeChange: (start: string, end: string) => void;
	exportRows: Contact[];
	hasFilter: boolean;
};

export const ContactsToolbar = ({
	globalFilter,
	onGlobalFilterChange,
	startDate,
	endDate,
	onRangeChange,
	exportRows,
	hasFilter,
}: ContactsToolbarProps) => {
	return (
		<div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
			{/* 기간 필터 */}
			<DateRangePicker startDate={startDate} endDate={endDate} onRangeChange={onRangeChange} />

			{/* 검색 + 엑셀 */}
			<div className="flex items-center gap-2 sm:contents">
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
					<input
						type="text"
						aria-label="문의 검색"
						placeholder="이름, 이메일, 내용 검색..."
						value={globalFilter}
						onChange={(e) => onGlobalFilterChange(e.target.value)}
						className={cn(
							"w-full rounded border border-zinc-200 bg-white py-1.5 pr-3 pl-8 text-sm text-zinc-700 outline-none",
							"transition-colors placeholder:text-zinc-400",
							"focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30",
						)}
					/>
				</div>

				<button
					type="button"
					aria-label={
						hasFilter ? "필터된 문의를 엑셀로 내보냅니다" : "전체 문의를 엑셀로 내보냅니다"
					}
					onClick={() => void exportContactsToExcel(exportRows)}
					disabled={exportRows.length === 0}
					title={hasFilter ? "필터된 문의를 엑셀로 내보냅니다" : "전체 문의를 엑셀로 내보냅니다"}
					className={cn(
						"flex shrink-0 items-center gap-1.5 rounded bg-zinc-900 px-3 py-1.5 font-medium text-sm text-white",
						"transition-colors hover:bg-zinc-700",
						"focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-1",
						"disabled:cursor-not-allowed disabled:opacity-40",
					)}
				>
					<Download className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">엑셀 다운로드</span>
				</button>
			</div>
		</div>
	);
};
