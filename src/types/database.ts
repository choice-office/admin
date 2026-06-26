// Supabase 테이블 타입 정의
// 실제 contacts 테이블 스키마에 맞게 수정하세요
//
// 컬럼 추가 마이그레이션 예시 (Supabase SQL Editor):
//   ALTER TABLE contacts ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
//   ALTER TABLE contacts ADD COLUMN phone TEXT;

export type Database = {
	public: {
		Tables: {
			contacts: {
				Row: {
					id: string;
					name: string;
					email: string;
					// ★ 클라이언트 커스텀 필드 — 여기에 컬럼 추가
					phone?: string;
					message: string;
					created_at: string;
					is_read: boolean;
				};
				Insert: {
					id?: string;
					name: string;
					email: string;
					phone?: string;
					message: string;
					created_at?: string;
					is_read?: boolean;
				};
				Update: {
					id?: string;
					name?: string;
					email?: string;
					phone?: string;
					message?: string;
					created_at?: string;
					is_read?: boolean;
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

// 시스템이 관리하는 필드 (contact-fields.ts에 포함하지 않음)
export type ContactSystemKeys = "id" | "is_read" | "created_at";

// 클라이언트가 정의하는 커스텀 필드 키 타입
export type ContactFieldKey = keyof Omit<Contact, ContactSystemKeys>;
