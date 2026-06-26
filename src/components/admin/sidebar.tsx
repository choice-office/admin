import { Link } from "@tanstack/react-router";
import { Inbox, Mail, X } from "lucide-react";

type SidebarContentProps = { onClose?: () => void };

export const SidebarContent = ({ onClose }: SidebarContentProps) => {
	return (
		<div className="flex h-full flex-col">
			{/* 로고 */}
			<div className="flex items-center justify-between px-4 py-4">
				<div className="flex items-center gap-2.5">
					<div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800">
						<Inbox className="h-4 w-4 text-white" />
					</div>
					<span className="font-semibold text-sm text-white tracking-tight">Admin</span>
				</div>
				{onClose && (
					<button
						type="button"
						aria-label="메뉴 닫기"
						onClick={onClose}
						className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			<div className="border-zinc-800 border-t" />

			{/* 네비게이션 */}
			<nav className="flex-1 px-2 pt-3">
				<p className="mb-1 px-2 font-semibold text-[10px] text-zinc-600 uppercase tracking-widest">
					메뉴
				</p>
				<Link
					to="/dashboard"
					onClick={onClose}
					className="flex items-center gap-2.5 border-zinc-400 border-l-2 bg-zinc-800 px-3 py-2 font-medium text-sm text-white"
				>
					<Mail className="h-4 w-4" />
					문의 관리
				</Link>
			</nav>

			{/* 하단 */}
			<div className="border-zinc-800 border-t px-4 py-3">
				<p className="font-medium text-[10px] text-zinc-600">ADMIN BOILERPLATE v0.1.0</p>
			</div>
		</div>
	);
};
