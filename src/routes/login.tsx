import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui/ds";
import { isMockMode, supabase } from "@/lib/supabase";

// 관리자 아이디 → Supabase 로그인 이메일 매핑(한글 아이디 지원).
// Supabase Auth는 이메일 기반이라, 표시용 아이디를 실제 계정 이메일로 변환한다.
const ADMIN_ALIASES: Record<string, string> = {
	최서연: "seoyeon@kvisa1345.com",
};
const resolveLoginEmail = (id: string): string => ADMIN_ALIASES[id.trim()] ?? id.trim();

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
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--surface-subtle)",
				padding: 24,
			}}
		>
			<div style={{ width: "100%", maxWidth: 430 }}>
				<div style={{ textAlign: "center", marginBottom: 26 }}>
					<div
						style={{
							fontSize: 12,
							letterSpacing: "0.22em",
							color: "var(--color-accent)",
							fontWeight: 500,
							marginBottom: 12,
						}}
					>
						ADMIN CONSOLE
					</div>
					<div
						style={{
							fontSize: 25,
							fontWeight: 700,
							letterSpacing: "-0.02em",
							color: "var(--text-heading)",
						}}
					>
						초이스 행정사 사무소
					</div>
				</div>

				<Card padding="32px">
					<h1
						style={{
							fontSize: 21,
							fontWeight: 700,
							color: "var(--text-heading)",
							margin: "0 0 6px",
							letterSpacing: "-0.02em",
						}}
					>
						관리자 로그인
					</h1>
					<p
						style={{
							fontSize: 15,
							color: "var(--text-muted)",
							margin: "0 0 26px",
							lineHeight: 1.6,
						}}
					>
						사무소 관리자 계정으로 로그인해 주세요.
					</p>

					<form onSubmit={handleSubmit}>
						<div style={{ marginBottom: 18 }}>
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
						<div style={{ marginBottom: 18 }}>
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

						{error && (
							<div style={{ fontSize: 14, color: "#b4452f", marginBottom: 14 }}>{error}</div>
						)}

						<Button
							type="submit"
							variant="primary"
							size="lg"
							disabled={pending}
							style={{ width: "100%" }}
						>
							{pending ? "로그인 중…" : "로그인"}
						</Button>
					</form>
				</Card>

				<p
					style={{
						textAlign: "center",
						fontSize: 13,
						color: "var(--text-muted)",
						margin: "22px 0 0",
						lineHeight: 1.7,
					}}
				>
					초이스 행정사 사무소
					<br />
					관리자 외 접근이 제한된 페이지입니다.
				</p>
			</div>
		</div>
	);
}
