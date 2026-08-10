import { AlertTriangle, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
	addShortToLibrary,
	checkShort,
	parseYoutubeId,
	thumbnailUrl,
} from "@/hooks/use-home-shorts";
import { formatDateOnly } from "@/lib/format";
import { isImeComposing } from "@/lib/ime";
import { cn } from "@/lib/utils";
import type { YoutubeShort } from "@/types/database";

// 홈 4칸 중 한 칸에 넣을 쇼츠를 보관함에서 고르는 모달.
//
// 왜 "칸 → 모달" 순서인가: 예전에는 "넣을 칸 ①②③④ 를 먼저 고르고 아래 목록에서 클릭" 이라
// 시선이 위아래로 갈라지고 지금 몇 번 칸을 채우는지 기억해야 했다. 칸에서 시작하면 헷갈릴
// 여지가 없고, 블로그 대표글(post-picker-modal)과 조작법이 같아진다.
//
// RSS 는 최근 15개까지만 주므로 그보다 예전 쇼츠는 여기서 "링크로 추가" 로 보관함에 넣는다.

type Props = {
	slot: number;
	items: YoutubeShort[];
	/** 이미 다른 칸에 걸린 쇼츠 — youtubeId → 칸 번호. 목록에 "홈 3" 으로 표시한다. */
	usedSlots: Map<string, number>;
	onClose: () => void;
	onPick: (id: string, title: string) => void;
	/** 링크로 새 쇼츠를 보관함에 넣은 뒤 목록을 다시 읽기 위해. */
	onLibraryChange: () => Promise<void>;
};

const PAGE_SIZE = 8;

export const ShortPickerModal = ({
	slot,
	items,
	usedSlots,
	onClose,
	onPick,
	onLibraryChange,
}: Props) => {
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	// 링크로 추가
	const [linkInput, setLinkInput] = useState("");
	const [adding, setAdding] = useState(false);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	const q = query.trim().toLowerCase();
	const filtered = q ? items.filter((v) => v.title.toLowerCase().includes(q)) : items;
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	const runSearch = () => {
		setQuery(searchInput.trim());
		setPage(1);
	};

	const handleAddByLink = async () => {
		const raw = linkInput.trim();
		const id = raw ? parseYoutubeId(raw) : null;
		if (!id) {
			alert(
				"유튜브 링크를 인식하지 못했습니다.\n\n쇼츠 주소를 그대로 붙여넣어 주세요.\n예) https://www.youtube.com/shorts/abcdefghijk",
			);
			return;
		}
		if (items.some((v) => v.youtube_id === id)) {
			alert("이미 보관함에 있는 쇼츠입니다.\n\n아래 목록에서 찾아 선택해 주세요.");
			return;
		}
		setAdding(true);
		const check = await checkShort(id);
		if (!check.ok) {
			setAdding(false);
			alert(
				check.reason === "blocked"
					? "이 영상은 다른 사이트에 퍼갈 수 없도록 설정돼 있습니다.\n\n홈에 넣어도 재생되지 않습니다."
					: check.reason === "notshort"
						? "쇼츠(세로 영상)만 넣을 수 있습니다.\n\n일반 가로 영상은 홈 4칸 레이아웃에 맞지 않습니다."
						: "영상을 찾을 수 없습니다.\n\n주소를 다시 확인해 주세요.",
			);
			return;
		}
		const ok = await addShortToLibrary(id, check.title);
		if (ok) await onLibraryChange();
		setAdding(false);
		if (!ok) {
			alert("보관함에 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.");
			return;
		}
		setLinkInput("");
		// 방금 넣은 쇼츠를 이 칸에 바로 배정한다(추가 후 다시 찾게 만들 이유가 없다).
		onPick(id, check.title);
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={`${slot}번 칸에 넣을 쇼츠 고르기`}
			className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] flex h-[min(86vh,780px)] w-full max-w-[820px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="flex items-start justify-between gap-3 border-border border-b px-4 py-4 sm:px-6 sm:py-5">
					<div>
						<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">
							{slot}번 칸에 넣을 쇼츠 고르기
						</h3>
						<p className="m-0 mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
							보관함에 저장된 쇼츠입니다. 고르면 홈 {slot}번 칸에 바로 반영됩니다(최대 1분).
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
								// 한글 조합 중 Enter 는 "조합 확정"이라 무시한다(미완성 문자열로 실행되는 것 방지)
								if (isImeComposing(e)) return;
								if (e.key === "Enter") runSearch();
							}}
							placeholder="제목 검색"
						/>
						<Button variant="outline" iconStart={<Search size={16} />} onClick={runSearch}>
							조회
						</Button>
					</div>
					<span className="text-[12.5px] text-muted-foreground">보관함 {items.length}개</span>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{rows.length === 0 ? (
						<div className="px-5 py-14 text-center">
							<div className="font-medium text-[15px] text-foreground">
								{items.length === 0 ? "보관함이 비어 있습니다" : "조건에 맞는 쇼츠가 없습니다"}
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								{items.length === 0
									? "위 “보관함 갱신”으로 채널 쇼츠를 불러오거나, 아래에서 링크로 추가해 주세요."
									: "검색어를 바꿔 보세요."}
							</div>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:px-6">
							{rows.map((v) => {
								const usedAt = usedSlots.get(v.youtube_id);
								return (
									<button
										key={v.youtube_id}
										type="button"
										onClick={() => onPick(v.youtube_id, v.title)}
										title={v.title}
										className={cn(
											"group flex flex-col overflow-hidden rounded border border-border bg-background text-left transition-colors hover:border-accent",
											usedAt === slot && "border-accent ring-1 ring-accent",
										)}
									>
										<span className="relative block aspect-[9/16] overflow-hidden">
											<img
												src={thumbnailUrl(v.youtube_id)}
												alt=""
												loading="lazy"
												className="h-full w-full object-cover"
											/>
											{usedAt && (
												<span className="absolute top-1.5 left-1.5">
													<Badge variant="primary">홈 {usedAt}</Badge>
												</span>
											)}
										</span>
										<span className="flex flex-1 flex-col gap-1 p-2">
											<span className="line-clamp-2 break-keep font-medium text-[12.5px] text-foreground leading-snug group-hover:text-accent-foreground">
												{v.title || "(제목 없음)"}
											</span>
											<span className="mt-auto text-[11.5px] text-muted-foreground">
												{v.published_at ? formatDateOnly(v.published_at) : "발행일 없음"}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-border border-t px-4 py-3 sm:px-6">
					<span className="text-[12.5px] text-muted-foreground">
						{filtered.length}개{query ? ` (보관함 ${items.length}개 중)` : ""}
					</span>
					<PaginationBar page={safePage} totalPages={totalPages} onPageChange={setPage} />
				</div>

				{/* 링크로 추가 — RSS 는 최근 15개까지만 주므로 예전 쇼츠는 이 경로로 넣는다. */}
				<div className="flex flex-wrap items-center gap-2 border-border border-t bg-muted/40 px-4 py-3 sm:px-6">
					<span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
						<AlertTriangle className="h-3.5 w-3.5" />
						목록에 없는 예전 쇼츠는 링크로 추가
					</span>
					<div className="flex min-w-[220px] flex-1 items-center gap-2">
						<Input
							value={linkInput}
							onChange={(e) => setLinkInput(e.target.value)}
							onKeyDown={(e) => {
								// 한글 조합 중 Enter 는 "조합 확정"이라 무시한다(미완성 문자열로 실행되는 것 방지)
								if (isImeComposing(e)) return;
								if (e.key === "Enter") handleAddByLink();
							}}
							placeholder="쇼츠 링크 붙여넣기"
							className="text-[12.5px]"
						/>
						<Button
							variant="outline"
							iconStart={<Plus size={15} />}
							disabled={adding || !linkInput.trim()}
							onClick={handleAddByLink}
						>
							{adding ? "확인 중…" : "추가"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
