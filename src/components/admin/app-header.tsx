import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NAV_ITEMS } from "./app-sidebar";

const titleFor = (pathname: string): string => {
	const item = NAV_ITEMS.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`));
	return item?.label ?? "관리자";
};

const MENU_ROW =
	"flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-[var(--text-body)] hover:bg-muted";

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
		<header className="z-[5] flex h-16 flex-shrink-0 items-center gap-5 border-border border-b bg-card px-[26px]">
			<div className="whitespace-nowrap font-bold text-foreground text-lg tracking-[-0.02em]">
				{titleFor(pathname)}
			</div>
			<div className="flex-1" />

			<button
				type="button"
				title="알림"
				className="relative flex h-[42px] w-[42px] items-center justify-center rounded-md border border-border bg-card text-[var(--text-body)] hover:bg-muted"
			>
				<Bell size={19} strokeWidth={1.75} />
			</button>

			<div className="h-[30px] w-px bg-border" />

			<div className="relative" ref={menuRef}>
				<button
					type="button"
					onClick={() => setMenuOpen((v) => !v)}
					className="flex items-center gap-2.5 rounded-md px-1.5 py-[5px] hover:bg-muted"
				>
					<span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-[15px] text-accent-foreground">
						관
					</span>
					<span className="whitespace-nowrap font-medium text-foreground text-sm">관리자</span>
					<ChevronDown size={16} className="text-muted-foreground" />
				</button>

				{menuOpen && (
					<div className="absolute top-[54px] right-0 z-20 w-[210px] rounded-md border border-border bg-card p-1.5 shadow-[var(--shadow-md)]">
						<div className="mb-1.5 border-border border-b px-3 pt-2.5 pb-3">
							<div className="font-semibold text-foreground text-sm">관리자</div>
							<div className="mt-0.5 text-[13px] text-muted-foreground">admin@kvisa1345.com</div>
						</div>
						<button
							type="button"
							onClick={() => {
								setMenuOpen(false);
								navigate({ to: "/settings" });
							}}
							className={MENU_ROW}
						>
							<Settings size={16} className="text-muted-foreground" /> 설정
						</button>
						<button type="button" onClick={handleLogout} className={MENU_ROW}>
							<LogOut size={16} className="text-muted-foreground" /> 로그아웃
						</button>
					</div>
				)}
			</div>
		</header>
	);
};
