import { Extension } from "@tiptap/core";

// blockquote 에 variant 속성을 얹어 '중앙 큰따옴표 인용'(후기·감사글)을 표현한다.
// variant="center" → class="quote-center" 로 출력 → 홈페이지 .prose·admin 미리보기가 렌더.
// parse/render 왕복 지원(기존 글을 다시 열어도 중앙 인용 상태가 유지됨).
// StarterKit 의 기본 blockquote 노드를 대체하지 않고 전역 속성으로 augment(충돌·회귀 없음).
export const QuoteVariant = Extension.create({
	name: "quoteVariant",
	addGlobalAttributes() {
		return [
			{
				types: ["blockquote"],
				attributes: {
					variant: {
						default: null,
						parseHTML: (element: HTMLElement) =>
							element.classList.contains("quote-center") ? "center" : null,
						renderHTML: (attributes: Record<string, unknown>) =>
							attributes.variant === "center" ? { class: "quote-center" } : {},
					},
				},
			},
		];
	},
});
