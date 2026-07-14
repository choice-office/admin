import { type CommandProps, Extension } from "@tiptap/react";

// 문단/제목 줄 간격(line-height) — 노드 속성으로 적용해 <p style="line-height:..."> 로 직렬화.
// (text-style 의 LineHeight 는 이 프로젝트에서 문단에 적용되지 않아 직접 구현)
const LH_TYPES = ["paragraph", "heading"];

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		lineHeight: {
			setLineHeight: (lineHeight: string) => ReturnType;
			unsetLineHeight: () => ReturnType;
		};
	}
}

const changeLineHeight =
	(value: string | null) =>
	({ state, dispatch }: CommandProps) => {
		const { from, to } = state.selection;
		const tr = state.tr;
		let changed = false;
		state.doc.nodesBetween(from, to, (node, pos) => {
			if (!LH_TYPES.includes(node.type.name)) return;
			if (node.attrs.lineHeight !== value) {
				tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: value });
				changed = true;
			}
		});
		if (changed && dispatch) dispatch(tr);
		return changed;
	};

export const LineHeight = Extension.create({
	name: "lineHeight",

	addGlobalAttributes() {
		return [
			{
				types: LH_TYPES,
				attributes: {
					lineHeight: {
						default: null,
						parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
						renderHTML: (attrs) =>
							attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setLineHeight: (value: string) => changeLineHeight(value),
			unsetLineHeight: () => changeLineHeight(null),
		};
	},
});
