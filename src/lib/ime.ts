import type { KeyboardEvent } from "react";

/** IME(한글 등) 조합 중에 발생한 키 이벤트인지.
 *
 * 왜 필요한가 — 한글을 입력하다 Enter 를 누르면 keydown 이 **두 번** 온다:
 *   ① 조합을 확정하는 Enter (`isComposing: true`)
 *   ② 진짜 Enter (`isComposing: false`)
 * 둘을 구분하지 않으면 ① 에서도 핸들러가 돌아 버린다. 실제 증상:
 *   · 해시태그 입력에서 태그가 등록되면서 **마지막 글자가 입력창에 한 번 더 남는다**
 *     (핸들러가 입력창을 비운 뒤 조합이 확정되며 그 글자가 다시 들어간다)
 *   · 검색창에서 조합이 덜 끝난 문자열로 검색이 실행된다
 *
 * `keyCode === 229` 는 조합 중임을 알리는 옛 신호로, `isComposing` 을 제대로 주지 않는
 * 브라우저·IME 조합을 위한 이중 안전장치다.
 *
 * 쓰는 법 — Enter/Space/쉼표처럼 **입력을 확정 짓는** 키를 다루는 onKeyDown 맨 앞에 둔다:
 *   onKeyDown={(e) => { if (isImeComposing(e)) return; ... }}
 */
export const isImeComposing = (e: KeyboardEvent<Element>): boolean =>
	e.nativeEvent.isComposing || e.keyCode === 229;
