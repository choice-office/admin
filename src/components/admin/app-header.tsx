import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NAV_ITEMS } from "./app-sidebar";

const titleFor = (pathname: string): string => {
	const item = NAV_ITEMS.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`));
	return item?.label ?? "관리자";
};

export const AppHeader = () => {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	};

	return (
		<header
			style={{
				height: 64,
				background: "var(--surface-card)",
				borderBottom: "1px solid var(--border-default)",
				display: "flex",
				alignItems: "center",
				gap: 20,
				padding: "0 26px",
				flexShrink: 0,
				zIndex: 5,
			}}
		>
			<div
				style={{
					fontSize: 18,
					fontWeight: 700,
					color: "var(--text-heading)",
					letterSpacing: "-0.02em",
					whiteSpace: "nowrap",
				}}
			>
				{titleFor(pathname)}
			</div>
			<div style={{ flex: 1 }} />

			<button
				type="button"
				title="알림"
				style={{
					position: "relative",
					width: 42,
					height: 42,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					border: "1px solid var(--border-default)",
					background: "var(--surface-card)",
					borderRadius: "var(--radius)",
					cursor: "pointer",
					color: "var(--text-body)",
				}}
			>
				<Bell size={19} strokeWidth={1.75} />
			</button>

			<div style={{ width: 1, height: 30, background: "var(--border-default)" }} />

			<div style={{ position: "relative" }} ref={menuRef}>
				<button
					type="button"
					onClick={() => setMenuOpen((v) => !v)}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						border: "none",
						background: "transparent",
						cursor: "pointer",
						padding: "5px 6px",
						borderRadius: "var(--radius)",
					}}
				>
					<span
						style={{
							width: 36,
							height: 36,
							borderRadius: "50%",
							background: "var(--color-accent-soft)",
							color: "var(--color-primary-dark)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontWeight: 700,
							fontSize: 15,
						}}
					>
						관
					</span>
					<span
						style={{
							fontSize: 14,
							fontWeight: 500,
							color: "var(--text-heading)",
							whiteSpace: "nowrap",
						}}
					>
						관리자
					</span>
					<ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
				</button>

				{menuOpen && (
					<div
						style={{
							position: "absolute",
							top: 54,
							right: 0,
							width: 210,
							background: "var(--surface-card)",
							border: "1px solid var(--border-default)",
							borderRadius: "var(--radius)",
							boxShadow: "var(--shadow-md)",
							padding: 6,
							zIndex: 20,
						}}
					>
						<div
							style={{
								padding: "10px 12px 12px",
								borderBottom: "1px solid var(--border-default)",
								marginBottom: 6,
							}}
						>
							<div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-heading)" }}>
								관리자
							</div>
							<div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
								admin@kvisa1345.com
							</div>
						</div>
						<button
							type="button"
							onClick={() => {
								setMenuOpen(false);
								navigate({ to: "/settings" });
							}}
							style={menuRowStyle}
						>
							<Settings size={16} style={{ color: "var(--text-muted)" }} /> 설정
						</button>
						<button type="button" onClick={handleLogout} style={menuRowStyle}>
							<LogOut size={16} style={{ color: "var(--text-muted)" }} /> 로그아웃
						</button>
					</div>
				)}
			</div>
		</header>
	);
};

const menuRowStyle = {
	display: "flex",
	alignItems: "center",
	gap: 10,
	width: "100%",
	padding: "10px 12px",
	border: "none",
	background: "transparent",
	borderRadius: "var(--radius)",
	cursor: "pointer",
	fontSize: 14,
	color: "var(--text-body)",
	textAlign: "left" as const,
};
