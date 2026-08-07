import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	FileText,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	MonitorPlay,
	PanelLeft,
	PanelLeftClose,
	Settings,
	Star,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

export const NAV_ITEMS: NavItem[] = [
	{ to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
	{ to: "/inquiries", label: "상담 문의", icon: MessageSquare },
	{ to: "/home", label: "홈 노출", icon: MonitorPlay },
	{ to: "/reviews", label: "후기 관리", icon: Star },
	{ to: "/blog", label: "블로그", icon: FileText },
	{ to: "/settings", label: "설정", icon: Settings },
];

// collapsed/onToggle: 데스크탑(md+) 접기. mobileOpen/onMobileClose: 모바일 드로어 열림 제어.
type AppSidebarProps = {
	collapsed: boolean;
	onToggle: () => void;
	mobileOpen: boolean;
	onMobileClose: () => void;
};

export const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const { name, email } = useCurrentUser();

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	};

	return (
		<>
			{/* 모바일 드로어 배경(오버레이) — 열렸을 때만 */}
			{mobileOpen && (
				<button
					type="button"
					aria-label="메뉴 닫기"
					onClick={onMobileClose}
					className="fixed inset-0 z-40 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0 md:hidden"
				/>
			)}

			<aside
				className={cn(
					// 모바일: 고정 드로어(슬라이드). 데스크탑(md+): 정적 컬럼(폭 애니메이션).
					"fixed inset-y-0 left-0 z-50 flex w-60 flex-shrink-0 flex-col border-border border-r bg-card transition-transform duration-200",
					"md:static md:z-auto md:translate-x-0 md:transition-[width]",
					mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
					collapsed ? "md:w-[74px]" : "md:w-60",
				)}
			>
				<div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-border border-b px-4">
					<span
						className={cn(
							"overflow-hidden whitespace-nowrap font-bold text-base text-foreground tracking-[-0.02em]",
							collapsed && "md:hidden",
						)}
					>
						초이스 행정사
					</span>
					{/* 데스크탑 접기 토글(모바일 숨김) */}
					<button
						type="button"
						onClick={onToggle}
						title="메뉴 접기/펼치기"
						className={cn(
							"hidden h-[34px] w-[34px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:flex",
							collapsed ? "md:mx-auto" : "md:ml-auto",
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
								onClick={onMobileClose}
								className={cn(
									"flex h-11 items-center gap-3 whitespace-nowrap rounded-md px-3.5 text-[15px] transition-colors",
									collapsed && "md:justify-center md:px-0",
									active
										? "bg-accent font-bold text-accent-foreground"
										: "font-medium text-[var(--text-body)] hover:bg-muted",
								)}
							>
								<Icon size={20} strokeWidth={1.75} className="flex-shrink-0" />
								<span className={cn(collapsed && "md:hidden")}>{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* 계정 — 헤더 제거 후 여기로 접어넣음(로그아웃 포함) */}
				<div className="border-border border-t p-3">
					<div className={cn("flex items-center gap-2.5", collapsed && "md:flex-col")}>
						<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent font-bold text-[15px] text-accent-foreground">
							{name.slice(0, 1)}
						</span>
						<div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
							<div className="truncate font-medium text-foreground text-sm">{name}</div>
							<div className="truncate text-[12px] text-muted-foreground">{email}</div>
						</div>
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
		</>
	);
};
