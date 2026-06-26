import type { ContactStatus } from "@/types/database";

// 상태 메타(라벨·배지 Tailwind 클래스). 토프 브라운 톤 내에서 명도로 구분.
export const STATUS_META: Record<ContactStatus, { label: string; badge: string }> = {
	new: { label: "신규", badge: "bg-primary text-primary-foreground" },
	in_progress: { label: "처리중", badge: "bg-accent text-accent-foreground" },
	done: { label: "완료", badge: "bg-[var(--surface-sunken)] text-muted-foreground" },
	hold: { label: "보류", badge: "border border-border text-muted-foreground" },
};

export const STATUS_ORDER: ContactStatus[] = ["new", "in_progress", "done", "hold"];

// 홈페이지 상담 폼의 consult_field 코드 → 라벨
export const CONSULT_LABELS: Record<string, string> = {
	e6: "연예인 비자(E-6)",
	e7: "전문직 비자(E-7)",
	f4: "거소증(F-4)",
	f5: "영주권(F-5)",
	f6: "결혼비자(F-6)",
	nat: "국적회복",
	etc: "기타",
};

export const consultLabel = (code: string | null): string =>
	code ? (CONSULT_LABELS[code] ?? code) : "—";
