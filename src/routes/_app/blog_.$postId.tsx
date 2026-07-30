import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BlogEditor } from "@/components/admin/blog-editor";
import { Button } from "@/components/ui/ds";
import { useBlogEditorData } from "@/hooks/use-blog-editor-data";

// 글 수정 — /blog/{글 id}. 새로고침해도 수정 화면이 유지된다.
export const Route = createFileRoute("/_app/blog_/$postId")({
	component: BlogEditPage,
	validateSearch: (search: Record<string, unknown>): { page: number } => ({
		page: Math.max(1, Number(search.page) || 1),
	}),
});

function BlogEditPage() {
	const { postId } = Route.useParams();
	const { categories, authors, post, isLoading } = useBlogEditorData(postId);
	const { page } = Route.useSearch();
	const navigate = useNavigate();
	const goList = () => navigate({ to: "/blog", search: { page } });

	if (isLoading) {
		return (
			<div className="rounded-md border border-border bg-card px-5 py-16 text-center text-muted-foreground text-sm">
				불러오는 중…
			</div>
		);
	}

	if (!post) {
		return (
			<div className="rounded-md border border-border bg-card px-5 py-16 text-center">
				<div className="font-medium text-[15px] text-foreground">글을 찾을 수 없습니다</div>
				<div className="mt-1.5 mb-5 text-muted-foreground text-sm">
					삭제된 글이거나 주소가 잘못되었습니다.
				</div>
				<Button variant="outline" onClick={goList}>
					목록으로
				</Button>
			</div>
		);
	}

	return (
		// key — 임시저장 목록에서 다른 글로 이동할 때 입력 상태를 새 글 기준으로 다시 초기화
		<BlogEditor
			key={post.id}
			post={post}
			categories={categories}
			authors={authors}
			onClose={goList}
			onOpenPost={(nextId) =>
				navigate({ to: "/blog/$postId", params: { postId: nextId }, search: { page } })
			}
		/>
	);
}
