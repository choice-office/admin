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
