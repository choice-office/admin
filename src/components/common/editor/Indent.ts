import { type CommandProps, Extension } from "@tiptap/react";

// 문단/제목 들여쓰기 — margin-left 를 단계(step)로 적용. (목록은 Tab/Shift+Tab 으로 중첩)
const INDENT_TYPES = ["paragraph", "heading"];
const INDENT_STEP = 24; // px
const MAX_INDENT = 10;

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		indent: {
			indent: () => ReturnType;
			outdent: () => ReturnType;
		};
	}
}

const changeIndent =
	(delta: number) =>
	({ state, dispatch }: CommandProps) => {
		const { from, to } = state.selection;
		const tr = state.tr;
		let changed = false;
		state.doc.nodesBetween(from, to, (node, pos) => {
			if (!INDENT_TYPES.includes(node.type.name)) return;
			const cur = (node.attrs.indent as number) || 0;
			const next = Math.min(MAX_INDENT, Math.max(0, cur + delta));
			if (next !== cur) {
				tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
				changed = true;
			}
		});
		if (changed && dispatch) dispatch(tr);
		return changed;
	};

export const Indent = Extension.create({
	name: "indent",

	addGlobalAttributes() {
		return [
			{
				types: INDENT_TYPES,
				attributes: {
					indent: {
						default: 0,
						parseHTML: (element) => {
							const ml = Number.parseInt(element.style.marginLeft || "0", 10);
							return ml ? Math.round(ml / INDENT_STEP) : 0;
						},
						renderHTML: (attributes) => {
							const level = (attributes.indent as number) || 0;
							return level ? { style: `margin-left: ${level * INDENT_STEP}px` } : {};
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			indent: () => changeIndent(1),
			outdent: () => changeIndent(-1),
		};
	},
});
