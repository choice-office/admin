import { useEffect, useState } from "react";
import { getAuthors, getCategories, getPost } from "@/lib/blog";
import type { BlogAuthor, BlogCategory, BlogPost } from "@/types/database";

// 에디터 라우트(/blog/new · /blog/{id}) 공용 로더.
// BlogEditor 는 mount 시점의 post 로 입력값 초기화를 하므로, 로딩이 끝난 뒤에 렌더해야 한다.
export const useBlogEditorData = (postId?: string) => {
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [authors, setAuthors] = useState<BlogAuthor[]>([]);
	const [post, setPost] = useState<BlogPost | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isAlive = true;
		const load = async () => {
			setIsLoading(true);
			try {
				const [c, a, p] = await Promise.all([
					getCategories(),
					getAuthors(),
					postId ? getPost(postId) : Promise.resolve(null),
				]);
				if (!isAlive) return;
				setCategories(c);
				setAuthors(a);
				setPost(p);
			} catch (e) {
				console.error("에디터 데이터 조회 실패:", e);
			} finally {
				// 조회가 실패해도 로딩 화면에 갇히지 않게 한다
				if (isAlive) setIsLoading(false);
			}
		};
		load();
		return () => {
			isAlive = false;
		};
	}, [postId]);

	return { categories, authors, post, isLoading };
};
