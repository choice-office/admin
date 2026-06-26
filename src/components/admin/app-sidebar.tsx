import { Link, useRouterState } from "@tanstack/react-router";
import {
	FileText,
	LayoutDashboard,
	MessageSquare,
	PanelLeft,
	PanelLeftClose,
	Settings,
	Star,
} from "lucide-react";
import type { CSSProperties } from "react";

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

	const asideStyle: CSSProperties = {
		width: collapsed ? 74 : 240,
		flexShrink: 0,
		display: "flex",
		flexDirection: "column",
		background: "var(--surface-card)",
		borderRight: "1px solid var(--border-default)",
		transition: "width 0.2s ease",
	};

	return (
		<aside style={asideStyle}>
			<div
				style={{
					height: 64,
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "0 16px",
					borderBottom: "1px solid var(--border-default)",
					flexShrink: 0,
				}}
			>
				{!collapsed && (
					<span
						style={{
							fontSize: 16,
							fontWeight: 700,
							letterSpacing: "-0.02em",
							color: "var(--text-heading)",
							whiteSpace: "nowrap",
							overflow: "hidden",
						}}
					>
						초이스 행정사
					</span>
				)}
				<button
					type="button"
					onClick={onToggle}
					title="메뉴 접기/펼치기"
					style={{
						marginLeft: collapsed ? 0 : "auto",
						width: 34,
						height: 34,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "none",
						background: "transparent",
						borderRadius: "var(--radius)",
						cursor: "pointer",
						color: "var(--text-muted)",
					}}
				>
					{collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
				</button>
			</div>

			<nav
				style={{
					flex: 1,
					overflowY: "auto",
					padding: 12,
					display: "flex",
					flexDirection: "column",
					gap: 3,
				}}
			>
				{NAV_ITEMS.map((item) => {
					const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
					const Icon = item.icon;
					return (
						<Link
							key={item.to}
							to={item.to}
							title={item.label}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								height: 44,
								padding: collapsed ? 0 : "0 14px",
								justifyContent: collapsed ? "center" : "flex-start",
								borderRadius: "var(--radius)",
								fontSize: 15,
								fontWeight: active ? 700 : 500,
								color: active ? "var(--color-primary-dark)" : "var(--text-body)",
								background: active ? "var(--color-accent-soft)" : "transparent",
								textDecoration: "none",
								whiteSpace: "nowrap",
								transition: "background 0.15s ease, color 0.15s ease",
							}}
						>
							<Icon size={20} strokeWidth={1.75} style={{ flexShrink: 0 }} />
							{!collapsed && <span>{item.label}</span>}
						</Link>
					);
				})}
			</nav>

			{!collapsed && (
				<div
					style={{
						padding: "14px 18px",
						borderTop: "1px solid var(--border-default)",
						fontSize: 12,
						color: "var(--text-muted)",
						whiteSpace: "nowrap",
					}}
				>
					초이스 행정사 어드민 v1.0
				</div>
			)}
		</aside>
	);
};
