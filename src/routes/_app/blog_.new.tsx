import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BlogEditor } from "@/components/admin/blog-editor";
import { useBlogEditorData } from "@/hooks/use-blog-editor-data";

// 새 글 작성 — 목록과 별개 URL(/blog/new)이라 새로고침해도 작성 화면이 유지된다.
// search.page 는 "목록으로" 돌아갈 때 보던 페이지를 복원하는 용도.
export const Route = createFileRoute("/_app/blog_/new")({
	component: BlogNewPage,
	validateSearch: (search: Record<string, unknown>): { page: number } => ({
		page: Math.max(1, Number(search.page) || 1),
	}),
});

function BlogNewPage() {
	const { categories, authors, isLoading } = useBlogEditorData();
	const { page } = Route.useSearch();
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="rounded-md border border-border bg-card px-5 py-16 text-center text-muted-foreground text-sm">
				불러오는 중…
			</div>
		);
	}

	return (
		<BlogEditor
			post={null}
			categories={categories}
			authors={authors}
			onClose={() => navigate({ to: "/blog", search: { page } })}
			onOpenPost={(postId) =>
				navigate({ to: "/blog/$postId", params: { postId }, search: { page } })
			}
		/>
	);
}
