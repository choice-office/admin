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
	consent_confirmed: false,
	masked_confirmed: false,
	consent_note: "",
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
					consent_confirmed: review.consent_confirmed,
					masked_confirmed: review.masked_confirmed,
					consent_note: review.consent_note ?? "",
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
		try {
			const [url, dimensions] = await Promise.all([
				uploadReviewImage(file),
				getImageDimensions(file),
			]);
			if (!url) {
				setError("이미지 업로드에 실패했습니다.");
				return;
			}
			setDraft((prev) => ({ ...prev, src: url, w: dimensions.w, h: dimensions.h }));
		} catch (e) {
			// 형식·용량 차단 사유를 그대로 안내
			setError(e instanceof Error && e.message ? e.message : "이미지 업로드에 실패했습니다.");
		} finally {
			setUploading(false);
		}
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
		// 제3자(의뢰인) 개인정보가 담긴 캡처라 게시 동의·마스킹 확인을 받아야 저장된다
		if (!draft.consent_confirmed) {
			setError("의뢰인에게 게시 동의를 받았는지 확인해 주세요.");
			return;
		}
		if (!draft.masked_confirmed) {
			setError("개인정보 마스킹을 확인해 주세요.");
			return;
		}
		setError(null);
		setSaving(true);
		await onSubmit({
			...draft,
			tag: draft.tag?.trim() ?? "",
			quote: draft.quote.trim(),
			meta: draft.meta?.trim() ?? "",
			consent_note: draft.consent_note?.trim() || null,
		});
		setSaving(false);
		onClose();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={review ? "후기 수정" : "새 후기 작성"}
			className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
			/>
			<div className="relative z-[1] max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
				<div className="sticky top-0 flex items-center justify-between gap-3 border-border border-b bg-card px-4 py-4 sm:px-6 sm:py-5">
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

				<div className="px-4 py-5 sm:px-6">
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

					{/* 정렬 순서 입력은 두지 않는다 — 새 후기는 기본값(0)으로 목록 앞에 붙고,
					    홈 노출은 목록의 별표(홈 대표)로 고른다. 기존 정렬값은 DB에 그대로 유지. */}
					<div className="mb-[22px] flex items-center gap-4">
						<label className="flex cursor-pointer items-center gap-2.5 text-foreground text-sm">
							<input
								type="checkbox"
								checked={draft.is_published ?? true}
								onChange={(e) => set("is_published", e.target.checked)}
								className="h-4 w-4 accent-[var(--color-primary)]"
							/>
							홈페이지 노출
						</label>
					</div>

					{/* 개인정보 확인 — 의뢰인(제3자) 캡처라 게시 동의와 마스킹을 기록으로 남긴다 */}
					<div className="mb-4 rounded-md border border-border bg-muted px-4 py-3.5">
						<div className="mb-1 font-bold text-[13px] text-foreground">개인정보 확인 (필수)</div>
						<p className="m-0 mb-2.5 text-[12.5px] text-muted-foreground leading-relaxed">
							캡처에서 <b>이름·전화번호·이메일·주소·여권/등록번호·계좌</b>가 가려졌는지 확인해
							주세요. 두 항목을 체크해야 저장됩니다.
						</p>
						<label className="flex cursor-pointer items-start gap-2.5 py-1 text-[13.5px] text-foreground">
							<input
								type="checkbox"
								checked={draft.masked_confirmed ?? false}
								onChange={(e) => set("masked_confirmed", e.target.checked)}
								className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
							/>
							개인식별정보가 가려진 것을 확인했습니다
						</label>
						<label className="flex cursor-pointer items-start gap-2.5 py-1 text-[13.5px] text-foreground">
							<input
								type="checkbox"
								checked={draft.consent_confirmed ?? false}
								onChange={(e) => set("consent_confirmed", e.target.checked)}
								className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
							/>
							의뢰인에게 홈페이지 게시 동의를 받았습니다
						</label>
						<div className="mt-2">
							<Input
								value={draft.consent_note ?? ""}
								onChange={(e) => set("consent_note", e.target.value)}
								placeholder="동의 받은 방법·시점 (예: 2026-07-12 카톡으로 동의)"
								className="h-10"
							/>
						</div>
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
