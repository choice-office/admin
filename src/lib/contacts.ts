import type { ContactStatus } from "@/types/database";

// 상태 메타(라벨·배지 색). 토프 브라운 톤 내에서 명도로 구분.
export const STATUS_META: Record<
	ContactStatus,
	{ label: string; bg: string; fg: string; border?: string }
> = {
	new: { label: "신규", bg: "var(--color-primary)", fg: "#fff" },
	in_progress: { label: "처리중", bg: "var(--color-accent-soft)", fg: "var(--color-primary-dark)" },
	done: { label: "완료", bg: "var(--surface-sunken)", fg: "var(--text-muted)" },
	hold: {
		label: "보류",
		bg: "transparent",
		fg: "var(--text-muted)",
		border: "var(--border-default)",
	},
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
