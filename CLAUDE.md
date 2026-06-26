# 초이스 행정사 관리자 (choice-admin)

초이스 행정사 사무소 운영 관리자(Vite SPA). 홈페이지(`choice-homepage`)와 **같은 Supabase 프로젝트**를 공유한다.
상담 문의 관리 + 후기/블로그 관리(작성 중). 토프 브라운 DS(홈페이지와 동일).

## ⚠️ 작업 전 `docs/` 먼저 읽기 (실제 설계 우선)
이 저장소는 admin-boilerplate에서 출발했지만 **구조가 달라졌다**(예: `_app` pathless 레이아웃, `ds.tsx` DS 컴포넌트, contacts memo/RLS). 아래 "Project Structure"보다 **`docs/`를 우선**한다:
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — 실제 구조·라우팅/인증·Supabase 스키마/RLS·검증/배포
- **[docs/PATTERNS.md](docs/PATTERNS.md)** — 구현 Cookbook(DS 컴포넌트·화면 추가·Supabase 조회/수정·모달·커밋)

코드 변경으로 문서 사실이 달라지면 함께 갱신한다.

## Tech Stack
- **Framework**: Vite + React 19 + TypeScript
- **Router**: TanStack Router (파일 기반, 타입 안전)
- **Table**: TanStack Table
- **Styling**: Tailwind CSS v4
- **Auth/DB**: Supabase (anon key, 클라이언트 직접 연결)
- **Excel**: xlsx
- **Icons**: Lucide React
- **Lint/Format**: Biome + husky + lint-staged
- **Package Manager**: pnpm
- **Deploy**: Vercel (정적 배포)

## Project Structure (요약 — 상세·최신은 docs/ARCHITECTURE.md)
```
src/routes/
  __root · index · login         # index: 세션 분기 / login: 아이디(별칭→이메일) 로그인
  _app.tsx                        # 인증 영역 레이아웃(가드+사이드바+상단바)
  _app/{dashboard,inquiries,reviews,blog,settings}.tsx
src/components/{admin, ui/ds.tsx} · src/lib/{supabase,contacts,format,utils}
src/hooks/use-contacts.ts · src/types/database.ts · src/index.css(토큰+.ds-*)
```

## Commands
- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm lint` / `pnpm lint:fix` — Biome lint
- `pnpm format` — Biome 포맷팅

## 새 프로젝트 적용 시 (★ 필수)
1. `.env.local` 생성 — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 입력
2. `src/types/database.ts` — Supabase 테이블 타입 확인 및 수정
3. `src/components/admin/app-sidebar.tsx`의 `NAV_ITEMS` — 메뉴 구성 조정
4. Supabase Dashboard → contacts 테이블 RLS:
   - `authenticated` 역할에 SELECT 정책 추가
5. Supabase Auth → 관리자 계정 생성 (이메일/비번)
6. Vercel 배포 후 도메인 연결 (`admin.클라이언트도메인.com`)

## Supabase RLS 정책 (필수)
```sql
-- contacts 테이블에서 로그인한 사용자만 조회 가능
create policy "authenticated can select"
  on contacts for select
  to authenticated
  using (true);
```

## Code Conventions

### 함수 & Export
- 화살표 함수 사용. function 선언문 금지
- named export만 사용: `export const fn = () => {}`
- 단, TanStack Router의 `component:` 에 전달하는 페이지 컴포넌트는 function 선언 허용
- default export 금지 (TanStack Router Route 제외)

### TypeScript
- `type`만 사용. `interface` 금지
- `any` 금지 → `unknown` 사용
- Props 네이밍: `{컴포넌트명}Props`

### 네이밍
- 폴더/파일: kebab-case
- 컴포넌트 export명: PascalCase
- 훅: camelCase + `use` 접두사
- 이벤트 핸들러: `handle` 접두사 (`handleLogin`, `handleExport`)
- Boolean: `is`/`has` 접두사 (`isLoading`, `hasError`)

### 코드 스타일
- 비동기: `async/await`만. `.then()` 금지
- null 체크: `??` 우선
- 주석: 한국어 기본

### 라우팅 (TanStack Router)
- 인증 체크: `beforeLoad`에서 `supabase.auth.getSession()` 확인
- 미인증 시: `throw redirect({ to: "/login" })`
- 새 protected 라우트 추가 시 `beforeLoad` 반드시 포함

### Supabase 사용 패턴
- 클라이언트는 `@/lib/supabase`에서 import (싱글톤)
- 관리자 페이지는 `anon key` 사용 (RLS로 접근 제어)
- 데이터 조회는 컴포넌트 내 `useEffect`에서 직접 호출

### 환경변수
- `VITE_` prefix 필수 (Vite 클라이언트 노출 규칙)
- `.env.example`에 목록 유지, `.env.local`은 gitignore

### 스타일링
- Tailwind 유틸리티 + `cn()` (`@/lib/utils`)
- 색상: gray 계열 기반 (관리자 UI)
- 반응형: sm 브레이크포인트 기준

### routeTree.gen.ts
- TanStack Router가 자동 생성. **절대 수정하지 않음**
- `.cursorignore`에 포함되어 있음

## 자동 작업 모드 (중요 — 항상 적용)

**어드민 세팅·클라이언트 적용 요청이 들어오면 `.omc/skills/admin-start/SKILL.md`를 즉시 읽고 그 로직에 따라 자동으로 모드를 선택해서 실행한다. 사용자에게 모드를 물어보지 않는다.**

- 정보가 부족하면 → 자동으로 인터뷰 진행 후 admin-kickoff
- 정보가 충분하면 → 자동으로 admin-kickoff 실행
- 여러 파일 에러 수정 → ultrawork
- 완성까지 반드시 → ralph

## AI 작업 원칙 (oh-my-claudecode)

### 빌드 주의사항
- `pnpm build`는 pre-commit hook이 `tsc`를 실행하므로 sandbox 외부에서 실행 필요 (`required_permissions: ["all"]`)

### 작업 규모별 접근법
- **단순 수정 (1~2파일)**: 바로 처리
- **범위가 크거나 요구사항 모호**: Plan 모드 또는 `ralplan` 먼저 제안
- **독립 작업 병렬 가능**: `team` 모드 제안
- **버그인데 원인 불명확**: `debugger` 에이전트 활용
- **완성될 때까지 검증 필요**: `ralph` 루프 제안
- **파일 추가·수정 후**: `lsp_diagnostics`로 타입 에러 확인

### 커밋 형식 (OMC Commit Protocol)
커밋 메시지에 의사결정 맥락 트레일러 포함:
```
<type>: <요약>

<변경 내용>

Constraint: <결정을 제약한 조건>
Rejected: <검토했으나 기각한 대안> | <이유>
Confidence: high | medium | low
Scope-risk: narrow | moderate | broad
```

### 핵심 파일
- `src/index.css` — DS 토큰(토프 브라운) + `.ds-*` 컴포넌트 클래스
- `src/components/ui/ds.tsx` — DS 컴포넌트(Button/Card/Badge/Input/Label/Textarea)
- `src/types/database.ts` — Supabase 테이블 타입(실스키마)
- `src/components/admin/app-sidebar.tsx` — `NAV_ITEMS`(사이드바 메뉴 단일 출처)
- `src/lib/supabase.ts` · `src/lib/contacts.ts`(상태·라벨)
> 상세 구현 패턴은 docs/PATTERNS.md.
