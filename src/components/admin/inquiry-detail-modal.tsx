import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Textarea } from "@/components/ui/ds";
import { consultLabel, STATUS_META, STATUS_ORDER } from "@/lib/contacts";
import { formatDateFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contact, ContactStatus } from "@/types/database";

type Props = {
	contact: Contact;
	onClose: () => void;
	onSave: (id: string, patch: { status: ContactStatus; memo: string | null }) => Promise<void>;
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex gap-3 py-[7px] text-sm">
		<span className="flex-[0_0_96px] text-muted-foreground">{label}</span>
		<span className="font-medium text-foreground">{value}</span>
	</div>
);

export const InquiryDetailModal = ({ contact, onClose, onSave }: Props) => {
	const [status, setStatus] = useState<ContactStatus>(contact.status);
	const [memo, setMemo] = useState(contact.memo ?? "");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleSave = async () => {
		setSaving(true);
		await onSave(contact.id, { status, memo: memo.trim() || null });
		setSaving(false);
		onClose();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="상담 상세"
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
					<div>
						<h3 className="m-0 font-bold text-foreground text-xl tracking-[-0.02em]">상담 상세</h3>
						<div className="mt-1 text-[13px] text-muted-foreground">
							접수일 {formatDateFull(contact.created_at)}
						</div>
					</div>
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
					<div className="mb-[18px] border-border border-b pb-2">
						<InfoRow label="의뢰인" value={contact.name} />
						<InfoRow label="연락처" value={contact.phone} />
						<InfoRow label="이메일" value={contact.email} />
						<InfoRow label="국적" value={contact.nationality ?? "—"} />
						<InfoRow label="현재 체류자격" value={contact.current_visa ?? "—"} />
						<InfoRow label="업무분야" value={consultLabel(contact.consult_field)} />
					</div>

					<div className="mb-[18px]">
						<div className="mb-2 text-[13px] text-muted-foreground">문의 내용</div>
						<div className="min-h-16 whitespace-pre-wrap rounded-md border border-border bg-muted px-4 py-3.5 text-[15px] text-[var(--text-body)] leading-relaxed">
							{contact.message?.trim() || "문의 내용이 없습니다."}
						</div>
					</div>

					<div className="mb-[18px]">
						<div className="mb-2 text-[13px] text-muted-foreground">처리 상태</div>
						<div className="flex flex-wrap gap-2">
							{STATUS_ORDER.map((s) => {
								const active = s === status;
								return (
									<button
										key={s}
										type="button"
										onClick={() => setStatus(s)}
										className={cn(
											"h-10 rounded-md border px-4 text-sm transition-colors",
											active
												? "border-[var(--color-primary-light)] bg-accent font-bold text-accent-foreground"
												: "border-border bg-card font-medium text-[var(--text-body)] hover:bg-muted",
										)}
									>
										{STATUS_META[s].label}
									</button>
								);
							})}
						</div>
					</div>

					<div className="mb-[22px]">
						<div className="mb-2 text-[13px] text-muted-foreground">처리 메모</div>
						<Textarea
							rows={4}
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							placeholder="내부 처리 메모를 남겨 주세요. (의뢰인에게 노출되지 않습니다)"
						/>
					</div>

					<div className="flex justify-end gap-2.5">
						<Button variant="outline" onClick={onClose}>
							닫기
						</Button>
						<Button variant="primary" onClick={handleSave} disabled={saving}>
							{saving ? "저장 중…" : "변경사항 저장"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
