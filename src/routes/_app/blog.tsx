import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FeaturedSlots } from "@/components/admin/featured-slots";
import { Badge, Button, Input } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	clearFeatured,
	deletePost,
	featureLatestPosts,
	getCategories,
	listPosts,
	purgeExpiredDrafts,
	setFeaturedPosts,
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
// 홈 "비자 정보·소식" 그리드가 4칸이라 대표글 상한도 4로 맞춘다(부족분은 홈이 최신글로 자동 채움).
const MAX_FEATURED = 4;
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
	const [isFeaturingLatest, setIsFeaturingLatest] = useState(false);
	// 검색 — 입력값(searchInput)과 적용값(query) 분리: "조회"를 눌러야 실제 검색 실행
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [featuredOnly, setFeaturedOnly] = useState(false); // 대표글만 보기
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

	// ── 홈 대표글 ────────────────────────────────────────────────────────────
	// 모드는 데이터에서 유도한다: 지정 0개 = 자동(홈이 최신 발행글 4개를 보여줌),
	// 1~4개 = 직접 지정(부족분은 홈이 최신글로 채움). 별도 설정 테이블이 필요 없다.
	// 모든 변경은 setFeaturedPosts(순서 배열) 한 경로로만 → featured_order 가 항상 1..N.
	const picked = posts
		.filter((p) => p.is_featured)
		.sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
	const isAuto = picked.length === 0;
	// 홈이 빈 칸을 채울 순서 = 발행일 최신순(홈페이지 getFeaturedPosts 와 같은 기준)
	const latestPublished = posts
		.filter((p) => p.status === "published")
		.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
	const pickedIds = new Set(picked.map((p) => p.id));
	const autoFill = latestPublished.filter((p) => !pickedIds.has(p.id)).slice(0, MAX_FEATURED);
	// 홈에 실제로 나가는 4개(자동 채움 포함) — 목록에서 "자동" 배지를 달아 보여준다.
	const homeIds = new Map(
		[...picked, ...autoFill].slice(0, MAX_FEATURED).map((p, i) => [p.id, i + 1] as const),
	);

	const applyFeatured = async (ids: string[]) => {
		setIsFeaturingLatest(true);
		const ok = await setFeaturedPosts(ids);
		await refetch();
		setIsFeaturingLatest(false);
		if (!ok) alert("대표글 설정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
	};

	// 자동 ↔ 직접 지정 전환. 직접 지정으로 갈 때는 "지금 홈에 있는 4개"를 슬롯에 채워
	// 전환만으로 홈이 바뀌지 않게 한다(그 뒤 원하는 칸만 교체).
	const switchToAuto = async () => {
		if (
			!confirm(
				`직접 지정한 ${picked.length}개를 해제하고 자동으로 바꿉니다.\n앞으로 글을 발행하면 홈 4칸이 최신 발행글로 저절로 갱신됩니다.`,
			)
		)
			return;
		setIsFeaturingLatest(true);
		const ok = await clearFeatured();
		await refetch();
		setIsFeaturingLatest(false);
		if (!ok) alert("자동으로 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.");
	};
	const switchToManual = async () =>
		applyFeatured(latestPublished.slice(0, MAX_FEATURED).map((p) => p.id));

	const handleToggleFeatured = async (post: BlogPost) => {
		// 자동 모드에서 별을 누르면 → 이 글을 1번으로 고정하고 나머지는 최신글로 채운 뒤 직접 지정으로 전환
		if (isAuto) {
			if (
				!confirm(
					`직접 지정으로 바꾸고 이 글을 1번 칸에 넣습니다.\n나머지 ${MAX_FEATURED - 1}칸은 최신 발행글로 채워집니다.`,
				)
			)
				return;
			const rest = latestPublished.filter((p) => p.id !== post.id).slice(0, MAX_FEATURED - 1);
			await applyFeatured([post.id, ...rest.map((p) => p.id)]);
			return;
		}
		if (post.is_featured) {
			await applyFeatured(picked.filter((p) => p.id !== post.id).map((p) => p.id));
			return;
		}
		if (picked.length >= MAX_FEATURED) {
			alert(
				`홈 대표글은 최대 ${MAX_FEATURED}개입니다. 위 슬롯에서 한 칸을 비우고 다시 선택해 주세요.`,
			);
			return;
		}
		await applyFeatured([...picked.map((p) => p.id), post.id]);
	};

	const handleMoveSlot = async (post: BlogPost, direction: -1 | 1) => {
		const from = picked.findIndex((p) => p.id === post.id);
		const to = from + direction;
		if (from < 0 || to < 0 || to >= picked.length) return;
		const next = [...picked];
		[next[from], next[to]] = [next[to], next[from]];
		await applyFeatured(next.map((p) => p.id));
	};

	// 필터 — 검색(적용값 query, "조회" 클릭 시 갱신) + 대표글만 보기.
	const q = query.trim().toLowerCase();
	let filtered = posts;
	if (q)
		filtered = filtered.filter((p) =>
			`${p.title} ${p.slug} ${categoryName(p.category_id)}`.toLowerCase().includes(q),
		);
	if (featuredOnly) filtered = filtered.filter((p) => p.is_featured);

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

	// 직접 지정 모드 보조 — 슬롯을 지금의 최신 발행글 4개로 다시 채운다.
	const handleFeatureLatest = async () => {
		if (!confirm(`슬롯 ${MAX_FEATURED}칸을 지금의 최신 발행글로 다시 채웁니다. 계속할까요?`))
			return;
		setIsFeaturingLatest(true);
		const n = await featureLatestPosts(MAX_FEATURED);
		await refetch();
		setIsFeaturingLatest(false);
		if (n === 0) alert("대표글 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
	};

	// 작성/수정은 별도 URL — 새로고침해도 화면이 유지된다. page 는 "목록으로" 복귀용.
	const openNew = () => navigate({ to: "/blog/new", search: { page: safePage } });
	const openEdit = (post: BlogPost) =>
		navigate({ to: "/blog/$postId", params: { postId: post.id }, search: { page: safePage } });

	return (
		<div className="flex h-full flex-col">
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
						블로그 관리
					</h2>
					<p className="m-0 text-[15px] text-muted-foreground">
						글을 작성하고 발행합니다. 발행한 글은 홈페이지 블로그에 노출되고, 홈 화면 첫 페이지에는
						아래 4칸이 그대로 보입니다.
					</p>
				</div>
				<Button variant="primary" iconStart={<Plus size={18} />} onClick={openNew}>
					새 글
				</Button>
			</div>

			{/* 홈 대표글 — 모드 전환 + 실제로 홈에 나가는 4칸 */}
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<span className="font-semibold text-[13px] text-muted-foreground">홈 대표글</span>
				<div className="inline-flex overflow-hidden rounded-md border border-border">
					<button
						type="button"
						onClick={isAuto ? undefined : switchToAuto}
						disabled={isFeaturingLatest}
						title="글을 발행하면 홈 4칸이 최신 발행글로 저절로 갱신됩니다"
						className={cn(
							"h-9 px-3 text-sm transition-colors disabled:opacity-50",
							isAuto
								? "bg-primary font-bold text-primary-foreground"
								: "bg-card font-medium text-foreground hover:bg-muted",
						)}
					>
						자동 · 최신 {MAX_FEATURED}개
					</button>
					<button
						type="button"
						onClick={isAuto ? switchToManual : undefined}
						disabled={isFeaturingLatest}
						title="직접 고른 글을 홈 4칸에 고정합니다"
						className={cn(
							"h-9 border-border border-l px-3 text-sm transition-colors disabled:opacity-50",
							isAuto
								? "bg-card font-medium text-foreground hover:bg-muted"
								: "bg-primary font-bold text-primary-foreground",
						)}
					>
						직접 지정
					</button>
				</div>
				{!isAuto && (
					<Button
						variant="outline"
						iconStart={<Star size={15} />}
						onClick={handleFeatureLatest}
						disabled={isFeaturingLatest}
						title={`슬롯 ${MAX_FEATURED}칸을 지금의 최신 발행글로 다시 채웁니다`}
					>
						{isFeaturingLatest ? "적용 중…" : "최신글로 다시 채우기"}
					</Button>
				)}
			</div>
			<FeaturedSlots
				picked={picked}
				autoFill={autoFill}
				max={MAX_FEATURED}
				isAuto={isAuto}
				busy={isFeaturingLatest}
				onRemove={handleToggleFeatured}
				onMove={handleMoveSlot}
			/>

			{/* 검색 — "조회" 버튼(또는 Enter)으로만 실행 */}
			<div className="mb-4 flex items-center gap-2">
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
				<button
					type="button"
					onClick={() => {
						setFeaturedOnly((v) => !v);
						goPage(1);
					}}
					className={cn(
						"ml-auto flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
						featuredOnly
							? "border-primary bg-primary font-bold text-primary-foreground"
							: "border-border bg-card font-medium text-foreground hover:bg-muted",
					)}
				>
					<Star size={15} fill={featuredOnly ? "currentColor" : "none"} />
					대표글만
				</button>
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
					<div className="md:text-center">대표</div>
					<div className="md:text-center">수정일</div>
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
								{query || featuredOnly ? "조건에 맞는 글이 없습니다" : "작성된 글이 없습니다"}
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								{query || featuredOnly
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
									{/* 자동 모드에서도 홈에 실제로 나가는 4개를 "자동 n" 으로 보여준다 */}
									<button
										type="button"
										title={
											isAuto
												? "직접 지정으로 바꾸고 이 글을 1번 칸에 넣기"
												: p.is_featured
													? "홈 대표글에서 빼기"
													: "홈 대표글로 넣기"
										}
										disabled={isFeaturingLatest}
										onClick={() => handleToggleFeatured(p)}
										className={cn(
											"flex h-8 items-center gap-1 rounded-md px-2 text-sm disabled:opacity-40 md:justify-self-center",
											p.is_featured
												? "font-semibold text-primary"
												: "text-muted-foreground hover:bg-muted",
										)}
									>
										<Star size={16} fill={p.is_featured ? "currentColor" : "none"} />
										{p.is_featured && p.featured_order ? (
											<span>{p.featured_order}</span>
										) : isAuto && homeIds.has(p.id) ? (
											<span className="rounded-sm bg-muted px-1.5 py-0.5 font-semibold text-[10.5px] text-muted-foreground">
												자동 {homeIds.get(p.id)}
											</span>
										) : null}
									</button>
									<div className="text-[13px] text-muted-foreground md:text-center md:text-sm">
										{formatDateCompact(p.updated_at)}
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
				className="mt-4"
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
