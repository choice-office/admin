// Supabase 테이블 타입 — 초이스 홈페이지/관리자 공용 DB(choice 프로젝트).
// 실제 스키마(homepage) 기준. 컬럼 변경 시 여기와 Supabase 마이그레이션을 함께 수정.

export type ContactStatus = "new" | "in_progress" | "done" | "hold";

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
			reviews: {
				Row: {
					id: string;
					created_at: string;
					updated_at: string;
					tag: string;
					country: string;
					initial: string;
					flag: string;
					title: string;
					body: string;
					is_published: boolean;
					sort_order: number;
				};
				Insert: {
					id?: string;
					tag?: string;
					country?: string;
					initial?: string;
					flag?: string;
					title: string;
					body: string;
					is_published?: boolean;
					sort_order?: number;
				};
				Update: {
					tag?: string;
					country?: string;
					initial?: string;
					flag?: string;
					title?: string;
					body?: string;
					is_published?: boolean;
					sort_order?: number;
				};
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
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
