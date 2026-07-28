import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Menu } from "lucide-react";
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
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden">
			<AppSidebar
				collapsed={collapsed}
				onToggle={() => setCollapsed((v) => !v)}
				mobileOpen={mobileOpen}
				onMobileClose={() => setMobileOpen(false)}
			/>
			<div className="flex min-w-0 flex-1 flex-col bg-muted">
				{/* 모바일 상단바 — 햄버거로 드로어 열기(데스크탑 숨김) */}
				<div className="flex h-14 flex-shrink-0 items-center gap-3 border-border border-b bg-card px-4 md:hidden">
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						aria-label="메뉴 열기"
						className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<Menu size={22} />
					</button>
					<span className="font-bold text-base text-foreground tracking-[-0.02em]">
						초이스 행정사
					</span>
				</div>
				<div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 md:px-6 md:pt-5">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
