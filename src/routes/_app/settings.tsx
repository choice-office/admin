import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { Button, Card, CardTitle, Input, Label } from "@/components/ui/ds";
import { isMockMode, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [pw, setPw] = useState("");
	const [pwConfirm, setPwConfirm] = useState("");
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

	useEffect(() => {
		if (isMockMode) {
			setEmail("preview@kvisa1345.com");
			return;
		}
		(async () => {
			const { data } = await supabase.auth.getUser();
			setEmail(data.user?.email ?? "");
		})();
	}, []);

	const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setMessage(null);
		if (pw.length < 6) {
			setMessage({ type: "error", text: "비밀번호는 6자 이상이어야 합니다." });
			return;
		}
		if (pw !== pwConfirm) {
			setMessage({ type: "error", text: "비밀번호가 일치하지 않습니다." });
			return;
		}
		setPending(true);
		const { error } = await supabase.auth.updateUser({ password: pw });
		setPending(false);
		if (error) {
			setMessage({ type: "error", text: "변경에 실패했습니다. 다시 시도해 주세요." });
			return;
		}
		setPw("");
		setPwConfirm("");
		setMessage({ type: "ok", text: "비밀번호가 변경되었습니다." });
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	};

	return (
		<div className="max-w-[760px]">
			<div className="mb-5">
				<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">설정</h2>
				<p className="m-0 text-[15px] text-muted-foreground">
					관리자 계정과 사무소 정보를 관리합니다.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<Card>
					<CardTitle>계정</CardTitle>
					<div className="mt-4 flex items-center justify-between gap-4 rounded-md bg-muted px-4 py-3.5">
						<div>
							<div className="text-[13px] text-muted-foreground">로그인 계정</div>
							<div className="mt-0.5 font-medium text-foreground">{email || "—"}</div>
						</div>
						<Button variant="outline" size="sm" onClick={handleLogout}>
							로그아웃
						</Button>
					</div>
				</Card>

				<Card>
					<CardTitle>비밀번호 변경</CardTitle>
					<form onSubmit={handleChangePassword} className="mt-4">
						<div className="mb-4">
							<Label htmlFor="st-pw">새 비밀번호</Label>
							<Input
								id="st-pw"
								type="password"
								value={pw}
								onChange={(e) => setPw(e.target.value)}
								placeholder="6자 이상"
								autoComplete="new-password"
							/>
						</div>
						<div className="mb-4">
							<Label htmlFor="st-pw2">새 비밀번호 확인</Label>
							<Input
								id="st-pw2"
								type="password"
								value={pwConfirm}
								onChange={(e) => setPwConfirm(e.target.value)}
								placeholder="한 번 더 입력"
								autoComplete="new-password"
							/>
						</div>
						{message && (
							<div
								className={
									message.type === "ok"
										? "mb-3.5 text-primary text-sm"
										: "mb-3.5 text-destructive text-sm"
								}
							>
								{message.text}
							</div>
						)}
						<Button type="submit" variant="primary" disabled={pending}>
							{pending ? "변경 중…" : "비밀번호 변경"}
						</Button>
					</form>
				</Card>

				<Card>
					<CardTitle>사무소 정보</CardTitle>
					<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
						사무소명·연락처·주소 등 홈페이지에 표시되는 정보는 홈페이지 코드(site-data)에서
						관리됩니다. 변경이 필요하면 담당 개발자에게 요청해 주세요.
					</p>
				</Card>
			</div>
		</div>
	);
}
