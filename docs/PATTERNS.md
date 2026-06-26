# 구현 패턴 (Cookbook) — choice-admin

> 새 구현은 이 패턴을 따른다. 구조는 `docs/ARCHITECTURE.md`, 코드 컨벤션 원문은 루트 `CLAUDE.md`.

## 코드 컨벤션 (요지)
- 화살표 함수 + **named export**. default export 금지(단 라우트 파일의 `export const Route`는 규약).
- `type`만(인터페이스 금지), `any` 금지→`unknown`. Props 타입명 `{Component}Props`.
- 파일 kebab-case · 컴포넌트 PascalCase · 훅 `useXxx` · 핸들러 `handleXxx` · boolean `is/has`.
- 비동기 `async/await`, null 체크 `??`, 주석 한국어.
- 동적 className은 `cn(...)`(`@/lib/utils`).

## 스타일링 — Tailwind className 우선 (인라인 style 금지)
admin은 **Tailwind className으로 표준화**한다. `style={{}}` 인라인 스타일은 쓰지 않는다(동적 값도 arbitrary value로 표현). 동적 분기는 `cn(...)`.
- 시맨틱 색은 Tailwind 매핑 클래스: `text-foreground`(=heading), `text-muted-foreground`, `bg-card`, `bg-muted`(=surface-subtle), `bg-accent`/`text-accent-foreground`, `bg-primary`/`text-primary-foreground`, `border-border`, `text-destructive`.
- 매핑 안 된 브랜드 토큰은 arbitrary value: `text-[var(--text-body)]`, `bg-[var(--surface-sunken)]`, `shadow-[var(--shadow-md)]` 등. 하드코딩 hex 금지(상태색 등 불가피한 경우만).
- 아이콘: `lucide-react`, `size={18~22} strokeWidth={1.75}`.

## DS 컴포넌트 사용 — `@/components/ui/ds`
공통 UI는 `ds.tsx`(Tailwind/cva 기반)를 우선. shadcn `ui/*`는 보조.
```tsx
import { Button, Card, CardTitle, CardBody, Badge, Input, Label, Textarea } from "@/components/ui/ds";

<Button variant="primary|outline|secondary|ghost" size="sm|md|lg" onClick={...} disabled={...}>저장</Button>
<Card hover className="p-8">...</Card>   // 패딩은 className(기본 p-6)
<Input value={v} onChange={e=>setV(e.target.value)} invalid={hasError} />
```
- hover/focus는 **cva variant + Tailwind hover:/focus-visible:** 로 처리(JS 상태 금지).
- `Card`에 `padding` prop 없음 — `className="p-8"` 등으로 조절(기본 `p-6`).

## 화면(라우트) 추가
1. `src/routes/_app/<name>.tsx`:
   ```tsx
   import { createFileRoute } from "@tanstack/react-router";
   export const Route = createFileRoute("/_app/<name>")({ component: XxxPage });
   function XxxPage() { return (<div style={{ maxWidth: 1180 }}>…</div>); }
   ```
2. 사이드바 메뉴는 `components/admin/app-sidebar.tsx`의 **`NAV_ITEMS`** 에 추가(라벨·아이콘·to). 상단바 타이틀은 NAV_ITEMS에서 자동 도출.
3. 라우트 추가 후 타입이 안 잡히면 `npx vite build`로 routeTree 재생성.
- 화면 헤더 패턴: `<h2 24px/700/-0.02em>제목</h2>` + `<p 15px var(--text-muted)>설명</p>`.

## Supabase 데이터 (조회/수정)
- 클라이언트는 `@/lib/supabase`(싱글톤). 로그인 세션이 붙어 **authenticated**로 동작 → RLS가 통제.
- 조회는 훅으로(`useContacts` 참고): `select` → 상태 보관, 로딩/에러 처리.
- 수정은 **낙관적 업데이트** 후 실패 시 refetch(롤백):
  ```ts
  setRows(prev => prev.map(r => r.id===id ? {...r, ...patch} : r));
  const { error } = await supabase.from("table").update(patch).eq("id", id);
  if (error) { console.error(error.message); await refetch(); }
  ```
- 새 테이블/컬럼은 Supabase(SQL)로 만들고 **`types/database.ts`** 에 타입 추가, **authenticated RLS 정책**(읽기/쓰기) 필요.

## 모달 (a11y)
- 배경은 `<button aria-label="배경 닫기" onClick={onClose}>`(절대배치), 콘텐츠는 별도 `<div role="dialog" aria-modal>`. 정적 `<div onClick>` 금지(biome a11y). Esc는 `document` keydown useEffect로. (`inquiry-detail-modal.tsx` 참고)

## 상태/라벨 매핑
- 상담 상태·업무분야 라벨은 `@/lib/contacts`(`STATUS_META`/`STATUS_ORDER`/`CONSULT_LABELS`) 단일 출처.

## 날짜
- `@/lib/format`: `formatDateFull`(YYYY. MM. DD. A hh:mm), `formatDateCompact`. KST. dayjs ko 로케일.

## 검증 · 커밋
```
pnpm lint:fix && pnpm lint && pnpm build   # build = tsc -b + vite (타입검사 포함)
git add -A && git commit ...               # 커밋 메시지: 한글 시작, conventional 타입
git push origin main
```
- 커밋 메시지 트레일러(권장): `Constraint:` / `Confidence:` / `Scope-risk:` (CLAUDE.md OMC 규약).
- pre-commit이 biome를 staged에 자동 적용. `design/`은 lint 제외.
