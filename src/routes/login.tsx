import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui/ds";
// 관리자 아이디 → 로그인 이메일 변환(한글 아이디 지원). 매핑은 @/lib/admin-user 단일 출처 —
// 사이드바 표시 이름이 같은 매핑을 반대로 사용한다.
import { resolveLoginEmail } from "@/lib/admin-user";
import { isMockMode, supabase } from "@/lib/supabase";

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
	const [userId, setUserId] = useState("");
	const [pw, setPw] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		if (!userId || !pw) {
			setError("아이디와 비밀번호를 입력해 주세요.");
			return;
		}
		if (isMockMode) {
			navigate({ to: "/dashboard" });
			return;
		}
		setPending(true);
		const { error: authError } = await supabase.auth.signInWithPassword({
			email: resolveLoginEmail(userId),
			password: pw,
		});
		setPending(false);
		if (authError) {
			setError("아이디 또는 비밀번호가 올바르지 않습니다.");
			return;
		}
		navigate({ to: "/dashboard" });
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6">
			<div className="w-full max-w-[430px]">
				<div className="mb-[26px] text-center">
					<div className="mb-3 font-medium text-[var(--color-accent)] text-xs tracking-[0.22em]">
						ADMIN CONSOLE
					</div>
					<div className="font-bold text-[25px] text-foreground tracking-[-0.02em]">
						초이스 행정사 사무소
					</div>
				</div>

				<Card className="p-6 sm:p-8">
					<h1 className="m-0 mb-1.5 font-bold text-[21px] text-foreground tracking-[-0.02em]">
						관리자 로그인
					</h1>
					<p className="m-0 mb-[26px] text-[15px] text-muted-foreground leading-relaxed">
						사무소 관리자 계정으로 로그인해 주세요.
					</p>

					<form onSubmit={handleSubmit}>
						<div className="mb-[18px]">
							<Label htmlFor="userId">아이디</Label>
							<Input
								id="userId"
								type="text"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								placeholder="최서연"
								autoComplete="username"
							/>
						</div>
						<div className="mb-[18px]">
							<Label htmlFor="pw">비밀번호</Label>
							<Input
								id="pw"
								type="password"
								value={pw}
								onChange={(e) => setPw(e.target.value)}
								placeholder="비밀번호를 입력하세요"
								autoComplete="current-password"
							/>
						</div>

						{error && <div className="mb-3.5 text-destructive text-sm">{error}</div>}

						<Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
							{pending ? "로그인 중…" : "로그인"}
						</Button>
					</form>
				</Card>

				<p className="mt-[22px] text-center text-[13px] text-muted-foreground leading-relaxed">
					초이스 행정사 사무소
					<br />
					관리자 외 접근이 제한된 페이지입니다.
				</p>
			</div>
		</div>
	);
}
