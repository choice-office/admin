import { ImageOff, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogCategory, BlogPost } from "@/types/database";

// 홈 대표 블로그 칸에 넣을 글을 고르는 모달.
// 발행글만 보여준다 — 임시저장·보관 글은 공개 페이지에 없으므로 홈에 걸 수 없다.
// 검색·카테고리·페이지네이션은 전부 클라이언트 처리(블로그 관리와 같은 방식, 전건 200여 개 규모).

type Props = {
	slot: number;
	posts: BlogPost[];
	categories: BlogCategory[];
	/** 이미 다른 칸에 걸려 있는 글 — postId → 칸 번호. 목록에서 "홈 3" 으로 표시한다. */
	usedSlots: Map<string, number>;
	onClose: () => void;
	onPick: (postId: string) => void;
};

const PAGE_SIZE = 8;
const ROW = "grid grid-cols-[52px_1fr_auto] items-center gap-3 sm:grid-cols-[52px_1fr_120px_104px]";

export const PostPickerModal = ({ slot, posts, categories, usedSlots, onClose, onPick }: Props) => {
	// 검색은 입력값(searchInput)과 적용값(query) 분리 — "조회"/Enter 로 실행(블로그 관리와 동일).
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [categoryId, setCategoryId] = useState("all");
	const [page, setPage] = useState(1);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	const categoryName = (id: string | null): string =>
		categories.find((c) => c.id === id)?.name ?? "—";

	// 발행글만, 발행일 최신순(홈 자동 칸이 채워지는 순서와 같다).
	const published = posts
		.filter((p) => p.status === "published")
		.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

	const q = query.trim().toLowerCase();
	const filtered = published.filter((p) => {
		if (categoryId !== "all" && p.category_id !== categoryId) return false;
		if (!q) return true;
		return `${p.title} ${p.slug} ${categoryName(p.category_id)}`.toLowerCase().includes(q);
	});

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	const runSearch = () => {
		setQuery(searchInput.trim());
		setPage(1);
	};

	const categoryOptions = [
		{ value: "all", label: `전체 카테고리 (${published.length})` },
		...categories
			.map((c) => ({
				value: c.id,
				name: c.name,
				count: published.filter((p) => p.category_id === c.id).length,
			}))
			.filter((c) => c.count > 0)
			.map((c) => ({ value: c.value, label: `${c.name} (${c.count})` })),
	];

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={`${slot}번 칸에 넣을 글 고르기`}
			className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] flex h-[min(86vh,760px)] w-full max-w-[860px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="flex items-start justify-between gap-3 border-border border-b px-4 py-4 sm:px-6 sm:py-5">
					<div>
						<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">
							{slot}번 칸에 넣을 글 고르기
						</h3>
						<p className="m-0 mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
							발행된 글만 고를 수 있습니다. 글을 고르면 그 칸은 자동 갱신을 멈추고 이 글에
							고정됩니다.
						</p>
					</div>
					<button
						type="button"
						aria-label="닫기"
						onClick={onClose}
						className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-border border-b px-4 py-3 sm:px-6">
					<div className="flex min-w-[200px] flex-1 items-center gap-2">
						<Input
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") runSearch();
							}}
							placeholder="제목 검색"
						/>
						<Button variant="outline" iconStart={<Search size={16} />} onClick={runSearch}>
							조회
						</Button>
					</div>
					<Select
						items={categoryOptions}
						value={categoryId}
						onValueChange={(v) => {
							setCategoryId(v ?? "all");
							setPage(1);
						}}
					>
						<SelectTrigger className="text-[var(--text-body)]" style={{ height: 42, width: 210 }}>
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
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{rows.length === 0 ? (
						<div className="px-5 py-16 text-center">
							<div className="font-medium text-[15px] text-foreground">
								조건에 맞는 발행글이 없습니다
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								검색어나 카테고리를 바꿔 보세요.
							</div>
						</div>
					) : (
						rows.map((p) => {
							const usedAt = usedSlots.get(p.id);
							return (
								<button
									key={p.id}
									type="button"
									onClick={() => onPick(p.id)}
									className={cn(
										ROW,
										"w-full border-border border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60 sm:px-6",
									)}
								>
									{/* 썸네일 — 홈 카드와 같은 1:1 */}
									<span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
										{p.cover_url ? (
											<img
												src={p.cover_url}
												alt=""
												className="h-full w-full object-cover"
												loading="lazy"
											/>
										) : (
											<ImageOff size={16} className="text-muted-foreground" />
										)}
									</span>
									<span className="min-w-0">
										<span className="flex flex-wrap items-center gap-1.5">
											<span className="line-clamp-2 break-keep font-medium text-[14.5px] text-foreground leading-snug">
												{p.title || "(제목 없음)"}
											</span>
											{usedAt && <Badge variant="outline">홈 {usedAt}</Badge>}
										</span>
										<span className="mt-0.5 block text-[12.5px] text-muted-foreground sm:hidden">
											{categoryName(p.category_id)} ·{" "}
											{p.published_at ? formatDateOnly(p.published_at) : "—"}
										</span>
									</span>
									<span className="hidden text-[13px] text-muted-foreground sm:block">
										{categoryName(p.category_id)}
									</span>
									<span className="hidden text-[13px] text-muted-foreground sm:block">
										{p.published_at ? formatDateOnly(p.published_at) : "—"}
									</span>
								</button>
							);
						})
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-border border-t px-4 py-3 sm:px-6">
					<span className="text-[12.5px] text-muted-foreground">
						발행글 {filtered.length}건
						{query || categoryId !== "all" ? ` (전체 ${published.length}건 중)` : ""}
					</span>
					<PaginationBar page={safePage} totalPages={totalPages} onPageChange={setPage} />
				</div>
			</div>
		</div>
	);
};
