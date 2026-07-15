import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BlogEditor } from "@/components/admin/blog-editor";
import { Badge, Button } from "@/components/ui/ds";
import { deletePost, getAuthors, getCategories, listPosts } from "@/lib/blog";
import { formatDateCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BlogAuthor, BlogCategory, BlogPost, PostStatus } from "@/types/database";

export const Route = createFileRoute("/_app/blog")({
	component: BlogPage,
});

const GRID = "grid-cols-[2.4fr_1fr_0.8fr_1fr_auto]";

const STATUS_LABEL: Record<PostStatus, string> = {
	draft: "임시저장",
	published: "발행",
	archived: "보관",
};

function BlogPage() {
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [authors, setAuthors] = useState<BlogAuthor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editing, setEditing] = useState<BlogPost | null>(null);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		const [p, c, a] = await Promise.all([listPosts(), getCategories(), getAuthors()]);
		setPosts(p);
		setCategories(c);
		setAuthors(a);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	const categoryName = (id: string | null): string =>
		categories.find((c) => c.id === id)?.name ?? "—";

	const openEditor = (post: BlogPost | null) => {
		setEditing(post);
		setIsEditorOpen(true);
	};

	if (isEditorOpen) {
		return (
			<BlogEditor
				post={editing}
				categories={categories}
				authors={authors}
				onClose={() => {
					setIsEditorOpen(false);
					setEditing(null);
				}}
				onSaved={refetch}
			/>
		);
	}

	return (
		<div>
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 className="m-0 mb-1.5 font-bold text-2xl text-foreground tracking-[-0.02em]">
						블로그 · 공지 관리
					</h2>
					<p className="m-0 text-[15px] text-muted-foreground">
						글을 작성하고 발행합니다. 발행한 글은 홈페이지 블로그에 노출됩니다.
					</p>
				</div>
				<Button variant="primary" iconStart={<Plus size={18} />} onClick={() => openEditor(null)}>
					새 글
				</Button>
			</div>

			<div className="overflow-hidden rounded-md border border-border bg-card">
				<div
					className={cn(
						"grid gap-3 border-border border-b bg-muted px-5 py-3 font-semibold text-[13px] text-muted-foreground",
						GRID,
					)}
				>
					<div>제목</div>
					<div>카테고리</div>
					<div>상태</div>
					<div>수정일</div>
					<div className="text-right">관리</div>
				</div>

				{isLoading ? (
					<div className="px-5 py-14 text-center text-muted-foreground text-sm">불러오는 중…</div>
				) : posts.length === 0 ? (
					<div className="px-5 py-14 text-center">
						<div className="font-medium text-[15px] text-foreground">작성된 글이 없습니다</div>
						<div className="mt-1.5 text-muted-foreground text-sm">
							"새 글" 버튼으로 첫 글을 작성해 보세요.
						</div>
					</div>
				) : (
					posts.map((p) => (
						<div
							key={p.id}
							className={cn(
								"grid items-center gap-3 border-border border-b px-5 py-3.5 last:border-b-0",
								GRID,
							)}
						>
							<div className="min-w-0">
								<div className="truncate font-medium text-foreground">
									{p.title || "(제목 없음)"}
								</div>
								<div className="mt-0.5 truncate text-[13px] text-muted-foreground">/{p.slug}</div>
							</div>
							<div className="text-[var(--text-body)] text-sm">{categoryName(p.category_id)}</div>
							<div>
								{p.status === "published" ? (
									<Badge variant="primary">{STATUS_LABEL[p.status]}</Badge>
								) : (
									<Badge variant="outline">{STATUS_LABEL[p.status]}</Badge>
								)}
							</div>
							<div className="text-muted-foreground text-sm">{formatDateCompact(p.updated_at)}</div>
							<div className="flex items-center justify-end gap-1">
								<button
									type="button"
									title="수정"
									onClick={() => openEditor(p)}
									className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
								>
									<Pencil size={16} />
								</button>
								<button
									type="button"
									title="삭제"
									onClick={() => setConfirmId(p.id)}
									className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{confirmId && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="글 삭제 확인"
					className="fixed inset-0 z-[100] flex items-center justify-center p-6"
				>
					<button
						type="button"
						aria-label="배경 클릭으로 닫기"
						onClick={() => setConfirmId(null)}
						className="absolute inset-0 cursor-default border-none bg-[rgba(34,29,22,0.45)] p-0"
					/>
					<div className="relative z-[1] w-full max-w-[400px] rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-md)]">
						<h3 className="m-0 mb-2 font-bold text-foreground text-lg">글을 삭제할까요?</h3>
						<p className="m-0 mb-5 text-muted-foreground text-sm leading-relaxed">
							삭제한 글은 복구할 수 없습니다. 발행 중이었다면 홈페이지에서도 사라집니다.
						</p>
						<div className="flex justify-end gap-2.5">
							<Button variant="outline" onClick={() => setConfirmId(null)}>
								취소
							</Button>
							<Button
								variant="primary"
								onClick={async () => {
									await deletePost(confirmId);
									setConfirmId(null);
									await refetch();
								}}
							>
								삭제
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
