import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { Inbox, LogOut, Menu, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactDetailModal } from "@/components/admin/contact-detail-modal";
import { ContactsMobileList } from "@/components/admin/contacts-mobile-list";
import { ContactsTable, columns } from "@/components/admin/contacts-table";
import { ContactsToolbar } from "@/components/admin/contacts-toolbar";
import { SidebarContent } from "@/components/admin/sidebar";
import { StatsCards } from "@/components/admin/stats-cards";
import { useContacts } from "@/hooks/use-contacts";
import { useDebounce } from "@/hooks/use-debounce";
import { isMockMode, supabase } from "@/lib/supabase";
import type { Contact } from "@/types/database";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/dashboard")({
	validateSearch: (search: Record<string, unknown>) => ({
		startDate: typeof search.startDate === "string" ? search.startDate : undefined,
		endDate: typeof search.endDate === "string" ? search.endDate : undefined,
	}),
	beforeLoad: async () => {
		if (isMockMode) return;
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) throw redirect({ to: "/login" });
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { contacts, isLoading, markAsRead, handleLogout } = useContacts();
	const { startDate = "", endDate = "" } = Route.useSearch();
	const navigate = Route.useNavigate();
	// searchInput: 입력창 즉시 반영 / debouncedSearch: 테이블 필터에 적용 (300ms 지연)
	const [searchInput, setSearchInput] = useState("");
	const debouncedSearch = useDebounce(searchInput, 300);
	const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: PAGE_SIZE,
	});

	const handleRangeChange = (start: string, end: string) => {
		void navigate({
			search: { startDate: start || undefined, endDate: end || undefined },
			replace: true,
		});
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	};

	// 시작일 · 종료일 둘 다 선택됐을 때만 필터링
	const filteredData = useMemo(() => {
		if (!startDate || !endDate) return contacts;
		const from = dayjs(startDate).startOf("day");
		const to = dayjs(endDate).endOf("day");
		return contacts.filter((c) => {
			const d = dayjs(c.created_at);
			return !d.isBefore(from) && !d.isAfter(to);
		});
	}, [contacts, startDate, endDate]);

	// debouncedSearch 변경 시 페이지 초기화
	useEffect(() => {
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}, []);

	const table = useReactTable({
		data: filteredData,
		columns,
		state: { sorting, globalFilter: debouncedSearch, pagination },
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const hasFilter = !!(searchInput || (startDate && endDate));
	const exportRows = table.getPrePaginationRowModel().rows.map((r) => r.original);
	const paginationProps = {
		pageIndex: table.getState().pagination.pageIndex,
		pageCount: table.getPageCount(),
		canPrevious: table.getCanPreviousPage(),
		canNext: table.getCanNextPage(),
		onPrevious: () => table.previousPage(),
		onNext: () => table.nextPage(),
		onPage: (idx: number) => table.setPageIndex(idx),
	};

	const handleRowClick = async (contact: Contact) => {
		setSelectedContact(contact);
		await markAsRead(contact);
	};

	// useCallback으로 안정화 → ContactDetailModal의 useEffect가 불필요하게 재실행되지 않음
	const handleCloseModal = useCallback(() => setSelectedContact(null), []);

	return (
		<>
			<ContactDetailModal contact={selectedContact} onClose={handleCloseModal} />
			<div className="flex h-screen overflow-hidden bg-zinc-100">
				{/* 데스크탑 사이드바 */}
				<aside className="hidden w-[210px] shrink-0 flex-col border-zinc-800 border-r bg-zinc-950 lg:flex">
					<SidebarContent />
				</aside>

				{/* 모바일 사이드바 오버레이 */}
				{isMobileMenuOpen && (
					<div className="fixed inset-0 z-50 lg:hidden">
						<button
							type="button"
							aria-label="메뉴 닫기"
							className="absolute inset-0 w-full bg-black/60"
							onClick={() => setIsMobileMenuOpen(false)}
						/>
						<aside
							id="mobile-sidebar-panel"
							className="absolute inset-y-0 left-0 w-60 border-zinc-800 border-r bg-zinc-950"
						>
							<SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
						</aside>
					</div>
				)}

				{/* 메인 컬럼 */}
				<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
					{/* 모바일 헤더 */}
					<header className="flex shrink-0 items-center justify-between border-zinc-200 border-b bg-white px-3 py-2.5 lg:hidden">
						<div className="flex items-center gap-2">
							<button
								type="button"
								aria-label="메뉴 열기"
								aria-expanded={isMobileMenuOpen}
								aria-controls="mobile-sidebar-panel"
								onClick={() => setIsMobileMenuOpen(true)}
								className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100"
							>
								<Menu className="h-5 w-5" />
							</button>
							<div className="flex items-center gap-2">
								<div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900">
									<Inbox className="h-3 w-3 text-white" />
								</div>
								<span className="font-semibold text-sm text-zinc-900">Admin</span>
							</div>
						</div>
						<button
							type="button"
							aria-label="로그아웃"
							onClick={handleLogout}
							className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
						>
							<LogOut className="h-4 w-4" />
							<span className="hidden sm:inline">로그아웃</span>
						</button>
					</header>

					{/* 데스크탑 헤더 */}
					<header className="hidden shrink-0 items-center justify-between border-zinc-200 border-b bg-white px-6 py-3.5 lg:flex">
						<div>
							<h1 className="font-semibold text-base text-zinc-900">문의 관리</h1>
							<p className="mt-0.5 text-xs text-zinc-500">접수된 고객 문의를 확인하고 관리합니다</p>
						</div>
						<button
							type="button"
							onClick={handleLogout}
							className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
						>
							<LogOut className="h-4 w-4" />
							로그아웃
						</button>
					</header>

					{/* Mock 배너 */}
					{isMockMode && (
						<div className="flex shrink-0 items-center gap-2 border-amber-300 border-b bg-amber-50 px-5 py-2 text-amber-800 text-sm">
							<TriangleAlert className="h-3.5 w-3.5 shrink-0" />
							<span>
								<strong>미리보기 모드</strong> —{" "}
								<code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
									.env.local
								</code>
								에 Supabase 키를 설정하면 실제 모드로 전환됩니다.
							</span>
						</div>
					)}

					{/* 콘텐츠 */}
					<main className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
						<StatsCards contacts={contacts} />

						<ContactsToolbar
							globalFilter={searchInput}
							onGlobalFilterChange={setSearchInput}
							startDate={startDate}
							endDate={endDate}
							onRangeChange={handleRangeChange}
							exportRows={exportRows}
							hasFilter={hasFilter}
						/>

						<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200 bg-white">
							<ContactsTable
								table={table}
								isLoading={isLoading}
								hasFilter={hasFilter}
								onRowClick={handleRowClick}
								paginationProps={paginationProps}
							/>
							<ContactsMobileList
								rows={table.getRowModel().rows}
								isLoading={isLoading}
								hasFilter={hasFilter}
								onRowClick={handleRowClick}
								paginationProps={paginationProps}
							/>
						</div>
					</main>
				</div>
			</div>
		</>
	);
}
