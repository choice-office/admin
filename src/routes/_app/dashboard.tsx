import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { FileText, MessageSquare, Star, TrendingUp } from "lucide-react";
import { Button, Card } from "@/components/ui/ds";

export const Route = createFileRoute("/_app/dashboard")({
	component: DashboardPage,
});

const STAT_CARDS = [
	{ label: "이번 달 문의", value: "—", sub: "상담 문의 접수", icon: MessageSquare },
	{ label: "처리 대기", value: "—", sub: "회신이 필요한 건", icon: TrendingUp },
	{ label: "게시 글", value: "—", sub: "블로그 · 공지", icon: FileText },
	{ label: "노출 후기", value: "—", sub: "홈페이지 노출 중", icon: Star },
];

function DashboardPage() {
	const navigate = useNavigate();

	return (
		<div style={{ maxWidth: 1180 }}>
			<div style={{ marginBottom: 22 }}>
				<h2
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "var(--text-heading)",
						margin: "0 0 6px",
						letterSpacing: "-0.02em",
					}}
				>
					안녕하세요, 관리자님
				</h2>
				<p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
					{dayjs().format("YYYY년 M월 D일 dddd")} · 사무소 운영 현황을 한눈에 확인하세요.
				</p>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 18,
					marginBottom: 22,
				}}
			>
				{STAT_CARDS.map((c) => {
					const Icon = c.icon;
					return (
						<Card key={c.label}>
							<div
								style={{
									display: "flex",
									alignItems: "flex-start",
									justifyContent: "space-between",
									gap: 12,
								}}
							>
								<div>
									<div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 10 }}>
										{c.label}
									</div>
									<div
										style={{
											fontSize: 30,
											fontWeight: 700,
											color: "var(--text-heading)",
											letterSpacing: "-0.02em",
											lineHeight: 1,
										}}
									>
										{c.value}
									</div>
									<div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 9 }}>
										{c.sub}
									</div>
								</div>
								<div
									style={{
										width: 44,
										height: 44,
										borderRadius: "var(--radius)",
										background: "var(--color-accent-soft)",
										color: "var(--color-primary-dark)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
									}}
								>
									<Icon size={22} strokeWidth={1.75} />
								</div>
							</div>
						</Card>
					);
				})}
			</div>

			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}
			>
				<div
					style={{
						background: "var(--surface-card)",
						border: "1px solid var(--border-default)",
						borderRadius: "var(--radius)",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "18px 20px",
							borderBottom: "1px solid var(--border-default)",
						}}
					>
						<h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
							최근 상담 문의
						</h3>
						<button
							type="button"
							onClick={() => navigate({ to: "/inquiries" })}
							style={{
								fontSize: 14,
								color: "var(--color-primary)",
								fontWeight: 500,
								border: "none",
								background: "transparent",
								cursor: "pointer",
							}}
						>
							전체 보기
						</button>
					</div>
					<div
						style={{
							padding: "48px 20px",
							textAlign: "center",
							color: "var(--text-muted)",
							fontSize: 14,
						}}
					>
						상담 문의 관리에서 접수 내역을 확인하세요.
					</div>
				</div>

				<Card>
					<h3
						style={{
							fontSize: 17,
							fontWeight: 700,
							color: "var(--text-heading)",
							margin: "0 0 16px",
						}}
					>
						빠른 작업
					</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<Button
							variant="primary"
							onClick={() => navigate({ to: "/blog" })}
							style={{ width: "100%" }}
						>
							새 글 작성
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/inquiries" })}
							style={{ width: "100%" }}
						>
							상담 문의 보기
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/reviews" })}
							style={{ width: "100%" }}
						>
							후기 관리
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
