-- 대표글 지정이 수정일을 바꾸지 않게 (2026-07-30)
--
-- 문제: blog_posts 의 set_updated_at 트리거가 모든 UPDATE 에서 updated_at 을 now() 로 올렸다.
--       그래서 ★(is_featured/featured_order)만 눌러도 ① 어드민 목록 정렬(수정일 desc)이 흔들리고
--       ② 공개 상세 JSON-LD 의 dateModified 가 내용 변경 없이 최신화됐다.
--       (lib/blog.ts setFeatured 주석이 원래 의도한 동작과 어긋남)
--
-- 규칙(우선순위 순):
--   ① 호출자가 updated_at 을 명시적으로 바꿨으면 그 값을 그대로 쓴다(수동 보정·마이그레이션 허용).
--   ② 그 외에 바뀐 값이 is_featured/featured_order 뿐이면 수정일을 유지한다.
--   ③ 나머지(제목·본문·상태 등 실제 수정)는 now() 로 갱신한다.
create or replace function public.set_updated_at() returns trigger
language plpgsql
as $$
begin
	-- ① 명시적으로 지정한 수정일은 존중
	if new.updated_at is distinct from old.updated_at then
		return new;
	end if;
	-- ② 대표글 지정만 바뀐 경우 → 수정일 유지
	if (to_jsonb(new) - 'updated_at' - 'is_featured' - 'featured_order')
		= (to_jsonb(old) - 'updated_at' - 'is_featured' - 'featured_order') then
		new.updated_at = old.updated_at;
		return new;
	end if;
	-- ③ 실제 내용 수정
	new.updated_at = now();
	return new;
end;
$$;
