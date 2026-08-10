import { Extension } from "@tiptap/core";

// Enter 를 "줄바꿈"으로 — 네이버 블로그 편집기와 같은 손버릇.
//
// 왜 필요한가 — 기존 글 239건은 네이버에서 가져온 것이라 본문 한 덩어리가 <p> 하나이고
// 줄바꿈은 그 안의 <br> 다:
//     <p class="se-t">첫 줄<br>둘째 줄<br><br>한 줄 띄고 다음 줄</p>
// Tiptap 기본값은 Enter 마다 <p> 를 새로 만들기 때문에, 같은 원고를 옮겨 적어도
//     <p>첫 줄</p><p>둘째 줄</p>…
// 가 되어 줄마다 문단 여백(1.5em)이 붙는다. 글이 기존 글보다 훨씬 성기게 보이는 원인.
//
// 그래서 문단 안에서는 Enter = <br>, 새 문단은 Shift+Enter 로 둔다.
// 목록·체크리스트·제목·코드블록에서는 Enter 가 "다음 항목/문단"이어야 하므로 손대지 않는다
// (false 를 돌려주면 Tiptap 기본 동작이 이어서 실행된다).
const KEEP_DEFAULT = ["listItem", "taskItem", "codeBlock", "heading"];

export const NaverEnter = Extension.create({
	name: "naverEnter",

	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				if (KEEP_DEFAULT.some((n) => editor.isActive(n))) return false;
				return editor.commands.setHardBreak();
			},
			"Shift-Enter": ({ editor }) => {
				if (KEEP_DEFAULT.some((n) => editor.isActive(n))) return false;
				return editor.commands.splitBlock();
			},
		};
	},
});
