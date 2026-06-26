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
const GRID = "1.3fr 1.2fr 1.4fr 0.8fr 1fr";

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
		<div style={{ maxWidth: 1280 }}>
			<div style={{ marginBottom: 20 }}>
				<h2
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "var(--text-heading)",
						margin: "0 0 6px",
						letterSpacing: "-0.02em",
					}}
				>
					상담 문의 관리
				</h2>
				<p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
					홈페이지로 접수된 상담 문의를 확인하고 처리 상태를 관리합니다.
				</p>
			</div>

			{/* 필터 바 */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					flexWrap: "wrap",
					marginBottom: 16,
				}}
			>
				<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
								style={{
									height: 36,
									padding: "0 14px",
									borderRadius: "var(--radius)",
									fontSize: 14,
									fontWeight: active ? 700 : 500,
									cursor: "pointer",
									background: active ? "var(--color-primary)" : "var(--surface-card)",
									color: active ? "#fff" : "var(--text-body)",
									border: `1px solid ${active ? "var(--color-primary)" : "var(--border-default)"}`,
								}}
							>
								{t.label} {counts[t.key] ?? 0}
							</button>
						);
					})}
				</div>
				<div style={{ flex: 1 }} />
				<select
					value={period}
					onChange={(e) => {
						setPeriod(e.target.value as PeriodKey);
						resetPage();
					}}
					style={{
						height: 42,
						padding: "0 12px",
						borderRadius: "var(--radius)",
						border: "1px solid var(--border-default)",
						background: "var(--surface-card)",
						fontFamily: "var(--font-sans)",
						fontSize: 14,
						color: "var(--text-body)",
					}}
				>
					{PERIODS.map((p) => (
						<option key={p.key} value={p.key}>
							{p.label}
						</option>
					))}
				</select>
				<div style={{ position: "relative", width: 240 }}>
					<span
						style={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							color: "var(--text-muted)",
							display: "flex",
						}}
					>
						<Search size={17} />
					</span>
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							resetPage();
						}}
						placeholder="이름·연락처·이메일 검색"
						style={{ height: 42, paddingLeft: 38 }}
					/>
				</div>
			</div>

			{/* 테이블 */}
			<div
				style={{
					background: "var(--surface-card)",
					border: "1px solid var(--border-default)",
					borderRadius: "var(--radius)",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: GRID,
						gap: 12,
						padding: "12px 20px",
						background: "var(--surface-subtle)",
						borderBottom: "1px solid var(--border-default)",
						fontSize: 13,
						fontWeight: 600,
						color: "var(--text-muted)",
					}}
				>
					<div>의뢰인</div>
					<div>연락처</div>
					<div>업무분야</div>
					<div>상태</div>
					<div>접수일</div>
				</div>

				{isLoading ? (
					<div
						style={{
							padding: "56px 20px",
							textAlign: "center",
							color: "var(--text-muted)",
							fontSize: 14,
						}}
					>
						불러오는 중…
					</div>
				) : rows.length === 0 ? (
					<div style={{ padding: "56px 20px", textAlign: "center" }}>
						<div style={{ fontSize: 15, color: "var(--text-heading)", fontWeight: 500 }}>
							조건에 맞는 문의가 없습니다
						</div>
						<div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
							필터나 검색어를 바꿔 다시 시도해 보세요.
						</div>
					</div>
				) : (
					rows.map((c) => (
						<button
							key={c.id}
							type="button"
							onClick={() => setSelectedId(c.id)}
							style={{
								display: "grid",
								gridTemplateColumns: GRID,
								gap: 12,
								alignItems: "center",
								width: "100%",
								padding: "14px 20px",
								border: "none",
								borderBottom: "1px solid var(--border-default)",
								background: "transparent",
								cursor: "pointer",
								textAlign: "left",
								font: "inherit",
							}}
						>
							<div style={{ fontWeight: 500, color: "var(--text-heading)" }}>{c.name}</div>
							<div style={{ color: "var(--text-body)", fontSize: 14 }}>{c.phone}</div>
							<div style={{ color: "var(--text-body)", fontSize: 14 }}>
								{consultLabel(c.consult_field)}
							</div>
							<div>
								<StatusBadge status={c.status} />
							</div>
							<div style={{ color: "var(--text-muted)", fontSize: 14 }}>
								{formatDateCompact(c.created_at)}
							</div>
						</button>
					))
				)}
			</div>

			{/* 페이지네이션 */}
			{totalPages > 1 && (
				<div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
					{Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
						<button
							key={n}
							type="button"
							onClick={() => setPage(n)}
							style={{
								minWidth: 38,
								height: 38,
								borderRadius: "var(--radius)",
								border: `1px solid ${n === current ? "var(--color-primary)" : "var(--border-default)"}`,
								background: n === current ? "var(--color-primary)" : "var(--surface-card)",
								color: n === current ? "#fff" : "var(--text-body)",
								fontWeight: n === current ? 700 : 500,
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							{n}
						</button>
					))}
				</div>
			)}

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
