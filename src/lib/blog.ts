import { resizeImage } from "@/lib/resize-image";
import { supabase } from "@/lib/supabase";
import { checkUpload } from "@/lib/upload-guard";
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
	"id,slug,title,excerpt,content,cover_url,cover_alt,tldr,faq,sources,category_id,author_id,status,published_at,meta_title,meta_description,canonical_url,created_at,updated_at,is_featured,featured_order";
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

// 임시저장 보관 기간 — 마지막 수정일 기준. 지나면 purgeExpiredDrafts()가 삭제한다.
export const DRAFT_RETENTION_DAYS = 30;

const retentionCutoff = (): string =>
	new Date(Date.now() - DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

// 남은 보관 일수(0이면 오늘 지남) — 목록에서 "n일 남음" 표시용
export const draftDaysLeft = (updatedAt: string): number => {
	const elapsedDays = (Date.now() - new Date(updatedAt).getTime()) / (24 * 60 * 60 * 1000);
	return Math.max(0, Math.ceil(DRAFT_RETENTION_DAYS - elapsedDays));
};

export const listDraftPosts = async (): Promise<BlogPost[]> => {
	const run = (select: string) =>
		supabase
			.from("blog_posts")
			.select(select)
			.eq("status", "draft")
			.order("updated_at", { ascending: false });
	let { data, error } = await run(POST_SELECT);
	if (error) ({ data, error } = await run(POST_SELECT_BASE));
	if (error) {
		console.error("임시저장 목록 조회 실패:", error.message);
		return [];
	}
	return (data ?? []) as unknown as BlogPost[];
};

// 보관 기간이 지난 임시저장 글 자동 삭제. 관리자가 블로그 화면에 들어올 때 실행된다.
// (발행·보관 글은 대상이 아니며, updated_at 이 없는 행은 조건에 걸리지 않아 남는다)
export const purgeExpiredDrafts = async (): Promise<number> => {
	const { data, error } = await supabase
		.from("blog_posts")
		.delete()
		.eq("status", "draft")
		.lt("updated_at", retentionCutoff())
		.select("id");
	if (error) {
		console.error("만료 임시저장 삭제 실패:", error.message);
		return 0;
	}
	return data?.length ?? 0;
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

// 홈 대표글 지정/해제 — updated_at은 건드리지 않아(목록 정렬 유지) 별도 함수로 둔다. 최대 3개는 UI에서 제어.
export const setFeatured = async (
	id: string,
	isFeatured: boolean,
	featuredOrder: number | null,
): Promise<boolean> => {
	const { error } = await supabase
		.from("blog_posts")
		.update({ is_featured: isFeatured, featured_order: featuredOrder })
		.eq("id", id);
	if (error) {
		console.error("대표글 설정 실패:", error.message);
		return false;
	}
	return true;
};

// 대표글 전체 해제 — 지정이 0개면 홈은 "자동(최신 발행글 4개)"으로 동작한다.
export const clearFeatured = async (): Promise<boolean> => {
	const { error } = await supabase
		.from("blog_posts")
		.update({ is_featured: false, featured_order: null })
		.eq("is_featured", true);
	if (error) {
		console.error("대표글 해제 실패:", error.message);
		return false;
	}
	return true;
};

// 대표글을 주어진 순서로 통째로 다시 설정한다 — 모든 대표글 변경(추가·해제·순서변경)의 단일 경로.
// 기존 지정을 전부 해제한 뒤 featured_order 를 1..N 으로 다시 매겨 번호에 빈틈이 생기지 않게 한다.
export const setFeaturedPosts = async (ids: string[]): Promise<boolean> => {
	if (!(await clearFeatured())) return false;
	for (const [i, id] of ids.entries()) {
		const { error } = await supabase
			.from("blog_posts")
			.update({ is_featured: true, featured_order: i + 1 })
			.eq("id", id);
		if (error) {
			console.error("대표글 지정 실패:", error.message);
			return false;
		}
	}
	return true;
};

// 대표글을 "최신 발행글 N개"로 다시 지정 — 홈페이지와 같은 기준(published_at 최신순)으로 맞춘다.
export const featureLatestPosts = async (count: number): Promise<number> => {
	const { data, error } = await supabase
		.from("blog_posts")
		.select("id")
		.eq("status", "published")
		.order("published_at", { ascending: false })
		.limit(count);
	if (error) {
		console.error("최신 발행글 조회 실패:", error.message);
		return 0;
	}
	const ids = (data ?? []).map((r) => (r as { id: string }).id);
	return (await setFeaturedPosts(ids)) ? ids.length : 0;
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
	// 형식·용량 검증 실패는 예외로 알린다(호출부가 사유를 그대로 보여줄 수 있게)
	const rejected = checkUpload(file, "image");
	if (rejected) throw new Error(rejected);
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
	const rejected = checkUpload(file, "file");
	if (rejected) throw new Error(rejected);
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
