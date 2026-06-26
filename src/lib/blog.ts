import { supabase } from "@/lib/supabase";
import type {
	BlogAuthor,
	BlogCategory,
	BlogPost,
	BlogPostInsert,
	BlogPostUpdate,
} from "@/types/database";

// 블로그 작성/관리 데이터 레이어 — authenticated RLS로 동작(로그인 세션).
// 공개 렌더/JSON-LD는 홈페이지(choice-homepage)가 담당. 여기선 작성·발행만.

const POST_SELECT =
	"id,slug,title,excerpt,content,cover_url,cover_alt,tldr,faq,sources,category_id,author_id,status,published_at,meta_title,meta_description,canonical_url,created_at,updated_at";

export const listPosts = async (): Promise<BlogPost[]> => {
	const { data, error } = await supabase
		.from("blog_posts")
		.select(POST_SELECT)
		.order("updated_at", { ascending: false });
	if (error) {
		console.error("글 목록 조회 실패:", error.message);
		return [];
	}
	return (data ?? []) as BlogPost[];
};

export const getPost = async (id: string): Promise<BlogPost | null> => {
	const { data, error } = await supabase
		.from("blog_posts")
		.select(POST_SELECT)
		.eq("id", id)
		.maybeSingle();
	if (error) {
		console.error("글 조회 실패:", error.message);
		return null;
	}
	return (data as BlogPost) ?? null;
};

export const getCategories = async (): Promise<BlogCategory[]> => {
	const { data, error } = await supabase.from("blog_categories").select("id,name").order("name");
	if (error) {
		console.error("카테고리 조회 실패:", error.message);
		return [];
	}
	return (data ?? []) as BlogCategory[];
};

export const getAuthors = async (): Promise<BlogAuthor[]> => {
	const { data, error } = await supabase.from("blog_authors").select("id,name").order("name");
	if (error) {
		console.error("작성자 조회 실패:", error.message);
		return [];
	}
	return (data ?? []) as BlogAuthor[];
};

export const createPost = async (payload: BlogPostInsert): Promise<string | null> => {
	const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
	if (error) {
		console.error("글 생성 실패:", error.message);
		return null;
	}
	return data?.id ?? null;
};

export const updatePost = async (id: string, patch: BlogPostUpdate): Promise<boolean> => {
	const { error } = await supabase
		.from("blog_posts")
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq("id", id);
	if (error) {
		console.error("글 수정 실패:", error.message);
		return false;
	}
	return true;
};

export const deletePost = async (id: string): Promise<boolean> => {
	const { error } = await supabase.from("blog_posts").delete().eq("id", id);
	if (error) {
		console.error("글 삭제 실패:", error.message);
		return false;
	}
	return true;
};

// 이미지 업로드 → storage(blog 버킷) → 공개 URL. 핫링크 깨짐 방지(재호스팅).
export const uploadBlogImage = async (file: File): Promise<string | null> => {
	const ext = file.name.split(".").pop()?.toLowerCase() || "png";
	const rand = crypto.randomUUID().slice(0, 8);
	const path = `uploads/${rand}.${ext}`;
	const { error } = await supabase.storage
		.from("blog")
		.upload(path, file, { cacheControl: "31536000", upsert: false });
	if (error) {
		console.error("이미지 업로드 실패:", error.message);
		return null;
	}
	const { data } = supabase.storage.from("blog").getPublicUrl(path);
	return data.publicUrl;
};

// slug 자동 생성(규칙 기반, AI 없음). 영문/숫자만 kebab, 비면 post-{8hex}.
export const slugify = (title: string): string => {
	const base = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9가-힣\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	const ascii = base.replace(/[^a-z0-9-]/g, "");
	return ascii.length >= 3 ? ascii : `post-${crypto.randomUUID().slice(0, 8)}`;
};

// 본문 HTML → 일반 텍스트(요약/메타 자동값용)
export const htmlToText = (html: string): string =>
	html
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
