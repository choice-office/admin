import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { InboxIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { isMockMode, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		if (isMockMode) return;
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (session) throw redirect({ to: "/dashboard" });
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

		if (authError) {
			setError("이메일 또는 비밀번호가 올바르지 않습니다.");
			setIsLoading(false);
			return;
		}

		setIsLoading(false);
		navigate({ to: "/dashboard" });
	};

	return (
		<div className="flex min-h-screen">
			{/* 좌측 브랜드 패널 (데스크탑) */}
			<div className="hidden flex-col justify-between border-zinc-800 border-r bg-zinc-950 p-10 lg:flex lg:w-2/5 xl:w-1/3">
				{/* 로고 */}
				<div className="flex items-center gap-2.5">
					<div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800">
						<InboxIcon className="h-4 w-4 text-white" />
					</div>
					<span className="font-semibold text-sm text-white">관리자</span>
				</div>

				{/* 중앙 문구 */}
				<div>
					<h2 className="font-bold text-2xl text-white leading-snug">
						문의를 한눈에
						<br />
						관리하세요.
					</h2>
					<p className="mt-3 text-sm text-zinc-500 leading-relaxed">
						접수된 문의를 확인하고
						<br />
						엑셀로 간편하게 내보낼 수 있습니다.
					</p>
				</div>

				{/* 하단 */}
				<p className="text-xs text-zinc-700">Admin Boilerplate v0.1</p>
			</div>

			{/* 우측 로그인 폼 */}
			<div className="flex flex-1 flex-col items-center justify-center bg-zinc-100 px-4 py-12">
				{/* 모바일 로고 */}
				<div className="mb-8 flex items-center gap-2 lg:hidden">
					<div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900">
						<InboxIcon className="h-4 w-4 text-white" />
					</div>
					<span className="font-semibold text-zinc-900">관리자</span>
				</div>

				<div className="w-full max-w-sm">
					{/* 헤더 */}
					<div className="mb-5">
						<h1 className="font-semibold text-lg text-zinc-900">로그인</h1>
						<p className="mt-0.5 text-sm text-zinc-500">관리자 계정으로 로그인하세요</p>
					</div>

					{/* 폼 카드 */}
					<div className="rounded-md border border-zinc-200 bg-white p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<label htmlFor="email" className="font-medium text-sm text-zinc-700">
									이메일
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@example.com"
									required
									autoComplete="email"
									className={cn(
										"w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none",
										"transition-colors placeholder:text-zinc-400",
										"focus:border-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-400/30",
									)}
								/>
							</div>

							<div className="space-y-1.5">
								<label htmlFor="password" className="font-medium text-sm text-zinc-700">
									비밀번호
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									autoComplete="current-password"
									className={cn(
										"w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none",
										"transition-colors placeholder:text-zinc-400",
										"focus:border-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-400/30",
									)}
								/>
							</div>

							{error && (
								<div className="rounded border border-red-200 bg-red-50 px-3 py-2">
									<p className="text-red-600 text-sm">{error}</p>
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className={cn(
									"w-full rounded bg-zinc-900 px-4 py-2 font-medium text-sm text-white",
									"transition-colors hover:bg-zinc-700",
									"focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2",
									"disabled:cursor-not-allowed disabled:opacity-50",
								)}
							>
								{isLoading ? (
									<span className="flex items-center justify-center gap-2">
										<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
										로그인 중...
									</span>
								) : (
									"로그인"
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
