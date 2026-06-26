import { createFileRoute } from "@tanstack/react-router";
import { ScreenPlaceholder } from "@/components/admin/screen-placeholder";

export const Route = createFileRoute("/_app/inquiries")({
	component: () => (
		<ScreenPlaceholder
			title="상담 문의 관리"
			desc="홈페이지로 접수된 상담 문의를 확인하고 처리 상태를 관리합니다."
		/>
	),
});
