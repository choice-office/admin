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
		<div className="max-w-[1180px]">
			<div className="mb-[22px]">
				<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
					안녕하세요, 관리자님
				</h2>
				<p className="m-0 text-[15px] text-muted-foreground">
					{dayjs().format("YYYY년 M월 D일 dddd")} · 사무소 운영 현황을 한눈에 확인하세요.
				</p>
			</div>

			<div className="mb-[22px] grid grid-cols-4 gap-[18px]">
				{STAT_CARDS.map((c) => {
					const Icon = c.icon;
					return (
						<Card key={c.label}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="mb-2.5 text-muted-foreground text-sm">{c.label}</div>
									<div className="font-bold text-3xl text-foreground leading-none tracking-[-0.02em]">
										{c.value}
									</div>
									<div className="mt-[9px] text-[13px] text-muted-foreground">{c.sub}</div>
								</div>
								<div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
									<Icon size={22} strokeWidth={1.75} />
								</div>
							</div>
						</Card>
					);
				})}
			</div>

			<div className="grid grid-cols-[1fr_320px] items-start gap-[18px]">
				<div className="overflow-hidden rounded-md border border-border bg-card">
					<div className="flex items-center justify-between border-border border-b px-5 py-[18px]">
						<h3 className="m-0 font-bold text-[17px] text-foreground">최근 상담 문의</h3>
						<button
							type="button"
							onClick={() => navigate({ to: "/inquiries" })}
							className="font-medium text-primary text-sm hover:underline"
						>
							전체 보기
						</button>
					</div>
					<div className="px-5 py-12 text-center text-muted-foreground text-sm">
						상담 문의 관리에서 접수 내역을 확인하세요.
					</div>
				</div>

				<Card>
					<h3 className="m-0 mb-4 font-bold text-[17px] text-foreground">빠른 작업</h3>
					<div className="flex flex-col gap-2.5">
						<Button variant="primary" onClick={() => navigate({ to: "/blog" })} className="w-full">
							새 글 작성
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/inquiries" })}
							className="w-full"
						>
							상담 문의 보기
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/reviews" })}
							className="w-full"
						>
							후기 관리
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
