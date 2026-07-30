-- 개인정보 보관·게시 동의 (2026-07-30)
--
-- ① 문의(contacts) 보관기간 자동 적용: 개인정보처리방침 "문의 기록: 처리 완료 후 3년"에 맞춰
--    홈페이지 Vercel Cron(/api/cron/retention)이 service_role 로 매일 삭제한다(관리자 접속과 무관).
--    삭제 기준: status='done' → updated_at + 3년 / 그 외 상태 → created_at + 3년(무기한 방치 방지).
--    → DB 변경 없음. 기준 SQL 은 홈페이지 route handler 에 있다.
--
-- ② 후기 이미지 게시 동의·마스킹 확인 기록 — 제3자(의뢰인) 개인정보라 근거를 남긴다.
alter table public.review_images
	add column if not exists consent_confirmed boolean not null default false,
	add column if not exists masked_confirmed boolean not null default false,
	add column if not exists consent_note text;

comment on column public.review_images.consent_confirmed is '의뢰인에게 게시 동의를 받았음을 관리자가 확인(저장 시 필수 체크)';
comment on column public.review_images.masked_confirmed is '이름·연락처·이메일·주소 등 개인식별정보 마스킹을 관리자가 확인(저장 시 필수 체크)';
comment on column public.review_images.consent_note is '동의 받은 방법·시점 메모(예: 2026-07-12 카톡으로 게시 동의)';
