import { Card } from "@/components/ui/ds";

// 단계적 구현용 임시 화면. 각 화면 구현 시 교체된다.
export const ScreenPlaceholder = ({ title, desc }: { title: string; desc: string }) => (
	<div style={{ maxWidth: 1180 }}>
		<div style={{ marginBottom: 20 }}>
			<h2
				style={{
					fontSize: 24,
					fontWeight: 700,
					color: "var(--text-heading)",
					margin: "0 0 6px",
					letterSpacing: "-0.02em",
				}}
			>
				{title}
			</h2>
			<p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>{desc}</p>
		</div>
		<Card padding="48px">
			<div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 15 }}>
				화면 준비 중입니다.
			</div>
		</Card>
	</div>
);
