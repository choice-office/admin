import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	FileText,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	PanelLeft,
	PanelLeftClose,
	Settings,
	Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

export const NAV_ITEMS: NavItem[] = [
	{ to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
	{ to: "/inquiries", label: "상담 문의", icon: MessageSquare },
	{ to: "/reviews", label: "후기 관리", icon: Star },
	{ to: "/blog", label: "블로그 · 공지", icon: FileText },
	{ to: "/settings", label: "설정", icon: Settings },
];

type AppSidebarProps = { collapsed: boolean; onToggle: () => void };

export const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	};

	return (
		<aside
			className={cn(
				"flex flex-shrink-0 flex-col border-border border-r bg-card transition-[width] duration-200",
				collapsed ? "w-[74px]" : "w-60",
			)}
		>
			<div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-border border-b px-4">
				{!collapsed && (
					<span className="overflow-hidden whitespace-nowrap font-bold text-base text-foreground tracking-[-0.02em]">
						초이스 행정사
					</span>
				)}
				<button
					type="button"
					onClick={onToggle}
					title="메뉴 접기/펼치기"
					className={cn(
						"flex h-[34px] w-[34px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted",
						collapsed ? "mx-auto" : "ml-auto",
					)}
				>
					{collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
				</button>
			</div>

			<nav className="flex flex-1 flex-col gap-[3px] overflow-y-auto p-3">
				{NAV_ITEMS.map((item) => {
					const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
					const Icon = item.icon;
					return (
						<Link
							key={item.to}
							to={item.to}
							title={item.label}
							className={cn(
								"flex h-11 items-center gap-3 whitespace-nowrap rounded-md text-[15px] transition-colors",
								collapsed ? "justify-center px-0" : "justify-start px-3.5",
								active
									? "bg-accent font-bold text-accent-foreground"
									: "font-medium text-[var(--text-body)] hover:bg-muted",
							)}
						>
							<Icon size={20} strokeWidth={1.75} className="flex-shrink-0" />
							{!collapsed && <span>{item.label}</span>}
						</Link>
					);
				})}
			</nav>

			{/* 계정 — 헤더 제거 후 여기로 접어넣음(로그아웃 포함) */}
			<div className="border-border border-t p-3">
				<div className={cn("flex items-center gap-2.5", collapsed && "flex-col")}>
					<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent font-bold text-[15px] text-accent-foreground">
						관
					</span>
					{!collapsed && (
						<div className="min-w-0 flex-1">
							<div className="truncate font-medium text-foreground text-sm">관리자</div>
							<div className="truncate text-[12px] text-muted-foreground">admin@kvisa1345.com</div>
						</div>
					)}
					<button
						type="button"
						onClick={handleLogout}
						title="로그아웃"
						className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<LogOut size={18} />
					</button>
				</div>
			</div>
		</aside>
	);
};
