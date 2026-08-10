import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		naverMap: {
			/** 장소 카드를 본문에 넣는다. */
			setNaverMap: (attrs: { name: string; addr?: string }) => ReturnType;
		};
	}
}

// 네이버 장소(지도) 카드 — 기존 글 239건의 장소 첨부와 **같은 HTML** 을 만든다.
//
// 기존 글은 네이버에서 가져올 때 변환기(choice-homepage/scripts/naver_import.py)가
// 아래 모양으로 심어 뒀고, 홈페이지 .prose .se-map 스타일이 그걸 그린다.
// 에디터에서 새로 넣는 장소도 똑같은 모양이어야 새 글과 기존 글이 섞여도 티가 안 난다.
//
//   <a class="se-map" href="https://map.naver.com/p/search/{장소명}" target="_blank" rel="noopener noreferrer">
//     <span class="se-map-pin">{초록 핀 svg}</span>
//     <span class="se-map-body">
//       <span class="se-map-name">서울출입국외국인청</span>
//       <span class="se-map-addr">서울특별시 양천구 목동동로 151</span>
//     </span>
//   </a>
//
// 마크업을 바꾸면 naver_import.py 의 render() 도 함께 바꿔야 한다(둘이 같은 모양을 만든다).

const PIN_PATH =
	"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z";

export const naverMapHref = (name: string) =>
	`https://map.naver.com/p/search/${encodeURIComponent(name)}`;

const attr = (el: HTMLElement, sel: string) => el.querySelector(sel)?.textContent?.trim() ?? "";

export const NaverMap = Node.create({
	name: "naverMap",
	group: "block",
	atom: true,
	draggable: false,
	selectable: true,

	addAttributes() {
		return {
			name: { default: "" },
			addr: { default: "" },
			// 기존 글에서 읽어 들일 때 원문 링크를 그대로 지킨다. 없으면 장소명으로 만든다.
			href: { default: "" },
		};
	},

	parseHTML() {
		return [
			{
				tag: "a.se-map",
				// Link 마크보다 먼저 이 규칙이 <a> 를 가져가야 한다(기본 우선순위 50).
				priority: 100,
				getAttrs: (el) => ({
					name: attr(el as HTMLElement, ".se-map-name"),
					addr: attr(el as HTMLElement, ".se-map-addr"),
					href: (el as HTMLElement).getAttribute("href") ?? "",
				}),
			},
		];
	},

	renderHTML({ node }) {
		const name = (node.attrs.name as string) || "";
		const addr = (node.attrs.addr as string) || "";
		const href = (node.attrs.href as string) || naverMapHref(name);
		return [
			"a",
			{ class: "se-map", href, target: "_blank", rel: "noopener noreferrer" },
			[
				"span",
				{ class: "se-map-pin" },
				[
					"svg",
					{
						width: "22",
						height: "22",
						viewBox: "0 0 24 24",
						fill: "#2db400",
						"aria-hidden": "true",
					},
					["path", { d: PIN_PATH }],
				],
			],
			[
				"span",
				{ class: "se-map-body" },
				["span", { class: "se-map-name" }, name],
				["span", { class: "se-map-addr" }, addr],
			],
		];
	},

	addCommands() {
		return {
			setNaverMap:
				({ name, addr }) =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						attrs: { name, addr: addr ?? "", href: naverMapHref(name) },
					}),
		};
	},
});
