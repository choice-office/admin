---
name: admin-kickoff
description: 보일러플레이트 기반 외주 어드민 적용 — 클라이언트 정보에서 완성까지
argument-hint: "<클라이언트명, Supabase 정보, contacts 컬럼 구성>"
level: 4
---

<Purpose>
클라이언트 정보(Supabase URL/KEY, contacts 컬럼 구성)를 받아
admin-boilerplate를 새 외주 프로젝트에 적용하고, 빌드·배포까지 완성한다.
</Purpose>

<Use_When>
- 새 외주 프로젝트에 어드민을 처음 세팅할 때
- admin-start 스킬에서 정보 수집 완료 후 넘어올 때
- "어드민 적용해줘", "어드민 세팅 시작해" 같은 요청
</Use_When>

<Do_Not_Use_When>
- contacts 컬럼 하나만 추가/제거할 때 — 직접 수정
- 기존 프로젝트 버그 수정 — 일반 워크플로우
</Do_Not_Use_When>

<Inputs>
필수:
- 클라이언트명 / 어드민 도메인 (예: admin.example.com)
- Supabase URL + ANON KEY
- contacts 테이블 컬럼 구성

권장:
- 관리자 계정 이메일
- 추가 커스텀 컬럼 (회사명, 예산, 서비스 종류 등)
</Inputs>

<Workflow>

## Phase 1: 환경변수 설정

`.env.local` 파일 생성 (gitignore 대상, 직접 작성 안내):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
```

`.env.example` 파일 확인 — 키 목록이 반영되어 있는지 체크.

## Phase 2: contacts 타입 정의 (`src/types/database.ts`)

클라이언트 컬럼 구성에 맞게 `Row`, `Insert`, `Update` 타입 수정.

**기본 컬럼** (시스템 필드 제외):
- `name: string` — 이름
- `email: string` — 이메일
- `phone?: string` — 연락처 (선택)
- `message: string` — 문의 내용

**커스텀 컬럼 추가 예시**:
```ts
Row: {
  // 기본
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  is_read: boolean;
  // ★ 커스텀 추가
  company?: string;   // 회사명
  budget?: string;    // 예산 규모
}
```

`ContactFieldKey`는 `Omit<Contact, ContactSystemKeys>`에서 자동 추론되므로
`ContactSystemKeys` ("id" | "is_read" | "created_at")에 포함되지 않는 컬럼만 추가하면 된다.

## Phase 3: 컬럼 표시 설정 (`src/config/contact-fields.ts`)

`CONTACT_FIELDS` 배열을 클라이언트 구성에 맞게 수정.

**배열 순서 = 테이블 컬럼 순서 = 모달 순서 = 엑셀 순서**

```ts
export const CONTACT_FIELDS: ContactField[] = [
  { key: "name",    label: "이름",     excelWidth: 14, size: 100 },
  { key: "company", label: "회사명",   excelWidth: 20, size: 140 },  // 커스텀
  { key: "phone",   label: "연락처",   excelWidth: 18, size: 130 },
  { key: "email",   label: "이메일",   excelWidth: 34, size: 220 },
  { key: "message", label: "문의 내용", excelWidth: 80, isLong: true },
];
```

**size 가이드**:
- 짧은 텍스트 (이름, 연락처): 100~130px
- 중간 텍스트 (이메일, 회사명): 160~220px
- 긴 텍스트 (문의 내용): size 미설정 → 나머지 공간 자동 배분
- `isLong: true`: 모달에서 전체 너비로 표시, 테이블에서 2줄 말줄임

## Phase 4: Supabase 설정

### 4-1. contacts 테이블 생성 (SQL Editor)

```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,              -- 선택 컬럼
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- ★ 커스텀 컬럼 추가 시
-- alter table contacts add column company text;

alter table contacts enable row level security;
```

### 4-2. RLS 정책 (authenticated만 SELECT 허용)

```sql
-- 로그인한 관리자만 조회 가능
create policy "authenticated can select"
  on contacts for select
  to authenticated
  using (true);

-- 관리자만 읽음 처리 가능
create policy "authenticated can update is_read"
  on contacts for update
  to authenticated
  using (true)
  with check (true);
```

### 4-3. 관리자 계정 생성

Supabase Dashboard → Authentication → Users → Add User:
- 이메일: 클라이언트 관리자 이메일
- 비밀번호: 임시 비밀번호 생성 후 전달

## Phase 5: 빌드 검증

```bash
pnpm lint          # Biome lint 통과 확인
pnpm build         # 프로덕션 빌드 (required_permissions: all)
```

lsp_diagnostics로 타입 에러 0개 확인.

## Phase 6: Vercel 배포

1. Vercel 대시보드 → Import Repository
2. Environment Variables 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 커스텀 도메인 연결: `admin.클라이언트도메인.com`
4. Supabase Authentication → URL Configuration:
   - Site URL: `https://admin.클라이언트도메인.com`
   - Redirect URLs: `https://admin.클라이언트도메인.com/**`

</Workflow>

<Success_Criteria>
- `pnpm build` 성공
- `pnpm lint` 에러 없음
- lsp_diagnostics 타입 에러 0개
- database.ts의 Row 타입이 실제 Supabase 컬럼과 일치
- contact-fields.ts의 key가 ContactFieldKey 타입 범위 내에 있음
- 테이블에 정의한 컬럼이 모두 올바른 순서로 표시됨
- 로그인/로그아웃 정상 동작
- 읽음/안읽음 처리 정상 동작
- 엑셀 다운로드 정상 동작
</Success_Criteria>

<Pitfalls>
- database.ts 수정 후 contact-fields.ts 미수정 → 타입 에러
- ContactSystemKeys에 포함된 키를 CONTACT_FIELDS에 추가하면 타입 에러
- Supabase RLS 미설정 → 로그인해도 데이터 조회 안 됨
- Vercel에 환경변수 미설정 → 배포 후 로그인 불가
- Supabase Auth Site URL 미설정 → 로그인 후 리다이렉트 실패
- is_read 컬럼에 UPDATE 정책 없으면 읽음 처리 실패 (에러는 나지 않고 UI만 롤백됨)
- Mock 모드(VITE_SUPABASE_URL 없음)에서 실제 데이터 조회 안 됨 — .env.local 확인
</Pitfalls>
