import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types/database";

// 홈 화면 "비자 정보·소식" 4칸을 그대로 보여주는 슬롯 바.
// 지정한 글이 4개보다 적으면 홈은 최신 발행글로 부족분을 채우므로, 빈 칸에도
// "실제로 채워질 글"의 제목을 그대로 보여준다 → 홈에 무엇이 나가는지 화면에서 바로 확인된다.

type FeaturedSlotsProps = {
	/** 직접 지정한 글(홈 노출 순서). 길이가 max 보다 짧으면 나머지는 autoFill 로 채워진다. */
	picked: BlogPost[];
	/** 빈 칸을 채울 글(최신 발행글 순서, picked 제외). */
	autoFill: BlogPost[];
	max: number;
	/** 자동 모드(지정 0개) 여부 — 안내 문구가 달라진다. */
	isAuto: boolean;
	busy?: boolean;
	/** 자동/직접 지정 모드 전환 컨트롤 — 헤더 한 줄에 같이 놓아 세로 공간을 아낀다. */
	modeToggle?: ReactNode;
	onRemove: (post: BlogPost) => void;
	onMove: (post: BlogPost, direction: -1 | 1) => void;
};

const SLOT_BASE =
	"relative flex min-h-[70px] flex-col gap-1 rounded-md p-2.5 text-left transition-colors";

export const FeaturedSlots = ({
	picked,
	autoFill,
	max,
	isAuto,
	busy = false,
	modeToggle,
	onRemove,
	onMove,
}: FeaturedSlotsProps) => {
	const slots = Array.from({ length: max }, (_, i) => {
		const post = picked[i];
		if (post) return { kind: "picked" as const, post, index: i };
		return { kind: "auto" as const, post: autoFill[i - picked.length], index: i };
	});

	return (
		<div className="mb-3 rounded-md border border-border bg-muted/40 p-2.5">
			<div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-0.5">
				<span className="font-semibold text-[13px] text-foreground">홈 화면에 나가는 4칸</span>
				{modeToggle}
				<span className="text-[12.5px] text-muted-foreground">
					{isAuto
						? "지금은 자동 — 글을 발행하면 최신 4개로 저절로 바뀝니다."
						: `직접 지정 ${picked.length}개${
								picked.length < max ? ` · 남은 ${max - picked.length}칸은 최신글로 채워집니다` : ""
							}`}
				</span>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
				{slots.map((slot) => (
					<div
						key={slot.index}
						className={cn(
							SLOT_BASE,
							slot.kind === "picked"
								? "border border-border bg-card"
								: "border border-border border-dashed bg-transparent",
						)}
					>
						<div className="flex items-center justify-between gap-1">
							<span
								className={cn(
									"inline-flex items-center gap-1 font-bold text-[11.5px]",
									slot.kind === "picked" ? "text-primary" : "text-muted-foreground",
								)}
							>
								{slot.kind === "picked" ? (
									<Star size={12} fill="currentColor" />
								) : (
									<span className="rounded-sm bg-muted px-1.5 py-0.5 font-semibold text-[10.5px]">
										자동
									</span>
								)}
								{slot.index + 1}
							</span>
							{slot.kind === "picked" && (
								<span className="flex items-center gap-0.5">
									<button
										type="button"
										title="앞으로"
										disabled={busy || slot.index === 0}
										onClick={() => onMove(slot.post, -1)}
										className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
									>
										<ChevronLeft size={14} />
									</button>
									<button
										type="button"
										title="뒤로"
										disabled={busy || slot.index >= picked.length - 1}
										onClick={() => onMove(slot.post, 1)}
										className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
									>
										<ChevronRight size={14} />
									</button>
									<button
										type="button"
										title="이 칸 비우기"
										disabled={busy}
										onClick={() => onRemove(slot.post)}
										className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
									>
										<X size={14} />
									</button>
								</span>
							)}
						</div>
						<span
							className={cn(
								"line-clamp-2 break-keep text-[13px] leading-snug",
								slot.kind === "picked" ? "font-medium text-foreground" : "text-muted-foreground",
							)}
						>
							{slot.post?.title ||
								(slot.kind === "auto" ? "발행된 글이 부족합니다" : "(제목 없음)")}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
