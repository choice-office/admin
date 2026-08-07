import { ImageOff, Pin, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PostPickerModal } from "@/components/admin/post-picker-modal";
import { Badge, Button, Card, CardTitle } from "@/components/ui/ds";
import {
	clearFeatured,
	getCategories,
	HOME_FEATURED_SLOTS,
	listPosts,
	setFeaturedSlot,
} from "@/lib/blog";
import { formatDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogCategory, BlogPost } from "@/types/database";

// 홈 "비자 정보·소식" 4칸 관리 — 쇼츠 4칸과 같은 칸 단위 모델.
// 칸마다 자동(최신 발행글이 계속 굴러감) 또는 고정(그 글에 머묾)이다.
// 자동 칸에도 "지금 그 자리에 나가는 글"을 흐리게 보여줘서 홈에 무엇이 걸렸는지 화면에서 바로 확인된다.
// 홈 반영은 ISR 60초. 데이터: blog_posts.is_featured/featured_order (lib/blog.ts setFeaturedSlot)

const SLOTS = Array.from({ length: HOME_FEATURED_SLOTS }, (_, i) => i + 1);

export const HomeFeaturedPosts = () => {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busySlot, setBusySlot] = useState<number | null>(null);
	const [pickerSlot, setPickerSlot] = useState<number | null>(null);

	const refetch = useCallback(async () => {
		const [p, c] = await Promise.all([listPosts(), getCategories()]);
		setPosts(p);
		setCategories(c);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	// 고정 칸 — featured_order 가 칸 번호다.
	const pinned = new Map<number, BlogPost>();
	for (const p of posts) {
		if (p.is_featured && p.featured_order && !pinned.has(p.featured_order)) {
			pinned.set(p.featured_order, p);
		}
	}
	// 자동 칸이 채워지는 순서 = 발행일 최신순, 고정된 글 제외(홈페이지 getFeaturedPosts 와 같은 기준).
	const pinnedIds = new Set([...pinned.values()].map((p) => p.id));
	const autoQueue = posts
		.filter((p) => p.status === "published" && !pinnedIds.has(p.id))
		.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

	// 칸별로 실제 홈에 나가는 글 계산 — 빈 칸 순서대로 autoQueue 를 배분한다.
	let autoIndex = 0;
	const resolved = SLOTS.map((slot) => {
		const post = pinned.get(slot);
		if (post) return { slot, post, isPinned: true as const };
		const auto = autoQueue[autoIndex];
		autoIndex += 1;
		return { slot, post: auto, isPinned: false as const };
	});

	// 어느 글이 몇 번 칸에 고정돼 있는지 — 모달에서 "홈 3" 배지로 보여준다.
	const usedSlots = new Map([...pinned.entries()].map(([slot, p]) => [p.id, slot] as const));
	const pinnedCount = pinned.size;

	const apply = async (slot: number, run: () => Promise<boolean>, failMessage: string) => {
		setBusySlot(slot);
		const ok = await run();
		await refetch();
		setBusySlot(null);
		if (!ok) alert(failMessage);
	};

	const handlePick = async (postId: string) => {
		const slot = pickerSlot;
		setPickerSlot(null);
		if (!slot) return;
		await apply(
			slot,
			() => setFeaturedSlot(slot, postId),
			"글을 칸에 넣지 못했습니다. 잠시 후 다시 시도해 주세요.",
		);
	};

	const handleRelease = async (slot: number) =>
		apply(
			slot,
			() => setFeaturedSlot(slot, null),
			"자동으로 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.",
		);

	const handleAllAuto = async () => {
		if (!confirm(`고정한 ${pinnedCount}개를 모두 해제하고 4칸 전부 자동으로 바꿉니다.`)) return;
		setBusySlot(-1);
		const ok = await clearFeatured();
		await refetch();
		setBusySlot(null);
		if (!ok) alert("자동으로 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.");
	};

	return (
		<Card className="mt-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<CardTitle>비자 정보 · 소식 · 4칸</CardTitle>
				{pinnedCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						disabled={busySlot !== null}
						iconStart={<RotateCcw size={14} />}
						onClick={handleAllAuto}
					>
						전부 자동으로
					</Button>
				)}
			</div>
			<p className="mt-1.5 text-[12.5px] text-muted-foreground">
				{pinnedCount === 0
					? "지금은 4칸 모두 자동 — 글을 발행하면 최신 4개로 저절로 바뀝니다."
					: `${pinnedCount}칸 고정 · 나머지 ${HOME_FEATURED_SLOTS - pinnedCount}칸은 최신 발행글로 계속 갱신됩니다.`}
			</p>

			<div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{resolved.map(({ slot, post, isPinned }) => (
					<div
						key={slot}
						className={cn(
							"flex flex-col gap-2 rounded-md p-2.5",
							isPinned
								? "border border-border bg-muted/30"
								: "border border-border border-dashed bg-transparent",
						)}
					>
						<div className="flex items-center justify-between gap-1">
							{/* 칸 번호를 눈에 띄게 — 쇼츠 섹션과 같은 표시(어느 자리인지가 핵심 정보). */}
							<span className="flex h-6 min-w-6 items-center justify-center rounded bg-accent px-1.5 font-bold text-[12.5px] text-accent-foreground">
								{slot}
							</span>
							{isPinned ? (
								<Badge variant="outline">
									<Pin size={11} className="mr-1" />
									고정
								</Badge>
							) : (
								<span className="text-[11.5px] text-muted-foreground">자동</span>
							)}
						</div>

						{/* 썸네일 — 홈 블로그 카드와 같은 1:1. 자동 칸은 흐리게(지금 나가는 글이라는 뜻). */}
						<div
							className={cn(
								"relative aspect-square overflow-hidden rounded border border-border bg-background",
								!isPinned && "opacity-60",
							)}
						>
							{post?.cover_url ? (
								<img
									src={post.cover_url}
									alt={`${slot}번 칸 미리보기`}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[12px] text-muted-foreground">
									{isLoading ? (
										"불러오는 중…"
									) : (
										<>
											<ImageOff size={18} />
											{post ? "커버 없음" : "발행글 부족"}
										</>
									)}
								</div>
							)}
						</div>

						<span
							className={cn(
								"line-clamp-2 min-h-[36px] break-keep text-[13px] leading-snug",
								isPinned ? "font-medium text-foreground" : "text-muted-foreground",
							)}
						>
							{post?.title || (isLoading ? "" : "발행된 글이 부족합니다")}
						</span>
						<span className="text-[11.5px] text-muted-foreground">
							{post?.published_at ? formatDateOnly(post.published_at) : " "}
						</span>

						<div className="flex items-center gap-1.5">
							<Button
								size="sm"
								className="flex-1"
								disabled={busySlot !== null}
								onClick={() => setPickerSlot(slot)}
							>
								{busySlot === slot ? "저장 중…" : "선택하기"}
							</Button>
							{isPinned && (
								<Button
									variant="ghost"
									size="sm"
									title="이 칸을 자동으로 되돌리기"
									disabled={busySlot !== null}
									onClick={() => handleRelease(slot)}
								>
									<RotateCcw size={14} />
								</Button>
							)}
						</div>
					</div>
				))}
			</div>

			<p className="mt-3.5 text-[12.5px] text-muted-foreground">
				자동 칸은 새 글을 발행하면 그 글로 바뀌고 가장 오래된 글이 밀려 나갑니다. 고정한 칸은 바꿀
				때까지 그대로 유지됩니다. 홈 반영은 최대 1분.
			</p>

			{pickerSlot !== null && (
				<PostPickerModal
					slot={pickerSlot}
					posts={posts}
					categories={categories}
					usedSlots={usedSlots}
					onClose={() => setPickerSlot(null)}
					onPick={handlePick}
				/>
			)}
		</Card>
	);
};
