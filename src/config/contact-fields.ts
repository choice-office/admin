import type { ContactFieldKey } from "@/types/database";

export type ContactField = {
	// Contact 타입에 정의된 키와 일치해야 합니다
	key: ContactFieldKey;
	// 테이블 헤더 · 모달 라벨 · 엑셀 컬럼명으로 사용됩니다
	label: string;
	// 엑셀 컬럼 너비 (wch 단위)
	excelWidth: number;
	// true: 테이블에서 2줄 말줄임, 모달에서 전체 너비 + 배경 처리
	isLong?: boolean;
	// 테이블 컬럼 고정 너비 (px). 미설정 시 남은 공간 자동 배분
	size?: number;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ★ 클라이언트 커스텀 포인트
//
// 필드 추가 시:
//   1) src/types/database.ts 의 Contact Row · Insert · Update 타입에 컬럼 추가
//   2) 아래 배열에 항목 추가
//   3) (Supabase 사용 시) 테이블에 컬럼 추가 마이그레이션 실행
//
// 배열 순서 = 테이블 컬럼 순서 = 모달 표시 순서 = 엑셀 컬럼 순서
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const CONTACT_FIELDS: ContactField[] = [
	{ key: "name", label: "이름", excelWidth: 14, size: 100 },
	{ key: "phone", label: "연락처", excelWidth: 18, size: 130 },
	{ key: "email", label: "이메일", excelWidth: 34, size: 220 },
	{ key: "message", label: "문의 내용", excelWidth: 80, isLong: true }, // size 미설정 → 남은 공간 차지
];
