// 페이지네이션 번호 목록 — 현재 페이지 주변(±1) + 처음/끝만 노출하고,
// 사이가 벌어지면 "…"로 축약한다(한 칸만 생략될 땐 실제 숫자 노출).
// 공개 블로그(choice-homepage)의 buildPageList와 동일한 규칙으로 일관성 유지.
export const buildPageList = (current: number, total: number): (number | "…")[] => {
	const nums = new Set<number>([1, total]);
	for (let i = current - 1; i <= current + 1; i++) {
		if (i >= 1 && i <= total) nums.add(i);
	}
	const sorted = [...nums].sort((a, b) => a - b);
	const out: (number | "…")[] = [];
	let prev = 0;
	for (const n of sorted) {
		if (prev && n - prev > 1) out.push(n - prev === 2 ? prev + 1 : "…");
		out.push(n);
		prev = n;
	}
	return out;
};
