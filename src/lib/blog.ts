import { resizeImage } from "@/lib/resize-image";
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

const POST_SELECT_BASE =
	"id,slug,title,excerpt,content,cover_url,cover_alt,tldr,faq,sources,category_id,author_id,status,published_at,meta_title,meta_description,canonical_url,created_at,updated_at";
// tags 컬럼은 마이그레이션 후에만 존재 → 포함 조회 실패 시 base로 폴백(마이그레이션 전에도 목록 정상)
const POST_SELECT = `${POST_SELECT_BASE},tags`;

export const listPosts = async (): Promise<BlogPost[]> => {
	const run = (select: string) =>
		supabase.from("blog_posts").select(select).order("updated_at", { ascending: false });
	let { data, error } = await run(POST_SELECT);
	if (error) ({ data, error } = await run(POST_SELECT_BASE));
	if (error) {
		console.error("글 목록 조회 실패:", error.message);
		return [];
	}
	return (data ?? []) as unknown as BlogPost[];
};

export const getPost = async (id: string): Promise<BlogPost | null> => {
	const run = (select: string) =>
		supabase.from("blog_posts").select(select).eq("id", id).maybeSingle();
	let { data, error } = await run(POST_SELECT);
	if (error) ({ data, error } = await run(POST_SELECT_BASE));
	if (error) {
		console.error("글 조회 실패:", error.message);
		return null;
	}
	return (data as unknown as BlogPost) ?? null;
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

// tags 컬럼 미적용(마이그레이션 전) 에러인지 판별 — 이때만 tags 빼고 재시도해 저장 자체는 항상 되게.
// (그 외 에러는 그대로 실패시켜 조용한 데이터 손실 방지)
const isMissingTagsError = (e: { code?: string; message?: string } | null): boolean =>
	!!e && (e.code === "PGRST204" || e.code === "42703" || /\btags\b/i.test(e.message ?? ""));

export const createPost = async (payload: BlogPostInsert): Promise<string | null> => {
	const insert = (p: BlogPostInsert) => supabase.from("blog_posts").insert(p).select("id").single();
	let { data, error } = await insert(payload);
	if (error && payload.tags !== undefined && isMissingTagsError(error)) {
		const { tags, ...rest } = payload;
		void tags;
		({ data, error } = await insert(rest));
	}
	if (error) {
		console.error("글 생성 실패:", error.message);
		return null;
	}
	return data?.id ?? null;
};

export const updatePost = async (id: string, patch: BlogPostUpdate): Promise<boolean> => {
	const run = (p: BlogPostUpdate) =>
		supabase
			.from("blog_posts")
			.update({ ...p, updated_at: new Date().toISOString() })
			.eq("id", id);
	let { error } = await run(patch);
	if (error && patch.tags !== undefined && isMissingTagsError(error)) {
		const { tags, ...rest } = patch;
		void tags;
		({ error } = await run(rest));
	}
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

// 이미지 업로드 → (축소·WebP 압축) → storage(blog 버킷) → 공개 URL. 핫링크 깨짐 방지(재호스팅).
export const uploadBlogImage = async (file: File): Promise<string | null> => {
	const optimized = await resizeImage(file);
	const ext = optimized.name.split(".").pop()?.toLowerCase() || "webp";
	const rand = crypto.randomUUID().slice(0, 8);
	const path = `uploads/${rand}.${ext}`;
	const { error } = await supabase.storage
		.from("blog")
		.upload(path, optimized, { cacheControl: "31536000", upsert: false });
	if (error) {
		console.error("이미지 업로드 실패:", error.message);
		return null;
	}
	const { data } = supabase.storage.from("blog").getPublicUrl(path);
	return data.publicUrl;
};

// 첨부파일 업로드(모든 타입) → storage(blog 버킷) → 공개 URL + 원본 파일명/MIME.
export const uploadBlogFile = async (
	file: File,
): Promise<{ url: string; name: string; mime: string }> => {
	const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
	const rand = crypto.randomUUID().slice(0, 8);
	const path = `files/${rand}.${ext}`;
	const { error } = await supabase.storage
		.from("blog")
		.upload(path, file, { cacheControl: "31536000", upsert: false });
	if (error) {
		console.error("파일 업로드 실패:", error.message);
		throw new Error(error.message);
	}
	const { data } = supabase.storage.from("blog").getPublicUrl(path);
	return { url: data.publicUrl, name: file.name, mime: file.type };
};

// slug 자동 생성(규칙 기반, AI 없음). 한글/영문/숫자 kebab 유지(URL에 키워드 노출 → SEO).
// 하이픈 제외 실질 문자 3자 미만이면 post-{8hex} 폴백. DB CHECK: ^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$
export const slugify = (title: string): string => {
	const base = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9가-힣\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return base.replace(/-/g, "").length >= 3 ? base : `post-${crypto.randomUUID().slice(0, 8)}`;
};

// 본문 HTML → 일반 텍스트(요약/메타 자동값용)
export const htmlToText = (html: string): string =>
	html
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
