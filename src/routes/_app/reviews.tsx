import { createFileRoute } from "@tanstack/react-router";
import { ScreenPlaceholder } from "@/components/admin/screen-placeholder";

export const Route = createFileRoute("/_app/reviews")({
	component: () => (
		<ScreenPlaceholder
			title="의뢰인 후기 관리"
			desc="후기를 직접 등록하고 홈페이지 노출 여부를 관리합니다."
		/>
	),
});
