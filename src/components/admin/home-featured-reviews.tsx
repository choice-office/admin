import { ImageOff, Plus, Star, X } from "lucide-react";
import { useState } from "react";
import { ReviewPickerModal } from "@/components/admin/review-picker-modal";
import { Badge, Button, Card, CardTitle } from "@/components/ui/ds";
import { useReviews } from "@/hooks/use-reviews";
import { cn } from "@/lib/utils";

// 홈 "의뢰인이 직접 전한 후기"(마퀴) 관리.
//
// 쇼츠·블로그와 달리 **칸이 고정되어 있지 않다** — 마퀴에 흘리는 가변 목록이라 추가·삭제로 다룬다.
//   · 최소 8개  : 마퀴가 짧으면 반복이 눈에 보여 어색하다
//   · 최대 12개 : 너무 길면 홈이 무거워진다
// 데이터는 review_images.is_featured (후기 관리와 같은 표) — 스키마 변경 없음.
// 순서는 후기 관리의 sort_order 를 그대로 따른다(여기서 순서를 다시 정하지는 않는다).
// 공개 렌더: choice-homepage src/lib/review-images.ts getFeaturedReviewImages
//   → 고른 것이 8개보다 적으면 남은 노출 후기로 채워 홈은 항상 8~12개를 유지한다.

const MIN = 8;
const MAX = 12;

export const HomeFeaturedReviews = () => {
	const { images, isLoading, updateReview, refetch } = useReviews();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [isPicking, setIsPicking] = useState(false);

	// 노출(is_published) 중인 것만 홈에 걸 수 있다 — 내린 후기가 홈에 남아 있으면 안 된다.
	const published = images.filter((r) => r.is_published);
	const picked = published.filter((r) => r.is_featured);
	const candidates = published.filter((r) => !r.is_featured);

	const canRemove = picked.length > MIN;
	const canAdd = picked.length < MAX;
	// 노출 후기 자체가 8개 미만이면 상한/하한을 지킬 수 없다 → 화면에서 사실대로 알린다.
	const notEnoughPublished = published.length < MIN;

	const setFeatured = async (id: string, next: boolean) => {
		setBusyId(id);
		const ok = await updateReview(id, { is_featured: next });
		setBusyId(null);
		if (!ok) alert("변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
	};

	const handleRemove = async (id: string) => {
		if (!canRemove) {
			alert(
				`홈 후기는 최소 ${MIN}개가 필요합니다.\n\n지금 ${picked.length}개라 더 뺄 수 없습니다.\n다른 후기를 먼저 추가해 주세요.`,
			);
			return;
		}
		await setFeatured(id, false);
	};

	const handleAdd = async (id: string) => {
		await setFeatured(id, true);
		await refetch();
	};

	return (
		<Card>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<CardTitle>의뢰인이 직접 전한 후기</CardTitle>
				<Button
					variant="outline"
					size="sm"
					iconStart={<Plus size={15} />}
					disabled={!canAdd || busyId !== null || candidates.length === 0}
					onClick={() => setIsPicking(true)}
				>
					후기 추가
				</Button>
			</div>

			<p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
				<span>
					홈 후기 띠에 흘릴 후기입니다.{" "}
					<b className="text-foreground">
						{MIN}~{MAX}개
					</b>{" "}
					사이로 유지됩니다.
				</span>
				<span
					className={cn(
						"rounded-sm px-1.5 py-0.5 font-bold text-[11.5px]",
						picked.length >= MIN && picked.length <= MAX
							? "bg-accent text-accent-foreground"
							: "bg-destructive/10 text-destructive",
					)}
				>
					지금 {picked.length}개
				</span>
				{!canAdd && <span>상한({MAX}개)에 도달해 추가할 수 없습니다.</span>}
				{!canRemove && !notEnoughPublished && <span>하한({MIN}개)이라 더 뺄 수 없습니다.</span>}
			</p>

			{notEnoughPublished && !isLoading && (
				<div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
					<p className="m-0 font-semibold text-[13px] text-destructive">
						노출 중인 후기가 부족합니다
					</p>
					<p className="m-0 mt-1 text-[12.5px] text-muted-foreground">
						노출 중인 후기가 {published.length}개뿐입니다({MIN}개 필요). 후기 관리에서 후기를 더
						등록하거나 노출로 바꿔 주세요. 그때까지 홈에는 있는 만큼만 나갑니다.
					</p>
				</div>
			)}

			{isLoading ? (
				<p className="mt-4 text-[13px] text-muted-foreground">불러오는 중…</p>
			) : (
				<div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
					{picked.map((r, i) => (
						<div
							key={r.id}
							className="relative flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2.5"
						>
							<div className="flex items-center justify-between gap-1">
								{/* 홈 띠에서 몇 번째로 흐르는지 — 순서는 후기 관리의 정렬을 따른다. */}
								<span className="flex h-6 min-w-6 items-center justify-center rounded bg-accent px-1.5 font-bold text-[12px] text-accent-foreground">
									{i + 1}
								</span>
								<button
									type="button"
									title={canRemove ? "홈에서 빼기" : `최소 ${MIN}개가 필요합니다`}
									disabled={busyId !== null}
									onClick={() => handleRemove(r.id)}
									className={cn(
										"flex h-6 w-6 items-center justify-center rounded",
										canRemove
											? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											: "cursor-not-allowed text-muted-foreground/40",
									)}
								>
									<X size={14} />
								</button>
							</div>

							<div className="relative aspect-[4/3] overflow-hidden rounded border border-border bg-background">
								{r.src ? (
									<img
										src={r.src}
										alt={`${i + 1}번째 후기`}
										loading="lazy"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground">
										<ImageOff size={18} />
									</div>
								)}
								{busyId === r.id && (
									<div className="absolute inset-0 flex items-center justify-center bg-card/70 font-semibold text-[12px] text-muted-foreground">
										저장 중…
									</div>
								)}
							</div>

							<Badge variant="outline">{r.tag || "분류 없음"}</Badge>
							<span className="line-clamp-2 min-h-[34px] break-keep text-[12.5px] text-foreground leading-snug">
								{r.quote || "(내용 없음)"}
							</span>
						</div>
					))}
				</div>
			)}

			<p className="mt-3.5 flex items-start gap-1.5 text-[12.5px] text-muted-foreground">
				<Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
				<span>
					후기 등록·수정·노출 여부는 <b className="text-foreground">후기 관리</b>에서 하고, 그중
					홈에 흘릴 것을 여기서 고릅니다. 홈에서 내린 후기(노출 해제)는 자동으로 빠집니다. 홈 반영은
					최대 1분.
				</span>
			</p>

			{isPicking && (
				<ReviewPickerModal
					candidates={candidates}
					current={picked.length}
					max={MAX}
					onClose={() => setIsPicking(false)}
					onAdd={handleAdd}
				/>
			)}
		</Card>
	);
};
