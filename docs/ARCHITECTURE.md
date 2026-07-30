# 아키텍처 — 초이스 행정사 관리자(choice-admin)

> 이 문서가 **실제 구현 구조**의 우선 기준이다. 루트 `CLAUDE.md`의 일부 "Project Structure" 예시는 보일러플레이트 잔재이니, 충돌 시 이 문서를 따른다.

## 무엇인가
초이스 행정사 사무소 **운영 관리자(SPA)**. 홈페이지(`choice-homepage`)와 **같은 Supabase 프로젝트**(`pohfmrzgtoxdbwdsrckt`)를 공유한다.
- 상담 문의(홈 문의폼 → contacts) 확인·상태/메모 관리
- 후기 등록·노출 관리(review_images) — 구현됨
- 블로그 작성·발행(blog_posts) — 구현됨(Tiptap 에디터 + 임시저장 30일 보관)

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
    _app/blog.tsx              # 블로그 목록(검색·대표글·페이지네이션) — 작성/수정은 아래 별도 URL로 이동
    _app/blog_.new.tsx         # /blog/new — 새 글 작성(새로고침에도 유지)
    _app/blog_.$postId.tsx     # /blog/{id} — 글 수정(새로고침에도 유지)
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
- **하위 URL을 부모 화면 안에 넣지 않을 때는 파일명에 `_` 접미사**(`blog_.new.tsx` → `/blog/new`). `blog.tsx`가 Outlet 없는 leaf라서 `blog.new.tsx`로 두면 렌더되지 않는다. 작성/수정 화면이 이 방식(→ 새로고침해도 화면 유지, "목록으로"는 `?page=`로 보던 페이지 복귀).
- `isMockMode`(env 없을 때) 면 가드 통과(미리보기).
- **로그인 아이디**: 폼은 "아이디" 입력 → `ADMIN_ALIASES`(login.tsx)로 한글 아이디(`최서연`)를 실제 이메일(`seoyeon@kvisa1345.com`)로 매핑 후 `signInWithPassword`. 관리자 추가 시 alias 한 줄 추가.
- routeTree.gen.ts는 **TanStackRouterVite 플러그인이 빌드/dev 시 자동 생성**. 라우트 추가 후 타입이 안 잡히면 `npx vite build` 한 번으로 재생성(아래 검증 참고).

## Supabase (홈페이지와 공유 DB)
- 클라이언트: **anon 키**(`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`). 로그인하면 세션이 붙어 **authenticated** 권한으로 동작 → RLS가 접근을 통제.
- 테이블(관리자 관점):
  - **contacts**(홈 문의폼 적재) — 컬럼: name·phone·email·nationality·current_visa·consult_field·message·privacy_consent·source·status·memo·created_at·updated_at. `status ∈ (new,in_progress,done,hold)`. RLS: **authenticated SELECT/UPDATE 허용**, INSERT는 홈페이지가 service_role로. 관리자는 상태·메모만 수정.
  - **blog_posts / blog_categories / blog_authors**(홈페이지 블로그) — 관리자가 Tiptap 에디터로 작성·발행. RLS: 공개(anon) SELECT는 published만, **관리 작업은 `public.is_admin()` 통과한 계정만**(2026-07-30 권한 정리). status ∈ (draft, published, archived).
    - **임시저장(draft) 보관 30일** — `updated_at` 기준. `purgeExpiredDrafts()`(lib/blog.ts)가 `status=draft AND updated_at < now-30d`만 삭제하고, **블로그 목록 진입 시 + 임시저장 목록 모달 열 때** 실행된다(DB 크론 아님 → 접속이 없으면 그 사이엔 남아 있고 다음 접속에 정리). 기간은 `DRAFT_RETENTION_DAYS` 단일 출처.
    - 발행글을 "임시저장"으로 다시 저장하면 `published_at`이 null이 되어 홈페이지에서 내려간다(발행 취소).
    - 미구현: 글 삭제·만료 시 `blog` 버킷의 업로드 이미지는 남는다(스토리지 정리 없음).
  - **reviews** — 후기(tag·country·initial·flag·title·body·is_published·sort_order). RLS: anon은 is_published만 SELECT, authenticated CRUD. 홈페이지가 노출 후기를 ISR로 읽음.

  - **storage bucket `blog`**(공개 읽기) — 본문·커버 이미지. 업로드/수정/삭제는 authenticated(`uploads/` 경로).
  - **auth.users** — 관리자 계정(예: seoyeon@kvisa1345.com).
- 스키마 변경은 Supabase Management API/SQL로 하고 `types/database.ts`를 함께 갱신.

### 권한 모델 (2026-07-30 정리 — `docs/sql/2026-07-30-authz-hardening.sql`)
`authenticated` 라는 이유만으로 권한을 주지 않는다. **`public.admins` 화이트리스트 + `public.is_admin()`** 이 단일 판정 지점이다.

| 역할 | blog_posts | categories·authors | review_images | contacts | storage(blog·reviews) |
|---|---|---|---|---|---|
| anon(방문자) | published SELECT | SELECT | is_published SELECT | 접근 불가 | 공개 읽기만 |
| authenticated + admins 등록 | 전체 CRUD | SELECT | 전체 CRUD | SELECT + status·memo UPDATE | 업로드·수정·삭제 |
| authenticated 미등록 | 전부 거부 | 거부 | 거부 | 거부 | 거부 |
| service_role(홈페이지 서버액션) | — | — | — | INSERT(문의 접수) | — |

- **회원가입 차단**: Supabase Auth `disable_signup = true`(외부인이 계정을 만들어 authenticated 가 되는 경로 차단), 비밀번호 최소 12자.
- **관리자 추가**: `insert into admins(user_id, email) select id, email from auth.users where email = '...';` (계정 생성은 대시보드에서 초대)
- anon 은 public 스키마 전체에서 INSERT/UPDATE/DELETE 권한이 회수됨(RLS 와 이중 방어).
- **contacts**: 이전에는 `authenticated` 에 테이블 권한이 아예 없어 관리자 문의 화면이 42501 로 비어 보였다 → SELECT + (status, memo) UPDATE 만 부여해 복구.
- `contact_throttle`: 문의 폼 레이트리밋용(IP 해시). service_role 전용.
- **개인정보 보관기간**: 문의는 홈페이지 Vercel Cron(`/api/cron/retention`, 매일)이 "처리 완료 후 3년" 기준으로 삭제한다. 어드민에는 문의 삭제 기능·권한이 없다(DELETE 미부여).
- **후기 게시 동의·마스킹 기록**: `review_images.consent_confirmed` · `masked_confirmed` · `consent_note`. 후기 저장 시 두 체크가 필수이고, 기록이 없는 후기는 목록에 "확인 필요"로 표시된다(기존 17건 포함 — 수정 화면에서 확인하면 사라진다).

## 검증 · 배포
- **타입검사 = `pnpm build`**(`tsc -b && vite build`). 별도 check-types 스크립트 없음. (`pnpm lint`/`lint:fix`/`format` = Biome)
- pre-commit(husky+lint-staged): staged `*.{ts,tsx}`에 biome check/format.
- 라우트 추가 후 tsc가 새 라우트를 모르면 `npx vite build`로 routeTree 재생성 → 다시 `pnpm build`.
- git: `origin` = `git@github-personal:choice-office/admin.git`(개인 SSH). main push.
