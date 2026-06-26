import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";

dayjs.extend(isoWeek);

import { cn } from "@/lib/utils";

type DateRangePickerProps = {
	startDate: string;
	endDate: string;
	onRangeChange: (start: string, end: string) => void;
};

// toISOString()은 UTC 기준 → 로컬 메서드로 YYYY-MM-DD 포맷
const toDate = (str: string): Date | undefined => (str ? new Date(`${str}T00:00:00`) : undefined);

const toStr = (date: Date | undefined): string => {
	if (!date) return "";
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

const formatLabel = (startDate: string, endDate: string): string => {
	const fmt = (s: string) => s.replace(/-/g, ".");
	if (startDate && endDate) return `${fmt(startDate)} ~ ${fmt(endDate)}`;
	if (startDate) return `${fmt(startDate)} ~ 종료일 선택 중`;
	return "기간 선택";
};

const getPresets = () => {
	const now = dayjs();
	return [
		{ label: "오늘", from: now.toDate(), to: now.toDate() },
		{
			label: "이번 주",
			from: now.startOf("isoWeek").toDate(),
			to: now.endOf("isoWeek").toDate(),
		},
		{
			label: "지난 주",
			from: now.subtract(1, "week").startOf("isoWeek").toDate(),
			to: now.subtract(1, "week").endOf("isoWeek").toDate(),
		},
		{ label: "이번 달", from: now.startOf("month").toDate(), to: now.endOf("month").toDate() },
		{
			label: "지난 달",
			from: now.subtract(1, "month").startOf("month").toDate(),
			to: now.subtract(1, "month").endOf("month").toDate(),
		},
		{
			label: "최근 3개월",
			from: now.subtract(2, "month").startOf("month").toDate(),
			to: now.endOf("month").toDate(),
		},
	];
};

export const DateRangePicker = ({ startDate, endDate, onRangeChange }: DateRangePickerProps) => {
	const [open, setOpen] = useState(false);
	const [localRange, setLocalRange] = useState<DateRange | undefined>();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const handleToggle = () => {
		if (!open) {
			setLocalRange(
				startDate || endDate ? { from: toDate(startDate), to: toDate(endDate) } : undefined,
			);
		}
		setOpen((v) => !v);
	};

	const handleSelect = (selected: DateRange | undefined) => {
		setLocalRange(selected);
	};

	const handleConfirm = () => {
		if (!localRange?.from) return;
		const from = localRange.from;
		const to = localRange.to ?? localRange.from;
		onRangeChange(toStr(from), toStr(to));
		setOpen(false);
	};

	const handlePreset = (from: Date, to: Date) => {
		setLocalRange({ from, to });
		onRangeChange(toStr(from), toStr(to));
		setOpen(false);
	};

	const handleClear = () => {
		onRangeChange("", "");
		setOpen(false);
	};

	const hasRange = startDate || endDate;
	const presets = getPresets();

	return (
		<div ref={containerRef} className="relative">
			{/* 트리거 — 날짜 표시 버튼 + X 초기화 버튼을 형제로 분리 (버튼 중첩 방지) */}
			<div
				className={cn(
					"flex h-[34px] w-[230px] items-center rounded border text-sm transition-colors",
					hasRange ? "border-zinc-400 bg-white" : "border-zinc-200 bg-white",
				)}
			>
				<button
					type="button"
					aria-label="기간 선택"
					aria-expanded={open}
					onClick={handleToggle}
					className={cn(
						"flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-0 outline-none",
						hasRange ? "text-zinc-800" : "text-zinc-500 hover:text-zinc-700",
					)}
				>
					<CalendarIcon className="h-3.5 w-3.5 shrink-0" />
					<span className="truncate whitespace-nowrap">{formatLabel(startDate, endDate)}</span>
				</button>
				{hasRange && (
					<button
						type="button"
						aria-label="날짜 초기화"
						onClick={handleClear}
						className="mr-1.5 shrink-0 rounded p-0.5 text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400"
					>
						<X className="h-3 w-3" />
					</button>
				)}
			</div>

			{open && (
				<div className="absolute top-full left-0 z-50 mt-1.5 flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
					{/* 프리셋 사이드바 */}
					<div className="flex w-[108px] shrink-0 flex-col border-zinc-100 border-r bg-zinc-50 p-2">
						<p className="mb-2 px-2 font-semibold text-[10px] text-zinc-500 uppercase tracking-widest">
							빠른 선택
						</p>
						{presets.map((p) => {
							const active =
								localRange?.from &&
								localRange.to &&
								toStr(localRange.from) === toStr(p.from) &&
								toStr(localRange.to) === toStr(p.to);
							return (
								<button
									key={p.label}
									type="button"
									onClick={() => handlePreset(p.from, p.to)}
									className={cn(
										"rounded-md px-2 py-1.5 text-left text-xs transition-colors",
										active
											? "bg-zinc-900 font-medium text-white"
											: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
									)}
								>
									{p.label}
								</button>
							);
						})}
					</div>

					{/* 달력 + 액션 바 */}
					<div className="flex flex-col p-4">
						<DayPicker
							mode="range"
							locale={ko}
							selected={localRange}
							onSelect={handleSelect}
							numberOfMonths={2}
							weekStartsOn={1}
							showOutsideDays={false}
							classNames={{
								months: "relative flex gap-6",
								month: "w-[210px] flex flex-col gap-1",
								nav: "absolute inset-x-0 top-0 flex justify-between items-center z-10 pointer-events-none",
								button_previous: cn(
									"pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md",
									"text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
									"disabled:pointer-events-none disabled:opacity-20",
								),
								button_next: cn(
									"pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md",
									"text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
									"disabled:pointer-events-none disabled:opacity-20",
								),
								month_caption: "flex h-7 items-center justify-center mb-2",
								caption_label: "text-sm font-semibold text-zinc-800 select-none",
								weekdays: "flex",
								weekday:
									"flex-1 text-center text-[11px] font-medium text-zinc-500 pb-1 select-none",
								week: "flex",
								day: "relative flex-1 flex items-center justify-center h-8 p-0",
								range_start: [
									"before:content-[''] before:absolute",
									"before:inset-y-0.5 before:left-1/2 before:right-0",
									"before:bg-zinc-100",
								].join(" "),
								range_end: [
									"before:content-[''] before:absolute",
									"before:inset-y-0.5 before:left-0 before:right-1/2",
									"before:bg-zinc-100",
								].join(" "),
								range_middle: [
									"before:content-[''] before:absolute",
									"before:inset-y-0.5 before:inset-x-0",
									"before:bg-zinc-100",
								].join(" "),
								outside: "invisible pointer-events-none",
								hidden: "invisible",
							}}
							components={{
								Chevron: ({ orientation }) =>
									orientation === "left" ? (
										<ChevronLeft className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									),
								DayButton: ({ day, modifiers, ...props }) => {
									const isStart = modifiers.range_start;
									const isEnd = modifiers.range_end;
									const isMiddle = modifiers.range_middle;
									const isToday = modifiers.today;
									const isDisabled = modifiers.disabled;
									return (
										<button
											{...props}
											type="button"
											className={cn(
												"relative z-10 flex h-7 w-7 items-center justify-center rounded-full",
												"select-none font-normal text-xs transition-colors",
												"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
												!isStart &&
													!isEnd &&
													!isMiddle &&
													!isDisabled &&
													"text-zinc-700 hover:bg-zinc-100",
												isToday && !isStart && !isEnd && "font-bold text-zinc-900",
												(isStart || isEnd) &&
													"bg-zinc-900 font-medium text-white hover:bg-zinc-700",
												isMiddle &&
													!isStart &&
													!isEnd &&
													"rounded-none text-zinc-700 hover:bg-zinc-200",
												isDisabled && "pointer-events-none text-zinc-200",
											)}
										>
											{day.date.getDate()}
										</button>
									);
								},
							}}
						/>

						{/* 하단 액션 바 */}
						<div className="mt-3 flex items-center justify-between border-zinc-100 border-t pt-3">
							<p className="text-xs text-zinc-500">
								{localRange?.from
									? toStr(localRange.from) +
										(localRange.to && toStr(localRange.to) !== toStr(localRange.from)
											? ` — ${toStr(localRange.to)}`
											: "")
									: "날짜를 선택하세요"}
							</p>
							<div className="flex items-center gap-2">
								{(localRange?.from || startDate) && (
									<button
										type="button"
										onClick={handleClear}
										className="text-xs text-zinc-500 hover:text-zinc-700"
									>
										초기화
									</button>
								)}
								<button
									type="button"
									onClick={handleConfirm}
									disabled={!localRange?.from}
									className="rounded bg-zinc-900 px-3 py-1 font-medium text-white text-xs transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
								>
									확인
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
