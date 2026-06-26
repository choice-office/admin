import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Textarea } from "@/components/ui/ds";
import { consultLabel, STATUS_META, STATUS_ORDER } from "@/lib/contacts";
import { formatDateFull } from "@/lib/format";
import type { Contact, ContactStatus } from "@/types/database";

type Props = {
	contact: Contact;
	onClose: () => void;
	onSave: (id: string, patch: { status: ContactStatus; memo: string | null }) => Promise<void>;
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<div style={{ display: "flex", gap: 12, fontSize: 14, padding: "7px 0" }}>
		<span style={{ flex: "0 0 96px", color: "var(--text-muted)" }}>{label}</span>
		<span style={{ color: "var(--text-heading)", fontWeight: 500 }}>{value}</span>
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
			style={{
				position: "fixed",
				inset: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				zIndex: 100,
			}}
		>
			<button
				type="button"
				aria-label="배경 클릭으로 닫기"
				onClick={onClose}
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(34,29,22,0.45)",
					border: "none",
					padding: 0,
					cursor: "default",
				}}
			/>
			<div
				style={{
					position: "relative",
					zIndex: 1,
					width: "100%",
					maxWidth: 560,
					maxHeight: "88vh",
					overflowY: "auto",
					background: "var(--surface-card)",
					border: "1px solid var(--border-default)",
					borderRadius: "var(--radius-lg)",
					boxShadow: "var(--shadow-md)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 12,
						padding: "20px 24px",
						borderBottom: "1px solid var(--border-default)",
						position: "sticky",
						top: 0,
						background: "var(--surface-card)",
					}}
				>
					<div>
						<h3
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: "var(--text-heading)",
								margin: 0,
								letterSpacing: "-0.02em",
							}}
						>
							상담 상세
						</h3>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
							접수일 {formatDateFull(contact.created_at)}
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="닫기"
						style={{
							width: 32,
							height: 32,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							border: "none",
							background: "transparent",
							borderRadius: "var(--radius)",
							cursor: "pointer",
							color: "var(--text-muted)",
							flexShrink: 0,
						}}
					>
						<X size={20} />
					</button>
				</div>

				<div style={{ padding: "20px 24px" }}>
					<div
						style={{
							borderBottom: "1px solid var(--border-default)",
							paddingBottom: 8,
							marginBottom: 18,
						}}
					>
						<InfoRow label="의뢰인" value={contact.name} />
						<InfoRow label="연락처" value={contact.phone} />
						<InfoRow label="이메일" value={contact.email} />
						<InfoRow label="국적" value={contact.nationality ?? "—"} />
						<InfoRow label="현재 체류자격" value={contact.current_visa ?? "—"} />
						<InfoRow label="업무분야" value={consultLabel(contact.consult_field)} />
					</div>

					<div style={{ marginBottom: 18 }}>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
							문의 내용
						</div>
						<div
							style={{
								background: "var(--surface-subtle)",
								border: "1px solid var(--border-default)",
								borderRadius: "var(--radius)",
								padding: "14px 16px",
								fontSize: 15,
								lineHeight: 1.7,
								color: "var(--text-body)",
								whiteSpace: "pre-wrap",
								minHeight: 64,
							}}
						>
							{contact.message?.trim() || "문의 내용이 없습니다."}
						</div>
					</div>

					<div style={{ marginBottom: 18 }}>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
							처리 상태
						</div>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							{STATUS_ORDER.map((s) => {
								const active = s === status;
								const m = STATUS_META[s];
								return (
									<button
										key={s}
										type="button"
										onClick={() => setStatus(s)}
										style={{
											height: 40,
											padding: "0 16px",
											borderRadius: "var(--radius)",
											fontSize: 14,
											fontWeight: active ? 700 : 500,
											cursor: "pointer",
											background: active ? "var(--color-accent-soft)" : "var(--surface-card)",
											color: active ? "var(--color-primary-dark)" : "var(--text-body)",
											border: `1px solid ${active ? "var(--color-primary-light)" : "var(--border-default)"}`,
										}}
									>
										{m.label}
									</button>
								);
							})}
						</div>
					</div>

					<div style={{ marginBottom: 22 }}>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
							처리 메모
						</div>
						<Textarea
							rows={4}
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							placeholder="내부 처리 메모를 남겨 주세요. (의뢰인에게 노출되지 않습니다)"
						/>
					</div>

					<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
