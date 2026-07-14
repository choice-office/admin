import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui/ds";
import { getImageDimensions, uploadReviewImage } from "@/lib/review-images";
import type { ReviewImage, ReviewImageInsert } from "@/types/database";

type Props = {
	review: ReviewImage | null; // null이면 새 후기 작성
	onClose: () => void;
	onSubmit: (payload: ReviewImageInsert) => Promise<void>;
};

const emptyDraft: ReviewImageInsert = {
	src: "",
	w: 1000,
	h: 1000,
	tag: "",
	quote: "",
	meta: "",
	is_published: true,
	sort_order: 0,
};

export const ReviewFormModal = ({ review, onClose, onSubmit }: Props) => {
	const [draft, setDraft] = useState<ReviewImageInsert>(
		review
			? {
					src: review.src,
					w: review.w,
					h: review.h,
					tag: review.tag,
					quote: review.quote,
					meta: review.meta,
					is_published: review.is_published,
					sort_order: review.sort_order,
				}
			: emptyDraft,
	);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const set = <K extends keyof ReviewImageInsert>(key: K, value: ReviewImageInsert[K]) =>
		setDraft((prev) => ({ ...prev, [key]: value }));

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		const [url, dimensions] = await Promise.all([
			uploadReviewImage(file),
			getImageDimensions(file),
		]);
		setUploading(false);
		if (!url) {
			setError("이미지 업로드에 실패했습니다.");
			return;
		}
		setDraft((prev) => ({ ...prev, src: url, w: dimensions.w, h: dimensions.h }));
	};

	const handleSave = async () => {
		if (!draft.src?.trim()) {
			setError("후기 이미지를 업로드해 주세요.");
			return;
		}
		if (!draft.quote?.trim()) {
			setError("한마디를 입력해 주세요.");
			return;
		}
		setError(null);
		setSaving(true);
		await onSubmit({
			...draft,
			tag: draft.tag?.trim() ?? "",
			quote: draft.quote.trim(),
			meta: draft.meta?.trim() ?? "",
		});
		setSaving(false);
		onClose();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={review ? "후기 수정" : "새 후기 작성"}
			className="fixed inset-0 z-[100] flex items-center justify-center p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="sticky top-0 flex items-center justify-between gap-3 border-border border-b bg-card px-6 py-5">
					<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">
						{review ? "후기 수정" : "새 후기 작성"}
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="닫기"
						className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<X size={20} />
					</button>
				</div>

				<div className="px-6 py-5">
					<div className="mb-[18px]">
						<Label htmlFor="rv-image">후기 이미지 (마스킹된 카톡·이메일 캡처)</Label>
						{draft.src && (
							<img
								src={draft.src}
								alt="후기 미리보기"
								className="mb-2 max-h-[240px] w-full rounded-md border border-border object-contain"
							/>
						)}
						<input
							id="rv-image"
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							disabled={uploading}
							className="block w-full text-foreground text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-card file:px-3.5 file:py-2 file:font-medium file:text-foreground file:text-sm hover:file:bg-muted"
						/>
						{uploading && <p className="mt-1.5 text-[13px] text-muted-foreground">업로드 중…</p>}
					</div>

					<div className="mb-[18px]">
						<Label htmlFor="rv-tag">업무분야 뱃지</Label>
						<Input
							id="rv-tag"
							value={draft.tag ?? ""}
							onChange={(e) => set("tag", e.target.value)}
							placeholder="거소증 · 상담"
						/>
					</div>

					<div className="mb-[18px]">
						<Label htmlFor="rv-quote">한마디 (카드에 큰따옴표로 노출)</Label>
						<Textarea
							id="rv-quote"
							rows={2}
							value={draft.quote ?? ""}
							onChange={(e) => set("quote", e.target.value)}
							placeholder="늘 민첩하고 정확하게 일해 주셔서 고맙습니다."
						/>
					</div>

					<div className="mb-[18px]">
						<Label htmlFor="rv-meta">누가 쓴 후기인지</Label>
						<Input
							id="rv-meta"
							value={draft.meta ?? ""}
							onChange={(e) => set("meta", e.target.value)}
							placeholder="체류 연장 의뢰인"
						/>
					</div>

					<div className="mb-[22px] flex items-center gap-4">
						<div className="flex-1">
							<Label htmlFor="rv-order">정렬 순서</Label>
							<Input
								id="rv-order"
								type="number"
								value={String(draft.sort_order ?? 0)}
								onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
							/>
						</div>
						<label className="flex cursor-pointer items-center gap-2.5 pt-6 text-foreground text-sm">
							<input
								type="checkbox"
								checked={draft.is_published ?? true}
								onChange={(e) => set("is_published", e.target.checked)}
								className="h-4 w-4 accent-[var(--color-primary)]"
							/>
							홈페이지 노출
						</label>
					</div>

					{error && <div className="mb-3.5 text-destructive text-sm">{error}</div>}

					<div className="flex justify-end gap-2.5">
						<Button variant="outline" onClick={onClose}>
							취소
						</Button>
						<Button variant="primary" onClick={handleSave} disabled={saving || uploading}>
							{saving ? "저장 중…" : review ? "변경사항 저장" : "후기 추가"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
