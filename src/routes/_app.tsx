import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
		<div className="flex h-screen overflow-hidden">
			<AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
			<div className="flex min-w-0 flex-1 flex-col bg-muted">
				<div className="flex-1 overflow-y-auto px-8 pt-5 pb-6">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
