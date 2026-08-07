import { useEffect, useState } from "react";
import { adminDisplayName } from "@/lib/admin-user";
import { isMockMode, supabase } from "@/lib/supabase";

export type CurrentUser = { name: string; email: string };

// 환경변수 없는 미리보기 모드 — 설정 화면과 같은 더미 계정.
const MOCK_USER: CurrentUser = { name: "관리자", email: "preview@kvisa1345.com" };

// 로그인한 관리자의 표시 정보(이름·이메일).
// 초기값은 로컬 세션(getSession)으로 즉시 채우고, 로그인/로그아웃 시 갱신한다.
export const useCurrentUser = (): CurrentUser => {
	const [user, setUser] = useState<CurrentUser>(isMockMode ? MOCK_USER : { name: "", email: "" });

	useEffect(() => {
		if (isMockMode) return;
		let alive = true;
		const apply = (u: Parameters<typeof adminDisplayName>[0]) => {
			if (alive) setUser({ name: adminDisplayName(u), email: u?.email ?? "" });
		};
		supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
		const { data } = supabase.auth.onAuthStateChange((_event, session) => {
			apply(session?.user ?? null);
		});
		return () => {
			alive = false;
			data.subscription.unsubscribe();
		};
	}, []);

	return user;
};
