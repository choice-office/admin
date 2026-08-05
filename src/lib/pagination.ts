// 페이지네이션 — 10개씩 묶어서 보여주는 블록 방식.
// 11페이지에서는 11–20 이 통째로 보이고(현재 페이지를 가운데 두지 않는다),
// 10에서 "다음"을 누르면 11로 가면서 블록이 넘어간다.
//
//   «  이전 블록이 있을 때만        → 1페이지
//   ‹  현재 페이지 > 1              → 이전 페이지
//   ›  현재 페이지 < 마지막         → 다음 페이지
//   »  다음 블록이 있을 때만        → 마지막 페이지
//
// 페이지를 넘겨도 버튼이 밀리지 않게, 안 쓰이는 이동 버튼은 "자리만 차지하는 칸"으로 남긴다
// (reserveStep·reserveEdge). 숫자 칸은 폭이 모두 같아 한 자리→두 자리로 넘어가도 줄이 안 밀린다.
// 다만 마지막 블록처럼 번호가 모자랄 때는 빈 칸을 두지 않고 그만큼 줄인다.
//
// 공개 홈페이지(choice-homepage)의 src/lib/pagination.ts 와 같은 내용이다 — 함께 고친다.

const BLOCK = 10;
// 좁은 화면은 10개가 가로로 들어가지 않는다(측정 472px > 가용 350px).
const MOBILE_BLOCK = 5;

export type PageBlock = {
	/** 현재 블록에서 실제로 있는 페이지 번호들(마지막 블록은 10개보다 적을 수 있다). */
	pages: number[];
	showFirst: boolean;
	showPrev: boolean;
	showNext: boolean;
	showLast: boolean;
	/** ‹ › 자리를 둘지 — 2페이지 이상이면 항상 둔다. */
	reserveStep: boolean;
	/** « » 자리를 둘지 — 블록이 둘 이상일 때만 필요하다. */
	reserveEdge: boolean;
};

export const buildPageBlock = (current: number, total: number): PageBlock => {
	const last = Math.max(total, 1);
	const page = Math.min(Math.max(current, 1), last);
	const start = Math.floor((page - 1) / BLOCK) * BLOCK + 1;
	const end = Math.min(start + BLOCK - 1, last);
	return {
		pages: Array.from({ length: end - start + 1 }, (_, i) => start + i),
		showFirst: start > 1,
		showPrev: page > 1,
		showNext: page < last,
		showLast: end < last,
		reserveStep: last > 1,
		reserveEdge: last > BLOCK,
	};
};

// 좁은 화면에서 남길 번호인지 — 현재 페이지가 속한 5개 묶음만 보여주고 나머지는 CSS 로 감춘다.
// 5개 묶음은 10개 블록 안에 정확히 둘로 나뉘므로 블록 경계와 어긋나지 않는다.
export const isMobilePage = (page: number, current: number) =>
	Math.floor((page - 1) / MOBILE_BLOCK) === Math.floor((current - 1) / MOBILE_BLOCK);
