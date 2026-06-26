# 아키텍처 — 초이스 행정사 관리자(choice-admin)

> 이 문서가 **실제 구현 구조**의 우선 기준이다. 루트 `CLAUDE.md`의 일부 "Project Structure" 예시는 보일러플레이트 잔재이니, 충돌 시 이 문서를 따른다.

## 무엇인가
초이스 행정사 사무소 **운영 관리자(SPA)**. 홈페이지(`choice-homepage`)와 **같은 Supabase 프로젝트**(`pohfmrzgtoxdbwdsrckt`)를 공유한다.
- 상담 문의(홈 문의폼 → contacts) 확인·상태/메모 관리
- 후기 등록·노출 관리(reviews) — *구현 예정*
- 블로그/공지 작성·발행(blog_posts) — *구현 예정*

## 스택
- **Vite + React 19 + TypeScript** (Next.js 아님 — SSR/Server Action/next-image 없음)
- **TanStack Router**(파일 기반, `src/routes/`) + TanStack Table
- **Supabase**(`@supabase/supabase-js`) — Auth(이메일/비번) + DB(anon 키 + RLS)
- 스타일: **토프 브라운 DS**(홈페이지와 동일 토큰) — `src/index.css`(토큰) + **Tailwind className** + `ds.tsx`(cva). 인라인 `style` 금지.
- Lucide 아이콘 · Biome + husky + lint-staged · pnpm · Vercel(정적 배포)

## 디렉터리 (실제)
```
src/
  routes/                      # TanStack 파일 라우팅 (routeTree.gen.ts 자동생성·수정금지)
    __root.tsx                 # Outlet only
    index.tsx                  # / → 세션 있으면 /dashboard, 없으면 /login
    login.tsx                  # 로그인(Supabase Auth). 세션 있으면 /dashboard로 redirect
    _app.tsx                   # ★ pathless 레이아웃: 인증가드(beforeLoad) + 사이드바 + 상단바 + Outlet
    _app/dashboard.tsx         # 대시보드
    _app/inquiries.tsx         # 상담 문의 관리(필터·테이블·페이지네이션·상세모달)
    _app/reviews.tsx           # 후기 관리(CRUD·노출 토글)
    _app/blog.tsx              # 블로그·공지 목록 + 작성기(인페이지 에디터 토글)
    _app/settings.tsx          # 설정 [구현 예정]
  components/
    admin/                     # 화면 전용 컴포넌트
      app-sidebar.tsx          # 접이식 사이드바 + NAV_ITEMS(메뉴 단일 출처)
      app-header.tsx           # 상단바(타이틀·알림·유저메뉴·로그아웃)
      inquiry-detail-modal.tsx # 상담 상세 모달(상태/메모 저장)
      status-badge.tsx         # 상태 배지
      screen-placeholder.tsx   # 미구현 화면 자리표시자(구현 시 교체·제거)
    ui/                        # 공용 UI
      ds.tsx                   # ★ DS 컴포넌트: Button/Card/Badge/Input/Label/Textarea (홈페이지와 동일)
      button/calendar/pagination/popover.tsx  # shadcn(base-nova/neutral). 사이트는 주로 ds.tsx 사용
  lib/
    supabase.ts                # Supabase 클라이언트(싱글톤) + isMockMode
    contacts.ts                # 상태 메타(STATUS_META/ORDER) + consult_field 라벨
    format.ts                  # dayjs 날짜 포맷(KST)
    utils.ts                   # cn()
  hooks/
    use-contacts.ts            # 상담문의 조회 + 상태/메모 수정(낙관적)
  types/database.ts            # ★ Supabase 테이블 타입(실스키마). Contact, ContactStatus
  index.css                    # ★ 토큰(토프 브라운) + shadcn 매핑 + Noto Sans KR (DS는 ds.tsx/Tailwind로 표현)
  main.tsx                     # RouterProvider 진입점
design/                        # Claude Design 산출물(토큰 CSS + 어드민 목업). biome 제외, 참고용
```

## 라우팅 · 인증
- 파일 기반. **`_app.tsx`(pathless 레이아웃)** 가 인증 영역을 감싼다: `beforeLoad`에서 `supabase.auth.getSession()` 확인, 미인증 → `throw redirect({ to: "/login" })`. URL은 `_app` 접두사 없이 `/dashboard` 등으로 노출.
- 새 인증 화면은 `src/routes/_app/<name>.tsx` 로 추가하면 자동으로 레이아웃·가드 적용 + 사이드바 활성표시(경로 prefix).
- `isMockMode`(env 없을 때) 면 가드 통과(미리보기).
- **로그인 아이디**: 폼은 "아이디" 입력 → `ADMIN_ALIASES`(login.tsx)로 한글 아이디(`최서연`)를 실제 이메일(`seoyeon@kvisa1345.com`)로 매핑 후 `signInWithPassword`. 관리자 추가 시 alias 한 줄 추가.
- routeTree.gen.ts는 **TanStackRouterVite 플러그인이 빌드/dev 시 자동 생성**. 라우트 추가 후 타입이 안 잡히면 `npx vite build` 한 번으로 재생성(아래 검증 참고).

## Supabase (홈페이지와 공유 DB)
- 클라이언트: **anon 키**(`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`). 로그인하면 세션이 붙어 **authenticated** 권한으로 동작 → RLS가 접근을 통제.
- 테이블(관리자 관점):
  - **contacts**(홈 문의폼 적재) — 컬럼: name·phone·email·nationality·current_visa·consult_field·message·privacy_consent·source·status·memo·created_at·updated_at. `status ∈ (new,in_progress,done,hold)`. RLS: **authenticated SELECT/UPDATE 허용**, INSERT는 홈페이지가 service_role로. 관리자는 상태·메모만 수정.
  - **blog_posts / blog_categories / blog_authors**(홈페이지 블로그) — 관리자가 Tiptap 에디터로 작성·발행. RLS: 공개 SELECT는 published만, **authenticated는 전체 SELECT(초안 포함)+INSERT/UPDATE/DELETE**. status ∈ (draft, published, archived).
  - **reviews** — 후기(tag·country·initial·flag·title·body·is_published·sort_order). RLS: anon은 is_published만 SELECT, authenticated CRUD. 홈페이지가 노출 후기를 ISR로 읽음.
  - **storage bucket `blog`**(공개 읽기) — 본문·커버 이미지. 업로드/수정/삭제는 authenticated(`uploads/` 경로).
  - **auth.users** — 관리자 계정(예: seoyeon@kvisa1345.com).
- 스키마 변경은 Supabase Management API/SQL로 하고 `types/database.ts`를 함께 갱신.

## 검증 · 배포
- **타입검사 = `pnpm build`**(`tsc -b && vite build`). 별도 check-types 스크립트 없음. (`pnpm lint`/`lint:fix`/`format` = Biome)
- pre-commit(husky+lint-staged): staged `*.{ts,tsx}`에 biome check/format.
- 라우트 추가 후 tsc가 새 라우트를 모르면 `npx vite build`로 routeTree 재생성 → 다시 `pnpm build`.
- git: `origin` = `git@github-personal:choice-office/admin.git`(개인 SSH). main push.
