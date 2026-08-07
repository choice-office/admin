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
    _app/blog.tsx              # 블로그 목록(검색·카테고리·페이지네이션) — 작성/수정은 아래 별도 URL로 이동
    _app/home.tsx              # 홈 노출 — 쇼츠 4칸 + 블로그 대표글 4칸(아래 "홈 노출" 절)
    _app/blog_.new.tsx         # /blog/new — 새 글 작성(새로고침에도 유지)
    _app/blog_.$postId.tsx     # /blog/{id} — 글 수정(새로고침에도 유지)
    _app/settings.tsx          # 설정 [구현 예정]
  components/
    admin/                     # 화면 전용 컴포넌트
      app-sidebar.tsx          # 접이식 사이드바 + NAV_ITEMS(메뉴 단일 출처)
      app-header.tsx           # 상단바(타이틀·알림·유저메뉴·로그아웃)
      inquiry-detail-modal.tsx # 상담 상세 모달(상태/메모 저장)
      home-featured-posts.tsx  # 홈 대표글 4칸(칸별 고정/자동)
      post-picker-modal.tsx    # 대표글 칸에 넣을 발행글 고르기(검색·카테고리·페이지네이션)
      status-badge.tsx         # 상태 배지
      screen-placeholder.tsx   # 미구현 화면 자리표시자(구현 시 교체·제거)
    ui/                        # 공용 UI
      ds.tsx                   # ★ DS 컴포넌트: Button/Card/Badge/Input/Label/Textarea (홈페이지와 동일)
      button/calendar/pagination/popover.tsx  # shadcn(base-nova/neutral). 사이트는 주로 ds.tsx 사용
      pagination-bar.tsx       # 공용 페이지네이션(문의·후기·블로그 공통) — 규칙은 lib/pagination.ts
  lib/
    supabase.ts                # Supabase 클라이언트(싱글톤) + isMockMode
    contacts.ts                # 상태 메타(STATUS_META/ORDER) + consult_field 라벨
    format.ts                  # dayjs 날짜 포맷(KST) — Full/Compact/DateOnly
    pagination.ts              # ★ 10개 블록 규칙 buildPageBlock — 홈페이지 src/lib/pagination.ts 와 동일
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
    - **★ 대표글 지정은 수정일(`updated_at`)을 바꾸지 않는다** — `set_updated_at` 트리거 규칙(docs/sql/2026-07-30-featured-keeps-updated-at.sql):
      ① `updated_at` 을 명시적으로 지정한 UPDATE 는 그 값을 존중 ② `is_featured`/`featured_order` 만 바뀌면 수정일 유지
      ③ 그 외 실제 수정은 `now()`. → 목록 정렬과 공개 JSON-LD `dateModified` 가 ★ 조작으로 흔들리지 않는다.
    - 대표글(`is_featured`/`featured_order`)은 칸 단위 모델이다 → 아래 "홈 노출" 절.
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

## 홈 노출 (`/home`) — 쇼츠 4칸 + 대표글 4칸
홈페이지 첫 화면에 무엇이 나갈지 정하는 화면. 두 섹션 모두 **칸(슬롯) 단위**이고 별도 설정 테이블 없이 데이터에서 상태를 유도한다.

### 공통 모델 — 칸마다 "고정" 또는 "자동"
칸 번호가 **홈의 노출 순서와 1:1로 일치**한다. 2번 칸에 넣은 것은 홈에서도 2번째다.

### ① 영상으로 보는 비자 정보 (유튜브 쇼츠)
- 데이터: `home_shorts(slot 1~4, youtube_id)` — 홈페이지 `supabase/migrations/0004_home_shorts.sql`. 훅 `hooks/use-home-shorts.ts`.
- 링크를 붙여넣으면 `parseYoutubeId()` 가 11자 ID 만 뽑아 저장한다(shorts/youtu.be/watch?v=/embed 모두 인식). 썸네일은 저장하지 않고 `i.ytimg.com` 에서 가져온다. **칸에는 전체 링크를 보여준다**(저장은 ID) — 붙여넣은 것과 보이는 것이 달라 혼란스러웠고, ID 만 보이면 오타를 알아채기 어렵다.
- **저장 전 `videoExists()` 로 확인한다.** 형식(11자)만 맞고 실제로 없는 영상이면 홈에서 그 칸만 조용히 빈다 — ID 를 한 글자만 잘못 고쳐도 형식은 그대로다. 확인 URL 은 `i.ytimg.com/vi/{id}/oardefault.jpg`(홈 카드가 쓰는 것과 동일):
  - `oardefault` 는 **쇼츠에만 있고 일반 영상은 404** → "존재 + 쇼츠"를 한 번에 검증한다. 일반 영상 링크도 여기서 막힌다.
  - ★ **i.ytimg.com 은 404 에도 120×90 회색 대체 이미지를 함께 보낸다** → `<img>` 의 `onerror` 가 뜨지 않아 "로드됐으니 존재한다"는 판정은 틀린다(실제로 이 함정에 걸려 오타가 저장됐다). `fetch` 상태코드로 판정하고(CSP `connect-src` 에 `i.ytimg.com` 필요), 막히면 이미지 크기(`isPlaceholderThumbnail`)로 폴백한다.
- 입력 해석은 `parseYoutubeId()` — **유튜브 호스트만 받는다**(`YOUTUBE_HOSTS`). 예전엔 호스트를 안 봐서 `naver.com/watch?v=abcdefghijk` 같은 주소도 ID 로 인식했다(뒤 검증에서 걸리긴 하지만 안내 문구가 엉뚱해진다). 스킴 없이 `youtube.com/shorts/ID` 로 붙여넣어도 인식한다.
- 검사는 `checkShort()` 하나로 모은다 — **① 존재 ② 임베드 재생 가능 ③ 쇼츠(세로)**. 실패 이유(`notfound`/`blocked`/`notshort`)별로 안내 문구가 다르다(`CHECK_FAIL_MESSAGE`).
  - **임베드 가능 여부는 oEmbed**(`youtube.com/oembed`)로 본다: 200=가능(제목도 옴) · 401/403=퍼가기 차단·비공개 · 400/404=없음. **썸네일만으로는 알 수 없다** — 퍼가기를 막은 영상도 썸네일은 그대로다. CORS 허용돼 브라우저에서 직접 호출한다.
  - 쇼츠 여부는 `oardefault` 썸네일 존재로 본다(일반 영상은 404).
- **칸에 영상 제목을 함께 보여준다**(oEmbed). 링크만 보면 어떤 영상인지 알 수 없고, 링크가 잘못되면 제목이 사라져 바로 알아챌 수 있다. 상태는 **칸이 아니라 영상 ID 기준**(`titles[id]`)이라 입력을 바꾸면 제목이 곧바로 따라간다 — 칸 기준으로 뒀을 때 "제목 확인 중…" 이 남는 버그가 있었다.
- 입력을 바꾸면 칸 이름 옆에 **`저장 안 됨`** 배지가 뜨고(누르지 않으면 반영 안 됨), 미리보기에는 **`쇼츠를 찾을 수 없음`** 경고가 덮인다. `↺` 로 원래 링크 복구.
- 저장 후 영상이 삭제·비공개로 바뀌면 여기서는 막을 수 없다 → **공개 렌더가 죽은 칸을 걸러낸다**(홈페이지 `lib/home-shorts.ts` `isPlayable`).
- **채널 최신 쇼츠 가져오기** — 홈페이지 `/api/youtube/shorts`(공개 RSS + `/shorts/{id}` 리다이렉트로 쇼츠 판별, API 키 없음, 10분 캐시)를 호출한다. 브라우저에서 유튜브 RSS 를 직접 못 부르기 때문(CORS). 베이스 URL 은 `VITE_SITE_API_BASE`(미설정 시 `https://kvisa1345.com`).
  - **한계: RSS 는 최근 업로드 15개까지만 준다.** 그보다 예전 영상은 목록에 안 뜨므로 링크를 직접 붙여넣어야 한다(화면에도 문구로 명시). 롱폼이 섞이면 걸러져서 15개보다 적게 나온다.
  - CORS 허용 오리진은 `admin.kvisa1345.com` · `*admin*.vercel.app` · `localhost:*` (route.ts `ALLOWED_ORIGIN`). **실제 관리자 도메인이 빠지면 프로덕션에서만 조용히 막힌다** — 실제로 한 번 겪었다.
- 칸을 비우면 홈이 그 자리를 건너뛴다. 4칸 모두 비우면 홈페이지의 `SHORTS` 폴백이 나간다.

### ② 비자 정보 · 소식 (블로그 대표글)
- 데이터: `blog_posts.is_featured` + `featured_order`. **`featured_order` 는 노출 순서가 아니라 칸 번호(1~4)** 이고 빈틈이 허용된다.
  - `[null, 2, null, null]` → 홈 `[최신1, 고정글, 최신2, 최신3]`. 자동 칸은 글을 발행하면 굴러가고(가장 오래된 것이 밀려 나감) 고정 칸은 그대로.
  - 지정 0개면 4칸 전부 자동 = 최신 발행글 4개.
- 불변식(칸당 1개 · 1~4 · 해제 시 null)은 **DB 제약**이 강제한다 — 홈페이지 `supabase/migrations/0005_blog_featured_slot.sql`(부분 유니크 인덱스 + CHECK).
- 모든 변경은 `setFeaturedSlot(slot, postId | null)` 한 경로로만 처리한다. 유니크 인덱스에 걸리지 않도록 ① 그 칸의 기존 글 ② 넣을 글이 앉아 있던 다른 칸을 먼저 비운 뒤 ③ 앉힌다.
- 화면(`components/admin/home-featured-posts.tsx`): 칸마다 1:1 썸네일 + 제목 + 발행일. **자동 칸도 "지금 그 자리에 나가는 글"** 을 점선 테두리 + 흐린 썸네일로 보여준다 → 홈에 무엇이 걸렸는지 화면에서 바로 확인된다. `[선택하기]` 로 고정, 되돌리기 아이콘으로 자동 복귀, `[전부 자동으로]` 로 일괄 해제.
- 글 선택 모달(`components/admin/post-picker-modal.tsx`): **발행글만**(임시저장·보관은 홈에 걸 수 없다), 제목 검색 + 카테고리 + 페이지네이션(8건/페이지, 클라이언트 필터). 이미 다른 칸에 걸린 글에는 `홈 n` 배지.
- 블로그 관리 화면에는 **조작 없이 `홈 n` 읽기 전용 배지만** 있다(고정=진하게 + 📌, 자동=흐리게). 설정은 여기서만 한다.
- 홈 반영은 ISR 60초 + `unstable_cache` 60초 → **최대 약 2분**.
- 공개 렌더는 홈페이지 `src/lib/blog.ts` 의 `getFeaturedPosts(4)`. **규칙을 바꾸면 그 함수도 함께 고쳐야 한다**(칸 배치 로직이 양쪽에 있다).

## 페이지네이션 (문의·후기·블로그 공통)
- `PaginationBar` 하나만 쓴다. 규칙은 `lib/pagination.ts` 의 `buildPageBlock` — **10개씩 묶는 블록 방식**(11페이지면 11–20 이 통째로, 10에서 `›` 누르면 블록 넘어감).
- `«` 이전 블록 있을 때 · `‹` 2페이지부터 · `›` 마지막 아닐 때 · `»` 다음 블록 있을 때. 안 쓰이는 버튼은 비활성이 아니라 **감춘다**. 1페이지뿐이면 숫자 `1` 만 남아 자리(높이)는 유지된다.
- 좁은 화면(≤640px)은 `isMobilePage()` 로 현재 페이지가 속한 **5개만** 남긴다(`max-sm:hidden`).
- **홈페이지(choice-homepage) `src/lib/pagination.ts` 와 같은 파일 내용**이다. 규칙을 바꿀 땐 두 저장소를 함께 고친다.

## 검증 · 배포
- **타입검사 = `pnpm build`**(`tsc -b && vite build`). 별도 check-types 스크립트 없음. (`pnpm lint`/`lint:fix`/`format` = Biome)
- pre-commit(husky+lint-staged): staged `*.{ts,tsx}`에 biome check/format.
- 라우트 추가 후 tsc가 새 라우트를 모르면 `npx vite build`로 routeTree 재생성 → 다시 `pnpm build`.
- git: `origin` = `git@github-personal:choice-office/admin.git`(개인 SSH). main push.
