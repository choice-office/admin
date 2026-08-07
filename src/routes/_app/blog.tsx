import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	deletePost,
	getCategories,
	HOME_FEATURED_SLOTS,
	listPosts,
	purgeExpiredDrafts,
} from "@/lib/blog";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogCategory, BlogPost, PostStatus } from "@/types/database";

export const Route = createFileRoute("/_app/blog")({
	component: BlogPage,
	validateSearch: (search: Record<string, unknown>): { page: number } => ({
		page: Math.max(1, Number(search.page) || 1),
	}),
});

// md+ 에서만 테이블 그리드(헤더/행 공유). 모바일은 카드 스택.
const GRID = "md:grid md:grid-cols-[2.4fr_1fr_0.7fr_0.6fr_0.9fr_auto] md:items-center md:gap-3";
const PAGE_SIZE = 10;

const STATUS_LABEL: Record<PostStatus, string> = {
	draft: "임시저장",
	published: "발행",
	archived: "보관",
};

function BlogPage() {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	// 검색 — 입력값(searchInput)과 적용값(query) 분리: "조회"를 눌러야 실제 검색 실행
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [categoryId, setCategoryId] = useState("all"); // 카테고리 필터(선택 즉시 적용)
	const navigate = useNavigate({ from: Route.fullPath });
	const { page } = Route.useSearch();
	const goPage = (n: number) => navigate({ search: { page: n } });

	const refetch = useCallback(async () => {
		setIsLoading(true);
		// 보관 기간(30일) 지난 임시저장 글을 먼저 정리한 뒤 목록을 읽는다
		await purgeExpiredDrafts();
		const [p, c] = await Promise.all([listPosts(), getCategories()]);
		setPosts(p);
		setCategories(c);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	const categoryName = (id: string | null): string =>
		categories.find((c) => c.id === id)?.name ?? "—";

	// 카테고리 선택 목록 — 전체 글 기준 개수를 함께 보여주고, 글이 있는 분류만 노출한다.
	const categoryOptions = [
		{ value: "all", label: `전체 카테고리 (${posts.length})` },
		...categories
			.map((c) => ({
				value: c.id,
				count: posts.filter((p) => p.category_id === c.id).length,
				name: c.name,
			}))
			.filter((c) => c.count > 0)
			.map((c) => ({ value: c.value, label: `${c.name} (${c.count})` })),
	];

	// ── 홈 노출 표시(읽기 전용) ───────────────────────────────────────────────
	// 대표글 설정은 "홈 화면"(/home)에서 한다. 여기서는 어떤 글이 홈 몇 번 칸에 걸려 있는지만 보여준다.
	// 계산 기준은 홈페이지 getFeaturedPosts 와 같다: 고정 칸(featured_order = 칸 번호)은 그 자리,
	// 빈 칸은 최신 발행글이 순서대로 채운다.
	const pinnedBySlot = new Map<number, BlogPost>();
	for (const p of posts) {
		if (p.is_featured && p.featured_order && !pinnedBySlot.has(p.featured_order)) {
			pinnedBySlot.set(p.featured_order, p);
		}
	}
	const pinnedIds = new Set([...pinnedBySlot.values()].map((p) => p.id));
	const autoQueue = posts
		.filter((p) => p.status === "published" && !pinnedIds.has(p.id))
		.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
	// postId → { slot, isPinned } — 목록 행의 "홈 n" 배지에 쓴다(고정은 진하게, 자동은 흐리게).
	const homeSlots = new Map<string, { slot: number; isPinned: boolean }>();
	let autoIndex = 0;
	for (let slot = 1; slot <= HOME_FEATURED_SLOTS; slot += 1) {
		const pinned = pinnedBySlot.get(slot);
		if (pinned) {
			homeSlots.set(pinned.id, { slot, isPinned: true });
			continue;
		}
		const auto = autoQueue[autoIndex];
		autoIndex += 1;
		if (auto) homeSlots.set(auto.id, { slot, isPinned: false });
	}

	// 필터 — 검색(적용값 query, "조회" 클릭 시 갱신) + 카테고리.
	const q = query.trim().toLowerCase();
	let filtered = posts;
	if (q)
		filtered = filtered.filter((p) =>
			`${p.title} ${p.slug} ${categoryName(p.category_id)}`.toLowerCase().includes(q),
		);
	if (categoryId !== "all") filtered = filtered.filter((p) => p.category_id === categoryId);

	// 페이지네이션(클라이언트) — 목록/검색으로 페이지가 줄면 safePage로 보정
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pagePosts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	// "조회" 클릭 → 짧은 로딩 후 검색 적용(1페이지로 이동). Enter 로도 실행.
	const runSearch = () => {
		setIsSearching(true);
		setTimeout(() => {
			setQuery(searchInput.trim());
			goPage(1);
			setIsSearching(false);
		}, 300);
	};
	const resetSearch = () => {
		setSearchInput("");
		setQuery("");
		goPage(1);
	};

	// 작성/수정은 별도 URL — 새로고침해도 화면이 유지된다. page 는 "목록으로" 복귀용.
	const openNew = () => navigate({ to: "/blog/new", search: { page: safePage } });
	const openEdit = (post: BlogPost) =>
		navigate({ to: "/blog/$postId", params: { postId: post.id }, search: { page: safePage } });

	return (
		<div className="flex h-full flex-col">
			<div className="mb-4 flex items-start justify-between gap-4">
				<div>
					<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
						블로그 관리
					</h2>
					<p className="m-0 text-[15px] text-muted-foreground">
						발행한 글은 홈페이지 블로그에 노출됩니다. 홈에 어떤 글을 띄울지는 “홈 노출”에서
						정합니다.
					</p>
				</div>
				<Button variant="primary" iconStart={<Plus size={18} />} onClick={openNew}>
					새 글
				</Button>
			</div>

			{/* 필터·검색 — 카테고리 선택은 즉시 적용, 검색은 "조회" 버튼(또는 Enter) */}
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<Select
					items={categoryOptions}
					value={categoryId}
					onValueChange={(v) => {
						setCategoryId(v ?? "all");
						goPage(1);
					}}
				>
					<SelectTrigger className="text-[var(--text-body)]" style={{ height: 42, width: 190 }}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{categoryOptions.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="relative w-full sm:max-w-xs">
					<span className="absolute top-1/2 left-3 flex -translate-y-1/2 text-muted-foreground">
						<Search size={17} />
					</span>
					<Input
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") runSearch();
						}}
						placeholder="제목·카테고리 검색"
						className="pl-[38px]"
					/>
				</div>
				<Button variant="primary" onClick={runSearch} disabled={isSearching}>
					{isSearching ? "조회 중…" : "조회"}
				</Button>
				{query && (
					<Button variant="outline" onClick={resetSearch} disabled={isSearching}>
						초기화
					</Button>
				)}
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
				<div
					className={cn(
						"hidden border-border border-b bg-muted px-5 py-3 font-semibold text-[13px] text-muted-foreground",
						GRID,
					)}
				>
					<div>제목</div>
					<div>카테고리</div>
					<div className="md:text-center">상태</div>
					<div className="md:text-center">홈 노출</div>
					<div className="md:text-center">발행일</div>
					<div className="md:text-center">관리</div>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{isLoading || isSearching ? (
						<div className="flex items-center justify-center gap-2 px-5 py-14 text-center text-muted-foreground text-sm">
							<Loader2 size={16} className="animate-spin" />
							{isSearching ? "검색 중…" : "불러오는 중…"}
						</div>
					) : filtered.length === 0 ? (
						<div className="px-5 py-14 text-center">
							<div className="font-medium text-[15px] text-foreground">
								{query || categoryId !== "all"
									? "조건에 맞는 글이 없습니다"
									: "작성된 글이 없습니다"}
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								{query || categoryId !== "all"
									? "검색어나 필터를 바꿔 다시 시도해 보세요."
									: '"새 글" 버튼으로 첫 글을 작성해 보세요.'}
							</div>
						</div>
					) : (
						pagePosts.map((p) => (
							<div
								key={p.id}
								className={cn(
									"flex flex-col gap-2 border-border border-b px-4 py-3.5 last:border-b-0 md:px-5",
									GRID,
								)}
							>
								{/* 제목 + (모바일) 상태 */}
								<div className="flex items-start justify-between gap-2 md:contents">
									<div className="min-w-0">
										<div className="truncate font-medium text-foreground">
											{p.title || "(제목 없음)"}
										</div>
										<div className="mt-0.5 truncate text-[13px] text-muted-foreground">
											/{p.slug}
										</div>
									</div>
									<div className="shrink-0 md:hidden">
										{p.status === "published" ? (
											<Badge variant="primary">{STATUS_LABEL[p.status]}</Badge>
										) : (
											<Badge variant="outline">{STATUS_LABEL[p.status]}</Badge>
										)}
									</div>
								</div>
								<div className="text-[13px] text-muted-foreground md:text-[var(--text-body)] md:text-sm">
									{categoryName(p.category_id)}
								</div>
								{/* 상태 — 데스크탑 열 */}
								<div className="hidden md:block md:text-center">
									{p.status === "published" ? (
										<Badge variant="primary">{STATUS_LABEL[p.status]}</Badge>
									) : (
										<Badge variant="outline">{STATUS_LABEL[p.status]}</Badge>
									)}
								</div>
								{/* 대표 · 수정일 · 관리 (모바일: 한 줄 푸터 / 데스크탑: 개별 열) */}
								<div className="flex items-center justify-between gap-2 md:contents">
									{/* 홈 노출 — 읽기 전용. 설정은 "홈 노출"(/home) 에서 한다. */}
									{(() => {
										const home = homeSlots.get(p.id);
										if (!home)
											return <span aria-hidden className="md:justify-self-center md:text-sm" />;
										return (
											<span
												title={
													home.isPinned
														? `홈 ${home.slot}번 칸에 고정됨`
														: `홈 ${home.slot}번 칸 (자동 — 새 글을 발행하면 바뀝니다)`
												}
												className={cn(
													"inline-flex h-6 shrink-0 items-center gap-1 rounded-sm px-1.5 font-semibold text-[11px] md:justify-self-center",
													home.isPinned
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground",
												)}
											>
												{home.isPinned && <Pin size={10} />}홈 {home.slot}
											</span>
										);
									})()}
									<div className="text-[13px] text-muted-foreground md:text-center md:text-sm">
										{p.published_at ? formatDateCompact(p.published_at) : "—"}
									</div>
									<div className="flex items-center justify-end gap-1 md:justify-center">
										<button
											type="button"
											title="수정"
											onClick={() => openEdit(p)}
											className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
										>
											<Pencil size={16} />
										</button>
										<button
											type="button"
											title="삭제"
											onClick={() => setConfirmId(p.id)}
											className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* 페이지네이션 — 1페이지여도 항상 표시 */}
			<PaginationBar
				page={safePage}
				totalPages={totalPages}
				onPageChange={goPage}
				className="mt-3"
			/>

			{confirmId && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="글 삭제 확인"
					className="fixed inset-0 z-[100] flex items-center justify-center p-6"
				>
					<button
						type="button"
						aria-label="배경 클릭으로 닫기"
						onClick={() => setConfirmId(null)}
						className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
					/>
					<div className="relative z-[1] w-full max-w-[400px] rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-md)]">
						<h3 className="m-0 mb-2 font-bold text-foreground text-lg">글을 삭제할까요?</h3>
						<p className="m-0 mb-5 text-muted-foreground text-sm leading-relaxed">
							삭제한 글은 복구할 수 없습니다. 발행 중이었다면 홈페이지에서도 사라집니다.
						</p>
						<div className="flex justify-end gap-2.5">
							<Button variant="outline" onClick={() => setConfirmId(null)}>
								취소
							</Button>
							<Button
								variant="primary"
								onClick={async () => {
									await deletePost(confirmId);
									setConfirmId(null);
									await refetch();
								}}
							>
								삭제
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
