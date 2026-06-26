import { createFileRoute } from "@tanstack/react-router";
import { ScreenPlaceholder } from "@/components/admin/screen-placeholder";

export const Route = createFileRoute("/_app/blog")({
	component: () => (
		<ScreenPlaceholder
			title="블로그 · 공지"
			desc="출입국·비자 칼럼과 공지를 작성하고 홈페이지에 발행합니다."
		/>
	),
});
