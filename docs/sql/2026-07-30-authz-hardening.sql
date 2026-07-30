-- 권한 정리 (2026-07-30) — "로그인한 아무나" → "등록된 관리자만"
--
-- 배경: 모든 authenticated 정책이 using(true) 였고 Supabase 이메일 회원가입이 열려 있어,
--       외부인이 스스로 계정을 만들면 블로그·후기 쓰기와 문의 조회가 가능한 상태였다.
-- 원칙: ① 홈페이지(anon)의 공개 조회는 그대로 ② 관리 작업은 admins 화이트리스트만
--       ③ 문의 접수는 계속 service_role(서버 액션) ④ 기존 동작 변경 없음
--
-- 적용: Supabase Management API /database/query 로 단계별 실행 + 각 단계 후 역할 시뮬레이션 검증.
-- 롤백: 같은 폴더 2026-07-30-authz-hardening-rollback.sql

-- ── 1) 관리자 화이트리스트 ────────────────────────────────────────────────────
create table if not exists public.admins (
	user_id uuid primary key references auth.users (id) on delete cascade,
	email text,
	note text,
	created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- 정책을 만들지 않는다 → anon/authenticated 는 이 테이블을 직접 못 읽는다.
-- 판정은 아래 is_admin()(security definer)만 수행.
revoke all on table public.admins from anon, authenticated;

-- 기존 운영 계정을 그대로 등록(현재 seoyeon@kvisa1345.com 1명) → 관리자 동작 무중단
insert into public.admins (user_id, email, note)
select id, email, '기존 운영 계정 — 권한 정리 시 자동 등록'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$ select exists (select 1 from public.admins a where a.user_id = auth.uid()) $$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
	'현재 로그인 사용자가 public.admins 에 등록된 관리자인지. 모든 관리 RLS 정책의 단일 판정 지점.';
comment on table public.admins is
	'관리자 화이트리스트. 관리자 추가: insert into admins(user_id, email) select id, email from auth.users where email = ''...'';';

-- ── 2) 관리 정책을 is_admin() 기반으로 교체 (ALTER POLICY = 무중단) ──────────────
alter policy "authenticated read all posts" on public.blog_posts using (public.is_admin());
alter policy "authenticated insert posts" on public.blog_posts with check (public.is_admin());
alter policy "authenticated update posts" on public.blog_posts using (public.is_admin()) with check (public.is_admin());
alter policy "authenticated delete posts" on public.blog_posts using (public.is_admin());

alter policy "review_images authenticated read all" on public.review_images using (public.is_admin());
alter policy "review_images authenticated insert" on public.review_images with check (public.is_admin());
alter policy "review_images authenticated update" on public.review_images using (public.is_admin()) with check (public.is_admin());
alter policy "review_images authenticated delete" on public.review_images using (public.is_admin());

-- reviews: 현재 홈페이지·어드민 미사용(레거시)이지만 같은 기준으로 잠근다
alter policy "authenticated full read reviews" on public.reviews using (public.is_admin());
alter policy "authenticated insert reviews" on public.reviews with check (public.is_admin());
alter policy "authenticated update reviews" on public.reviews using (public.is_admin()) with check (public.is_admin());
alter policy "authenticated delete reviews" on public.reviews using (public.is_admin());

alter policy "contacts authenticated read" on public.contacts using (public.is_admin());
alter policy "contacts authenticated update" on public.contacts using (public.is_admin()) with check (public.is_admin());

-- ── 3) anon 쓰기 권한 회수 (RLS 로 이미 막히지만 이중 방어) ──────────────────────
-- SELECT 는 유지 → 홈페이지 공개 조회(published / is_published)는 그대로 동작
revoke insert, update, delete, truncate, references, trigger
	on all tables in schema public from anon;

-- ── 4) contacts: 관리자 문의 화면 복구 (최소 권한) ──────────────────────────────
-- 지금까지 authenticated 에 테이블 권한이 없어 정책과 무관하게 42501 로 막혀 있었다
-- (관리자 문의 목록이 비어 보이던 원인). 조회는 전체, 수정은 상태·메모 컬럼만 허용.
grant select on table public.contacts to authenticated;
grant update (status, memo) on table public.contacts to authenticated;
-- INSERT/DELETE 는 주지 않는다: 접수는 홈페이지 service_role, 삭제 기능은 관리 화면에 없음

-- ── 5) 스토리지 정책 — 버킷 한정 + 관리자만 ────────────────────────────────────
-- 기존 DELETE/SELECT 정책에 USING 이 없어 "모든 버킷 모든 객체" 범위였다.
alter policy "authenticated upload blog images" on storage.objects
	with check (bucket_id = 'blog' and public.is_admin());
alter policy "authenticated update blog images" on storage.objects
	using (bucket_id = 'blog' and public.is_admin())
	with check (bucket_id = 'blog' and public.is_admin());
alter policy "authenticated delete blog images" on storage.objects
	using (bucket_id = 'blog' and public.is_admin());
alter policy "blog images public read" on storage.objects using (bucket_id = 'blog');

alter policy "reviews bucket authenticated insert" on storage.objects
	with check (bucket_id = 'reviews' and public.is_admin());
alter policy "reviews bucket authenticated update" on storage.objects
	using (bucket_id = 'reviews' and public.is_admin())
	with check (bucket_id = 'reviews' and public.is_admin());
alter policy "reviews bucket authenticated delete" on storage.objects
	using (bucket_id = 'reviews' and public.is_admin());
alter policy "reviews bucket public read" on storage.objects using (bucket_id = 'reviews');

-- ── 6) 버킷 업로드 용량 상한 (플랫폼 레벨 방어) ─────────────────────────────────
-- MIME 제한은 버킷에 걸지 않는다(첨부 종류를 막아 기존 작업이 깨질 수 있어 앱 코드에서 검사).
update storage.buckets set file_size_limit = 20971520 where id in ('blog', 'reviews'); -- 20MB

-- ── 7) 문의 폼 남용 방지용 접수 기록 (홈페이지 서버 액션 전용) ──────────────────
-- IP 를 그대로 저장하지 않고 해시만 남긴다. service_role 만 접근(정책 없음 = anon/authenticated 불가).
create table if not exists public.contact_throttle (
	id bigserial primary key,
	ip_hash text not null,
	created_at timestamptz not null default now()
);
create index if not exists contact_throttle_lookup on public.contact_throttle (ip_hash, created_at desc);
alter table public.contact_throttle enable row level security;
revoke all on table public.contact_throttle from anon, authenticated;
comment on table public.contact_throttle is
	'문의/신속상담 접수 레이트리밋용 IP 해시 기록. 홈페이지 서버 액션(service_role)만 읽고 쓴다. 1일 지난 행은 접수 시 정리.';

-- ── 8) contacts CHECK 정정 — 폼이 제공하는 상담분야 전체 허용 ────────────────────
-- 폼에는 단기초청(short)·주재원(resident)이 있는데 CHECK 에 없어 그 선택이 null 로 유실됐다.
alter table public.contacts drop constraint if exists contacts_consult_field_check;
alter table public.contacts add constraint contacts_consult_field_check check (
	consult_field is null
	or consult_field = any (array['short', 'resident', 'e6', 'e7', 'f4', 'f5', 'f6', 'nat', 'etc'])
);

-- ── 9) contacts — 신속 상담바 접수를 저장할 수 있게 (기존에 계속 실패하던 원인) ──────
-- 하단 상담바는 성함·연락처·상담분야만 받는데 email·nationality 가 NOT NULL 이어서
-- insert 가 매번 실패했다(이메일 알림만 발송되어 실패가 드러나지 않았다).
-- 문의 폼(contact_page)은 앱에서 여전히 필수 검사하므로 입력 요건은 변하지 않는다.
alter table public.contacts alter column email drop not null;
alter table public.contacts alter column nationality drop not null;
