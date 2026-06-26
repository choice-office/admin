import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui/ds";
import type { Review, ReviewInsert } from "@/types/database";

type Props = {
	review: Review | null; // null이면 새 후기 작성
	onClose: () => void;
	onSubmit: (payload: ReviewInsert) => Promise<void>;
};

const emptyDraft: ReviewInsert = {
	tag: "",
	country: "",
	initial: "",
	flag: "",
	title: "",
	body: "",
	is_published: true,
	sort_order: 0,
};

export const ReviewFormModal = ({ review, onClose, onSubmit }: Props) => {
	const [draft, setDraft] = useState<ReviewInsert>(
		review
			? {
					tag: review.tag,
					country: review.country,
					initial: review.initial,
					flag: review.flag,
					title: review.title,
					body: review.body,
					is_published: review.is_published,
					sort_order: review.sort_order,
				}
			: emptyDraft,
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const set = <K extends keyof ReviewInsert>(key: K, value: ReviewInsert[K]) =>
		setDraft((prev) => ({ ...prev, [key]: value }));

	const handleSave = async () => {
		if (!draft.title?.trim() || !draft.body?.trim()) {
			setError("제목과 후기 내용을 입력해 주세요.");
			return;
		}
		setError(null);
		setSaving(true);
		await onSubmit({
			...draft,
			tag: draft.tag?.trim() ?? "",
			country: draft.country?.trim() ?? "",
			initial: draft.initial?.trim() ?? "",
			flag: draft.flag?.trim() ?? "",
			title: draft.title.trim(),
			body: draft.body.trim(),
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
					<div className="mb-[18px] grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="rv-tag">업무분야</Label>
							<Input
								id="rv-tag"
								value={draft.tag ?? ""}
								onChange={(e) => set("tag", e.target.value)}
								placeholder="거소증 F-4"
							/>
						</div>
						<div>
							<Label htmlFor="rv-country">국적</Label>
							<Input
								id="rv-country"
								value={draft.country ?? ""}
								onChange={(e) => set("country", e.target.value)}
								placeholder="미국"
							/>
						</div>
						<div>
							<Label htmlFor="rv-initial">이니셜</Label>
							<Input
								id="rv-initial"
								value={draft.initial ?? ""}
								onChange={(e) => set("initial", e.target.value)}
								placeholder="J"
								maxLength={4}
							/>
						</div>
						<div>
							<Label htmlFor="rv-flag">국기 이모지</Label>
							<Input
								id="rv-flag"
								value={draft.flag ?? ""}
								onChange={(e) => set("flag", e.target.value)}
								placeholder="🇺🇸"
								maxLength={8}
							/>
						</div>
					</div>

					<div className="mb-[18px]">
						<Label htmlFor="rv-title">제목</Label>
						<Input
							id="rv-title"
							value={draft.title ?? ""}
							onChange={(e) => set("title", e.target.value)}
							placeholder="후기 제목"
						/>
					</div>

					<div className="mb-[18px]">
						<Label htmlFor="rv-body">후기 내용</Label>
						<Textarea
							id="rv-body"
							rows={5}
							value={draft.body ?? ""}
							onChange={(e) => set("body", e.target.value)}
							placeholder="의뢰인 후기 내용을 입력해 주세요."
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
						<Button variant="primary" onClick={handleSave} disabled={saving}>
							{saving ? "저장 중…" : review ? "변경사항 저장" : "후기 추가"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
