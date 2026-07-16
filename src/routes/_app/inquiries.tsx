import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { InquiryDetailModal } from "@/components/admin/inquiry-detail-modal";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/ds";
import { useContacts } from "@/hooks/use-contacts";
import { consultLabel, STATUS_META, STATUS_ORDER } from "@/lib/contacts";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/types/database";

export const Route = createFileRoute("/_app/inquiries")({
	component: InquiriesPage,
});

const PERIODS = [
	{ key: "all", label: "전체 기간" },
	{ key: "today", label: "오늘" },
	{ key: "7d", label: "최근 7일" },
	{ key: "30d", label: "최근 30일" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

const PAGE_SIZE = 10;
// 테이블 컬럼 비율 — 헤더/행이 동일 그리드를 공유
const GRID = "grid-cols-[1.3fr_1.2fr_1.4fr_0.8fr_1fr]";

function InquiriesPage() {
	const { contacts, isLoading, updateContact } = useContacts();
	const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
	const [period, setPeriod] = useState<PeriodKey>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const periodStart = useMemo(() => {
		if (period === "today") return dayjs().startOf("day");
		if (period === "7d") return dayjs().subtract(7, "day");
		if (period === "30d") return dayjs().subtract(30, "day");
		return null;
	}, [period]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return contacts.filter((c) => {
			if (statusFilter !== "all" && c.status !== statusFilter) return false;
			if (periodStart && dayjs(c.created_at).isBefore(periodStart)) return false;
			if (q) {
				const hay =
					`${c.name} ${c.phone} ${c.email} ${consultLabel(c.consult_field)}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [contacts, statusFilter, periodStart, search]);

	const counts = useMemo(() => {
		const map: Record<string, number> = { all: contacts.length };
		for (const s of STATUS_ORDER) map[s] = contacts.filter((c) => c.status === s).length;
		return map;
	}, [contacts]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const current = Math.min(page, totalPages);
	const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
	const selected = contacts.find((c) => c.id === selectedId) ?? null;

	const tabs: { key: ContactStatus | "all"; label: string }[] = [
		{ key: "all", label: "전체" },
		...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label })),
	];

	const resetPage = () => setPage(1);

	return (
		<div>
			<div className="mb-5">
				<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
					상담 문의 관리
				</h2>
				<p className="m-0 text-[15px] text-muted-foreground">
					홈페이지로 접수된 상담 문의를 확인하고 처리 상태를 관리합니다.
				</p>
			</div>

			{/* 필터 바 */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="flex flex-wrap gap-1.5">
					{tabs.map((t) => {
						const active = statusFilter === t.key;
						return (
							<button
								key={t.key}
								type="button"
								onClick={() => {
									setStatusFilter(t.key);
									resetPage();
								}}
								className={cn(
									"h-9 rounded-md border px-3.5 text-sm transition-colors",
									active
										? "border-primary bg-primary font-bold text-primary-foreground"
										: "border-border bg-card font-medium text-[var(--text-body)] hover:bg-muted",
								)}
							>
								{t.label} {counts[t.key] ?? 0}
							</button>
						);
					})}
				</div>
				<div className="flex-1" />
				<select
					value={period}
					onChange={(e) => {
						setPeriod(e.target.value as PeriodKey);
						resetPage();
					}}
					className="h-[42px] rounded-md border border-border bg-card px-3 text-[var(--text-body)] text-sm"
				>
					{PERIODS.map((p) => (
						<option key={p.key} value={p.key}>
							{p.label}
						</option>
					))}
				</select>
				<div className="relative w-60">
					<span className="absolute top-1/2 left-3 flex -translate-y-1/2 text-muted-foreground">
						<Search size={17} />
					</span>
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							resetPage();
						}}
						placeholder="이름·연락처·이메일 검색"
						className="h-[42px] pl-[38px]"
					/>
				</div>
			</div>

			{/* 테이블 */}
			<div className="overflow-hidden rounded-md border border-border bg-card">
				<div
					className={cn(
						"grid gap-3 border-border border-b bg-muted px-5 py-3 font-semibold text-[13px] text-muted-foreground",
						GRID,
					)}
				>
					<div>의뢰인</div>
					<div>연락처</div>
					<div>업무분야</div>
					<div>상태</div>
					<div>접수일</div>
				</div>

				<div className="flex min-h-[calc(100vh-330px)] flex-col overflow-y-auto">
					{isLoading ? (
						<div className="flex flex-1 items-center justify-center px-5 py-14 text-muted-foreground text-sm">
							불러오는 중…
						</div>
					) : rows.length === 0 ? (
						<div className="flex flex-1 flex-col items-center justify-center px-5 py-14 text-center">
							<div className="font-medium text-[15px] text-foreground">
								조건에 맞는 문의가 없습니다
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								필터나 검색어를 바꿔 다시 시도해 보세요.
							</div>
						</div>
					) : (
						rows.map((c) => (
							<button
								key={c.id}
								type="button"
								onClick={() => setSelectedId(c.id)}
								className={cn(
									"grid w-full items-center gap-3 border-border border-b px-5 py-3.5 text-left transition-colors hover:bg-muted",
									GRID,
								)}
							>
								<div className="font-medium text-foreground">{c.name}</div>
								<div className="text-[var(--text-body)] text-sm">{c.phone}</div>
								<div className="text-[var(--text-body)] text-sm">
									{consultLabel(c.consult_field)}
								</div>
								<div>
									<StatusBadge status={c.status} />
								</div>
								<div className="text-muted-foreground text-sm">
									{formatDateCompact(c.created_at)}
								</div>
							</button>
						))
					)}
				</div>
			</div>

			{/* 페이지네이션 — 1페이지여도 항상 표시 */}
			<div className="mt-5 flex justify-center gap-1.5">
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
					<button
						key={n}
						type="button"
						onClick={() => setPage(n)}
						className={cn(
							"h-[38px] min-w-[38px] rounded-md border text-sm transition-colors",
							n === current
								? "border-primary bg-primary font-bold text-primary-foreground"
								: "border-border bg-card font-medium text-[var(--text-body)] hover:bg-muted",
						)}
					>
						{n}
					</button>
				))}
			</div>

			{selected && (
				<InquiryDetailModal
					contact={selected}
					onClose={() => setSelectedId(null)}
					onSave={async (id, patch) => {
						await updateContact(id, patch);
					}}
				/>
			)}
		</div>
	);
}
