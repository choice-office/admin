import { createFileRoute } from "@tanstack/react-router";
import { ScreenPlaceholder } from "@/components/admin/screen-placeholder";

export const Route = createFileRoute("/_app/settings")({
	component: () => (
		<ScreenPlaceholder title="설정" desc="사무소 정보와 관리자 계정을 관리합니다." />
	),
});
