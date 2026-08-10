import { ImageOff, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { isImeComposing } from "@/lib/ime";
import { cn } from "@/lib/utils";
import type { ReviewImage } from "@/types/database";

// 홈 후기 마퀴에 추가할 후기를 고르는 모달.
// 후기 관리(/reviews)에 등록·노출된 후기 중 **아직 고르지 않은 것**만 보여준다.
// 쇼츠·블로그 모달과 같은 구조(검색 + 페이지네이션 + 클릭 한 번으로 추가)이고,
// 여기만 다른 점은 칸이 아니라 **목록에 더하는 것**이라 여러 개를 연달아 고를 수 있다.

type Props = {
	/** 고를 수 있는 후기 = 노출 중이고 아직 홈에 안 들어간 것 */
	candidates: ReviewImage[];
	/** 지금 홈에 나가는 개수 · 상한 — 남은 자리를 알려준다. */
	current: number;
	max: number;
	onClose: () => void;
	onAdd: (id: string) => Promise<void>;
};

const PAGE_SIZE = 8;

export const ReviewPickerModal = ({ candidates, current, max, onClose, onAdd }: Props) => {
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const [addingId, setAddingId] = useState<string | null>(null);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	// 남은 자리는 부모의 current(= 지금 홈에 나가는 개수)만으로 센다. 부모가 추가마다 refetch 하므로
	// 자체 카운터를 더하면 이중 계산이 되어 자리가 두 칸씩 줄었다(실제로 그 버그를 겪었다).
	const remaining = max - current;

	const q = query.trim().toLowerCase();
	const filtered = q
		? candidates.filter((r) => `${r.tag} ${r.quote} ${r.meta}`.toLowerCase().includes(q))
		: candidates;
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	const runSearch = () => {
		setQuery(searchInput.trim());
		setPage(1);
	};

	const handleAdd = async (id: string) => {
		if (remaining <= 0) return;
		setAddingId(id);
		await onAdd(id);
		setAddingId(null);
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="홈에 추가할 후기 고르기"
			className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] flex h-[min(86vh,780px)] w-full max-w-[860px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="flex items-start justify-between gap-3 border-border border-b px-4 py-4 sm:px-6 sm:py-5">
					<div>
						<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">
							홈에 추가할 후기 고르기
						</h3>
						<p className="m-0 mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
							후기 관리에 등록된 후기 중 노출 중인 것만 나옵니다. 지금 {current}개 ·{" "}
							<b className="text-foreground">
								{remaining > 0 ? `${remaining}개 더 추가 가능` : "상한 도달"}
							</b>
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
							placeholder="분류·내용 검색"
						/>
						<Button variant="outline" iconStart={<Search size={16} />} onClick={runSearch}>
							조회
						</Button>
					</div>
					<span className="text-[12.5px] text-muted-foreground">
						고를 수 있는 후기 {candidates.length}개
					</span>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto">
					{rows.length === 0 ? (
						<div className="px-5 py-14 text-center">
							<div className="font-medium text-[15px] text-foreground">
								{candidates.length === 0
									? "더 고를 후기가 없습니다"
									: "조건에 맞는 후기가 없습니다"}
							</div>
							<div className="mt-1.5 text-muted-foreground text-sm">
								{candidates.length === 0
									? "노출 중인 후기를 모두 홈에 넣었습니다. 후기 관리에서 새 후기를 등록해 주세요."
									: "검색어를 바꿔 보세요."}
							</div>
						</div>
					) : (
						rows.map((r) => (
							<button
								key={r.id}
								type="button"
								disabled={remaining <= 0 || addingId !== null}
								onClick={() => handleAdd(r.id)}
								className={cn(
									"grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 border-border border-b px-4 py-3 text-left last:border-b-0 sm:px-6",
									remaining > 0 ? "hover:bg-muted/60" : "cursor-not-allowed opacity-50",
								)}
							>
								<span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
									{r.src ? (
										<img src={r.src} alt="" loading="lazy" className="h-full w-full object-cover" />
									) : (
										<ImageOff size={16} className="text-muted-foreground" />
									)}
								</span>
								<span className="min-w-0">
									<span className="block">
										<Badge variant="outline">{r.tag || "분류 없음"}</Badge>
									</span>
									<span className="mt-1 line-clamp-2 break-keep text-[13.5px] text-foreground leading-snug">
										{r.quote || "(내용 없음)"}
									</span>
									{r.meta && (
										<span className="mt-0.5 block text-[12px] text-muted-foreground">{r.meta}</span>
									)}
								</span>
								<span className="font-semibold text-[12.5px] text-accent-foreground">
									{addingId === r.id ? "추가 중…" : "추가"}
								</span>
							</button>
						))
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-border border-t px-4 py-3 sm:px-6">
					<span className="text-[12.5px] text-muted-foreground">
						{filtered.length}개{query ? ` (전체 ${candidates.length}개 중)` : ""}
					</span>
					<PaginationBar page={safePage} totalPages={totalPages} onPageChange={setPage} />
				</div>
			</div>
		</div>
	);
};
