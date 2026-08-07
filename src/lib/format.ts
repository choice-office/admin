import dayjs from "dayjs";
import "dayjs/locale/ko";

// 한국어 로케일 전역 설정 (오전/오후 표기)
dayjs.locale("ko");

const safeFmt = (iso: string, fmt: string): string => {
	const d = dayjs(iso);
	return d.isValid() ? d.format(fmt) : "—";
};

// dayjs는 로컬 타임존 기준 → KST 환경에서 자동으로 KST 적용
export const formatDateFull = (iso: string): string => safeFmt(iso, "YYYY. MM. DD. A hh:mm");

export const formatDateCompact = (iso: string): string => safeFmt(iso, "MM. DD. A hh:mm");

// 날짜만 — 발행일처럼 시각이 의미 없는 값에 쓴다(발행 시각은 전부 09:00 로 넣고 있다).
export const formatDateOnly = (iso: string): string => safeFmt(iso, "YYYY. MM. DD.");
