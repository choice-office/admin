import { createFileRoute, redirect } from "@tanstack/react-router";
import { isMockMode, supabase } from "@/lib/supabase";

// 루트(/) 접속 시 로그인 상태 확인 후 분기
export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		// 미리보기 모드: Supabase 없이 대시보드로 바로 이동
		if (isMockMode) throw redirect({ to: "/dashboard" });

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (session) throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/login" });
	},
	component: () => null,
});
