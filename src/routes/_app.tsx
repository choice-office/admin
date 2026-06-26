import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/admin/app-header";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { isMockMode, supabase } from "@/lib/supabase";

// 인증된 영역 레이아웃(pathless) — 사이드바 + 상단바 + Outlet. 미인증 시 /login.
export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		if (isMockMode) return;
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) throw redirect({ to: "/login" });
	},
	component: AppLayout,
});

function AppLayout() {
	const [collapsed, setCollapsed] = useState(false);
	return (
		<div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
			<AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
					background: "var(--surface-subtle)",
				}}
			>
				<AppHeader />
				<div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 48px" }}>
					<Outlet />
				</div>
			</div>
		</div>
	);
}
