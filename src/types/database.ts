// Supabase 테이블 타입 — 초이스 홈페이지/관리자 공용 DB(choice 프로젝트).
// 실제 스키마(homepage) 기준. 컬럼 변경 시 여기와 Supabase 마이그레이션을 함께 수정.

export type ContactStatus = "new" | "in_progress" | "done" | "hold";
export type PostStatus = "draft" | "published" | "archived";

export type BlogFaq = { q: string; a: string };
export type BlogSource = { label: string; href: string };

export type Database = {
	public: {
		Tables: {
			contacts: {
				Row: {
					id: string;
					created_at: string;
					updated_at: string;
					name: string;
					phone: string;
					email: string;
					nationality: string | null;
					current_visa: string | null;
					consult_field: string | null;
					message: string | null;
					privacy_consent: boolean;
					source: string;
					status: ContactStatus;
					user_agent: string | null;
					memo: string | null;
				};
				Insert: {
					id?: string;
					name: string;
					phone: string;
					email: string;
					nationality?: string | null;
					current_visa?: string | null;
					consult_field?: string | null;
					message?: string | null;
					privacy_consent?: boolean;
					source?: string;
					status?: ContactStatus;
					memo?: string | null;
				};
				Update: {
					status?: ContactStatus;
					memo?: string | null;
				};
				Relationships: [];
			};
			review_images: {
				Row: {
					id: string;
					created_at: string;
					updated_at: string;
					src: string;
					w: number;
					h: number;
					tag: string;
					quote: string;
					meta: string;
					is_published: boolean;
					sort_order: number;
				};
				Insert: {
					id?: string;
					src: string;
					w: number;
					h: number;
					tag: string;
					quote: string;
					meta: string;
					is_published?: boolean;
					sort_order?: number;
				};
				Update: {
					src?: string;
					w?: number;
					h?: number;
					tag?: string;
					quote?: string;
					meta?: string;
					is_published?: boolean;
					sort_order?: number;
				};
				Relationships: [];
			};
			blog_posts: {
				Row: {
					id: string;
					created_at: string;
					updated_at: string;
					slug: string;
					title: string;
					excerpt: string;
					content: string;
					cover_url: string | null;
					cover_alt: string | null;
					tldr: string | null;
					faq: BlogFaq[];
					sources: BlogSource[];
					category_id: string | null;
					author_id: string | null;
					status: PostStatus;
					published_at: string | null;
					meta_title: string | null;
					meta_description: string | null;
					canonical_url: string | null;
					tags: string[];
				};
				Insert: {
					id?: string;
					slug: string;
					title: string;
					excerpt: string;
					content: string;
					cover_url?: string | null;
					cover_alt?: string | null;
					tldr?: string | null;
					faq?: BlogFaq[];
					sources?: BlogSource[];
					category_id?: string | null;
					author_id?: string | null;
					status?: PostStatus;
					published_at?: string | null;
					meta_title?: string | null;
					meta_description?: string | null;
					canonical_url?: string | null;
					tags?: string[];
				};
				Update: {
					slug?: string;
					title?: string;
					excerpt?: string;
					content?: string;
					cover_url?: string | null;
					cover_alt?: string | null;
					tldr?: string | null;
					faq?: BlogFaq[];
					sources?: BlogSource[];
					category_id?: string | null;
					author_id?: string | null;
					status?: PostStatus;
					published_at?: string | null;
					meta_title?: string | null;
					meta_description?: string | null;
					canonical_url?: string | null;
					tags?: string[];
					updated_at?: string;
				};
				Relationships: [];
			};
			blog_categories: {
				Row: { id: string; name: string };
				Insert: { id?: string; name: string };
				Update: { name?: string };
				Relationships: [];
			};
			blog_authors: {
				Row: { id: string; name: string };
				Insert: { id?: string; name: string };
				Update: { name?: string };
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ReviewImage = Database["public"]["Tables"]["review_images"]["Row"];
export type ReviewImageInsert = Database["public"]["Tables"]["review_images"]["Insert"];
export type ReviewImageUpdate = Database["public"]["Tables"]["review_images"]["Update"];
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"];
export type BlogPostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"];
export type BlogCategory = Database["public"]["Tables"]["blog_categories"]["Row"];
export type BlogAuthor = Database["public"]["Tables"]["blog_authors"]["Row"];
