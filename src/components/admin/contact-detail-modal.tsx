import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { formatDateFull } from "@/lib/format";
import type { Contact } from "@/types/database";

type ContactDetailModalProps = {
	contact: Contact | null;
	onClose: () => void;
};

// 단순 필드 (이름, 연락처, 이메일 등) — 2컬럼 그리드로 표시
const shortFields = CONTACT_FIELDS.filter((f) => !f.isLong);
// 긴 텍스트 필드 (문의 내용 등) — 전체 너비 + 배경 처리
const longFields = CONTACT_FIELDS.filter((f) => f.isLong);

// 포커스 가능한 요소 선택자
const FOCUSABLE = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(", ");

export const ContactDetailModal = ({ contact, onClose }: ContactDetailModalProps) => {
	const dialogRef = useRef<HTMLDivElement>(null);

	// ESC 키 닫기 + 배경 스크롤 잠금 + 포커스 트랩
	useEffect(() => {
		if (!contact) return;

		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		// 모달 열릴 때 첫 번째 포커스 가능 요소로 이동
		const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
		firstFocusable?.focus();

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}
			// Tab 트랩: 모달 내부에서만 포커스 순환
			if (e.key === "Tab" && dialogRef.current) {
				const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (e.shiftKey) {
					if (document.activeElement === first) {
						e.preventDefault();
						last.focus();
					}
				} else {
					if (document.activeElement === last) {
						e.preventDefault();
						first.focus();
					}
				}
			}
		};

		document.addEventListener("keydown", handleKey);
		return () => {
			document.body.style.overflow = prev;
			document.removeEventListener("keydown", handleKey);
		};
	}, [contact, onClose]);

	if (!contact) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* 배경 오버레이 */}
			<button
				type="button"
				aria-label="모달 닫기"
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			/>

			{/* 모달 카드 */}
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="문의 상세"
				className="relative z-10 flex w-full max-w-lg flex-col rounded-md border border-zinc-200 bg-white"
			>
				{/* 헤더 */}
				<div className="flex items-center justify-between border-zinc-200 border-b px-5 py-3.5">
					<h2 className="font-semibold text-sm text-zinc-900">문의 상세</h2>
					<button
						type="button"
						aria-label="모달 닫기"
						onClick={onClose}
						className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* 본문 */}
				<div className="space-y-4 px-5 py-4">
					{/* 단순 필드 — 2컬럼 그리드 */}
					{shortFields.length > 0 && (
						<div className="grid grid-cols-2 gap-x-6 gap-y-4">
							{shortFields.map((field) => (
								<div key={field.key}>
									<p className="mb-0.5 text-xs text-zinc-500">{field.label}</p>
									<p className="font-medium text-sm text-zinc-900">
										{String(contact[field.key as keyof Contact] ?? "—")}
									</p>
								</div>
							))}
						</div>
					)}

					{/* 접수일시 (시스템 필드 — 항상 표시) */}
					<div>
						<p className="mb-0.5 text-xs text-zinc-500">접수일시</p>
						<p className="text-sm text-zinc-700">{formatDateFull(contact.created_at)}</p>
					</div>

					{/* 긴 텍스트 필드 (문의 내용 등) */}
					{longFields.map((field) => (
						<div key={field.key} className="rounded border border-zinc-200 bg-zinc-50 px-4 py-3">
							<p className="mb-2 text-xs text-zinc-500">{field.label}</p>
							<p className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed">
								{String(contact[field.key as keyof Contact] ?? "")}
							</p>
						</div>
					))}
				</div>

				{/* 푸터 */}
				<div className="flex justify-end border-zinc-200 border-t px-5 py-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
					>
						닫기
					</button>
				</div>
			</div>
		</div>
	);
};
