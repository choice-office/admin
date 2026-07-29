import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ReviewFormModal } from "@/components/admin/review-form-modal";
import { Badge, Button } from "@/components/ui/ds";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useReviews } from "@/hooks/use-reviews";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewImage } from "@/types/database";

export const Route = createFileRoute("/_app/reviews")({
	component: ReviewsPage,
});

// 관리자 후기 목록 — 페이지당 8개(1페이지여도 페이저 표시)
const REVIEWS_PER_PAGE = 8;

function ReviewsPage() {
	const { images, isLoading, createReview, updateReview, deleteReview } = useReviews();
	const [editing, setEditing] = useState<ReviewImage | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	const publishedCount = images.filter((r) => r.is_published).length;
	const totalPages = Math.max(1, Math.ceil(images.length / REVIEWS_PER_PAGE));
	const current = Math.min(page, totalPages);
	const start = (current - 1) * REVIEWS_PER_PAGE;
	const pageItems = images.slice(start, start + REVIEWS_PER_PAGE);

	return (
		<div className="flex h-full flex-col">
			<div className="mb-5 flex flex-shrink-0 items-start justify-between gap-4">
				<div>
					<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
						의뢰인 후기 관리
					</h2>
					<p className="m-0 text-[15px] text-muted-foreground">
						홈페이지 후기 갤러리에 노출되는 카드입니다. 노출 중 {publishedCount}건 / 전체{" "}
						{images.length}건
					</p>
				</div>
				<Button
					variant="primary"
					iconStart={<Plus size={18} />}
					onClick={() => setIsCreating(true)}
				>
					새 후기
				</Button>
			</div>

			{isLoading ? (
				<div className="rounded-md border border-border bg-card px-5 py-16 text-center text-muted-foreground text-sm">
					불러오는 중…
				</div>
			) : images.length === 0 ? (
				<div className="rounded-md border border-border bg-card px-5 py-16 text-center">
					<div className="font-medium text-[15px] text-foreground">등록된 후기가 없습니다</div>
					<div className="mt-1.5 text-muted-foreground text-sm">
						"새 후기" 버튼으로 후기를 추가해 보세요.
					</div>
				</div>
			) : (
				<>
					{/* 카드 영역만 스크롤 — 페이지네이션은 항상 화면 최하단 고정 */}
					<div className="min-h-0 flex-1 overflow-y-auto">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
							{pageItems.map((r) => (
								<div
									key={r.id}
									className={cn(
										"flex flex-col overflow-hidden rounded-md border border-border transition",
										!r.is_published && "opacity-60",
									)}
									style={{ background: "#fbfaf7", borderTop: "2px solid var(--color-accent)" }}
								>
									{/* 업무분야 뱃지 */}
									<div className="flex items-center gap-1.5 px-3 pt-2.5 font-semibold text-[11px] text-[var(--color-accent)]">
										<span aria-hidden>❝</span>
										<span className="truncate">{r.tag || "—"}</span>
									</div>

									{/* 이미지 창 — 카드 축소를 위해 높이 낮춤(4/4.4) + 하단 페이드 */}
									<div
										className="relative mx-3 mt-2 overflow-hidden border border-border"
										style={{ aspectRatio: "4 / 4.4", background: "#e9edf1" }}
									>
										<img
											src={r.src}
											alt={r.quote}
											className="h-full w-full object-cover object-top"
										/>
										<span
											className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
											style={{
												background:
													"linear-gradient(to bottom, rgba(251,250,247,0) 0%, rgba(251,250,247,0.94) 90%)",
											}}
										/>
									</div>

									{/* 한마디 */}
									<p
										className="px-3 pt-2.5 font-semibold text-[13px] text-[var(--text-heading)] leading-snug"
										style={{ wordBreak: "keep-all" }}
									>
										"{r.quote}"
									</p>
									{/* 작성자 */}
									<p className="px-3 pt-1 pb-1 text-[11px] text-muted-foreground">
										— {r.meta || "익명"}
									</p>

									{/* 관리 푸터 */}
									<div className="mt-auto flex items-center justify-between gap-2 border-border border-t px-3.5 py-2">
										<div className="flex items-center gap-2">
											{r.is_published ? (
												<Badge variant="primary">노출</Badge>
											) : (
												<Badge variant="outline">숨김</Badge>
											)}
											<span className="text-[12px] text-muted-foreground">
												{formatDateCompact(r.created_at)}
											</span>
										</div>
										<div className="flex items-center gap-0.5">
											<button
												type="button"
												title={r.is_published ? "숨기기" : "노출하기"}
												onClick={() => updateReview(r.id, { is_published: !r.is_published })}
												className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
											>
												{r.is_published ? <EyeOff size={17} /> : <Eye size={17} />}
											</button>
											<button
												type="button"
												title="수정"
												onClick={() => setEditing(r)}
												className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
											>
												<Pencil size={16} />
											</button>
											<button
												type="button"
												title="삭제"
												onClick={() => setConfirmId(r.id)}
												className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* 페이지네이션 — 1페이지여도 표시(화면 최하단 고정) */}
					<PaginationBar
						page={current}
						totalPages={totalPages}
						onPageChange={setPage}
						className="mt-4 flex-shrink-0"
					/>
				</>
			)}

			{(isCreating || editing) && (
				<ReviewFormModal
					review={editing}
					onClose={() => {
						setIsCreating(false);
						setEditing(null);
					}}
					onSubmit={async (payload) => {
						if (editing) await updateReview(editing.id, payload);
						else await createReview(payload);
					}}
				/>
			)}

			{confirmId && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="후기 삭제 확인"
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
				>
					<button
						type="button"
						aria-label="배경 클릭으로 닫기"
						onClick={() => setConfirmId(null)}
						className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
					/>
					<div className="relative z-[1] w-full max-w-[400px] rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-md)]">
						<h3 className="m-0 mb-2 font-bold text-foreground text-lg">후기를 삭제할까요?</h3>
						<p className="m-0 mb-5 text-muted-foreground text-sm leading-relaxed">
							삭제한 후기는 복구할 수 없습니다. 홈페이지에서도 즉시 사라집니다.
						</p>
						<div className="flex justify-end gap-2.5">
							<Button variant="outline" onClick={() => setConfirmId(null)}>
								취소
							</Button>
							<Button
								variant="primary"
								onClick={async () => {
									await deleteReview(confirmId);
									setConfirmId(null);
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
