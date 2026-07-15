import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { FileText, MessageSquare, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge, Button, Card } from "@/components/ui/ds";
import { consultLabel } from "@/lib/contacts";
import { formatDateCompact } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/types/database";

export const Route = createFileRoute("/_app/dashboard")({
	component: DashboardPage,
});

type Stats = {
	monthInquiries: number;
	pending: number;
	posts: number;
	reviews: number;
};

type RecentPost = {
	id: string;
	title: string;
	slug: string;
	status: "draft" | "published" | "archived";
	updated_at: string;
};

const POST_STATUS: Record<RecentPost["status"], { label: string; variant: "primary" | "outline" }> =
	{
		published: { label: "발행", variant: "primary" },
		draft: { label: "임시저장", variant: "outline" },
		archived: { label: "보관", variant: "outline" },
	};

function DashboardPage() {
	const navigate = useNavigate();
	const [stats, setStats] = useState<Stats | null>(null);
	const [recent, setRecent] = useState<Contact[]>([]);
	const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);

	useEffect(() => {
		(async () => {
			const monthStart = dayjs().startOf("month").toISOString();
			const [contactsRes, monthRes, pendingRes, postsRes, reviewsRes, postsListRes] =
				await Promise.all([
					supabase.from("contacts").select("*").order("created_at", { ascending: false }).limit(5),
					supabase
						.from("contacts")
						.select("id", { count: "exact", head: true })
						.gte("created_at", monthStart),
					supabase
						.from("contacts")
						.select("id", { count: "exact", head: true })
						.in("status", ["new", "in_progress"]),
					supabase
						.from("blog_posts")
						.select("id", { count: "exact", head: true })
						.eq("status", "published"),
					supabase
						.from("review_images")
						.select("id", { count: "exact", head: true })
						.eq("is_published", true),
					supabase
						.from("blog_posts")
						.select("id,title,slug,status,updated_at")
						.order("updated_at", { ascending: false })
						.limit(6),
				]);
			setRecent((contactsRes.data ?? []) as Contact[]);
			setRecentPosts((postsListRes.data ?? []) as unknown as RecentPost[]);
			setStats({
				monthInquiries: monthRes.count ?? 0,
				pending: pendingRes.count ?? 0,
				posts: postsRes.count ?? 0,
				reviews: reviewsRes.count ?? 0,
			});
		})();
	}, []);

	const cards = [
		{
			label: "이번 달 문의",
			value: stats?.monthInquiries,
			sub: "상담 문의 접수",
			icon: MessageSquare,
		},
		{ label: "처리 대기", value: stats?.pending, sub: "회신이 필요한 건", icon: TrendingUp },
		{ label: "게시 글", value: stats?.posts, sub: "블로그 · 공지", icon: FileText },
		{ label: "노출 후기", value: stats?.reviews, sub: "홈페이지 노출 중", icon: Star },
	];

	return (
		<div>
			<div className="mb-[22px]">
				<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
					안녕하세요, 관리자님
				</h2>
				<p className="m-0 text-[15px] text-muted-foreground">
					{dayjs().format("YYYY년 M월 D일 dddd")} · 사무소 운영 현황을 한눈에 확인하세요.
				</p>
			</div>

			<div className="mb-[22px] grid grid-cols-4 gap-[18px]">
				{cards.map((c) => {
					const Icon = c.icon;
					return (
						<Card key={c.label}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className="mb-2.5 text-muted-foreground text-sm">{c.label}</div>
									<div className="font-bold text-3xl text-foreground leading-none tracking-[-0.02em]">
										{c.value ?? "—"}
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
				<div className="flex min-h-[300px] flex-col overflow-hidden rounded-md border border-border bg-card">
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
					{recent.length === 0 ? (
						<div className="flex flex-1 items-center justify-center px-5 py-12 text-center text-muted-foreground text-sm">
							접수된 상담 문의가 없습니다.
						</div>
					) : (
						recent.map((c) => (
							<button
								type="button"
								key={c.id}
								onClick={() => navigate({ to: "/inquiries" })}
								className="flex w-full items-center gap-3 border-border border-b px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted"
							>
								<div className="min-w-0 flex-1">
									<div className="font-medium text-foreground">{c.name}</div>
									<div className="mt-0.5 truncate text-[13px] text-muted-foreground">
										{consultLabel(c.consult_field)} · {c.phone}
									</div>
								</div>
								<StatusBadge status={c.status} />
								<span className="w-[68px] text-right text-[13px] text-muted-foreground">
									{formatDateCompact(c.created_at)}
								</span>
							</button>
						))
					)}
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

			{/* 최근 작성한 블로그 — 작은 카드 그리드 */}
			<div className="mt-[22px] overflow-hidden rounded-md border border-border bg-card">
				<div className="flex items-center justify-between border-border border-b px-5 py-[18px]">
					<h3 className="m-0 font-bold text-[17px] text-foreground">최근 작성한 블로그</h3>
					<button
						type="button"
						onClick={() => navigate({ to: "/blog" })}
						className="font-medium text-primary text-sm hover:underline"
					>
						전체 보기
					</button>
				</div>
				{recentPosts.length === 0 ? (
					<div className="px-5 py-12 text-center text-muted-foreground text-sm">
						작성된 글이 없습니다.
					</div>
				) : (
					<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
						{recentPosts.map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => navigate({ to: "/blog" })}
								className="flex flex-col gap-2 rounded-md border border-border p-4 text-left transition-colors hover:bg-muted"
							>
								<div className="flex items-center justify-between gap-2">
									<Badge variant={POST_STATUS[p.status].variant}>
										{POST_STATUS[p.status].label}
									</Badge>
									<span className="text-[13px] text-muted-foreground">
										{formatDateCompact(p.updated_at)}
									</span>
								</div>
								<div className="line-clamp-2 font-medium text-foreground leading-snug">
									{p.title || "(제목 없음)"}
								</div>
								<div className="truncate text-[13px] text-muted-foreground">/{p.slug}</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
