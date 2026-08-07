import { createFileRoute } from "@tanstack/react-router";
import { HomeFeaturedPosts } from "@/components/admin/home-featured-posts";
import { HomeShorts } from "@/components/admin/home-shorts";

export const Route = createFileRoute("/_app/home")({
	component: HomePage,
});

// 홈 노출 관리 — 홈페이지 첫 화면에 무엇이 나갈지 정하는 곳.
//   ① "영상으로 보는 비자 정보" 유튜브 쇼츠 4칸  → HomeShorts
//   ② "비자 정보·소식" 블로그 대표글 4칸        → HomeFeaturedPosts
// 두 섹션 모두 **칸에서 시작해 모달로 고르는** 방식이다(어느 자리를 채우는지 헷갈리지 않게).
// 저장 즉시 반영은 아니고 홈이 60초 ISR 이라 최대 1분 뒤 바뀐다(각 섹션에 문구로 명시).
function HomePage() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
			<div>
				<h1 className="font-bold text-[22px] text-foreground tracking-[-0.01em]">홈 노출</h1>
				<p className="mt-1 text-[13.5px] text-muted-foreground">
					홈에 나가는 유튜브 쇼츠 4칸과 블로그 대표글 4칸을 여기서 정합니다. 바꾸면 홈에
					반영됩니다(최대 1분).
				</p>
			</div>

			<HomeShorts />
			<HomeFeaturedPosts />
		</div>
	);
}
