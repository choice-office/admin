import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ReviewFormModal } from "@/components/admin/review-form-modal";
import { Badge, Button } from "@/components/ui/ds";
import { useReviews } from "@/hooks/use-reviews";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewImage } from "@/types/database";

export const Route = createFileRoute("/_app/reviews")({
	component: ReviewsPage,
});

const GRID = "grid-cols-[2.4fr_1fr_0.8fr_1fr_auto]";

function ReviewsPage() {
	const { images, isLoading, createReview, updateReview, deleteReview } = useReviews();
	const [editing, setEditing] = useState<ReviewImage | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);

	const publishedCount = images.filter((r) => r.is_published).length;

	return (
		<div className="max-w-[1280px]">
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
						의뢰인 후기 관리
					</h2>
					<p className="m-0 text-[15px] text-muted-foreground">
						후기를 등록하고 홈페이지 노출 여부를 관리합니다. 노출 중 {publishedCount}건 / 전체{" "}
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

			<div className="overflow-hidden rounded-md border border-border bg-card">
				<div
					className={cn(
						"grid gap-3 border-border border-b bg-muted px-5 py-3 font-semibold text-[13px] text-muted-foreground",
						GRID,
					)}
				>
					<div>후기</div>
					<div>업무분야</div>
					<div>노출</div>
					<div>등록일</div>
					<div className="text-right">관리</div>
				</div>

				{isLoading ? (
					<div className="px-5 py-14 text-center text-muted-foreground text-sm">불러오는 중…</div>
				) : images.length === 0 ? (
					<div className="px-5 py-14 text-center">
						<div className="font-medium text-[15px] text-foreground">등록된 후기가 없습니다</div>
						<div className="mt-1.5 text-muted-foreground text-sm">
							"새 후기" 버튼으로 후기를 추가해 보세요.
						</div>
					</div>
				) : (
					images.map((r) => (
						<div
							key={r.id}
							className={cn(
								"grid items-center gap-3 border-border border-b px-5 py-3.5 last:border-b-0",
								GRID,
							)}
						>
							<div className="flex min-w-0 items-center gap-3">
								<img
									src={r.src}
									alt={r.quote}
									className="h-12 w-12 flex-shrink-0 rounded-md border border-border object-cover"
								/>
								<div className="min-w-0">
									<div className="truncate font-medium text-foreground">"{r.quote}"</div>
									<div className="mt-1 truncate text-[13px] text-muted-foreground">
										{r.meta || "—"}
									</div>
								</div>
							</div>
							<div className="text-[var(--text-body)] text-sm">{r.tag || "—"}</div>
							<div>
								{r.is_published ? (
									<Badge variant="primary">노출</Badge>
								) : (
									<Badge variant="outline">숨김</Badge>
								)}
							</div>
							<div className="text-muted-foreground text-sm">{formatDateCompact(r.created_at)}</div>
							<div className="flex items-center justify-end gap-1">
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
					))
				)}
			</div>

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
					className="fixed inset-0 z-[100] flex items-center justify-center p-6"
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
