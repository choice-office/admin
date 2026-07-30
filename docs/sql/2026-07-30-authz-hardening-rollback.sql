-- 롤백 — 2026-07-30-authz-hardening.sql 을 적용 전 상태로 되돌린다.
-- (권한이 다시 "로그인한 아무나"로 넓어지므로, 회원가입 차단은 유지한 채 임시로만 사용)

alter policy "authenticated read all posts" on public.blog_posts using (true);
alter policy "authenticated insert posts" on public.blog_posts with check (true);
alter policy "authenticated update posts" on public.blog_posts using (true) with check (true);
alter policy "authenticated delete posts" on public.blog_posts using (true);

alter policy "review_images authenticated read all" on public.review_images using (true);
alter policy "review_images authenticated insert" on public.review_images with check (true);
alter policy "review_images authenticated update" on public.review_images using (true) with check (true);
alter policy "review_images authenticated delete" on public.review_images using (true);

alter policy "authenticated full read reviews" on public.reviews using (true);
alter policy "authenticated insert reviews" on public.reviews with check (true);
alter policy "authenticated update reviews" on public.reviews using (true) with check (true);
alter policy "authenticated delete reviews" on public.reviews using (true);

alter policy "contacts authenticated read" on public.contacts using (true);
alter policy "contacts authenticated update" on public.contacts using (true) with check (true);

alter policy "authenticated upload blog images" on storage.objects with check (bucket_id = 'blog');
alter policy "authenticated update blog images" on storage.objects
	using (bucket_id = 'blog') with check (bucket_id = 'blog');
alter policy "authenticated delete blog images" on storage.objects using (true);
alter policy "blog images public read" on storage.objects using (true);
alter policy "reviews bucket authenticated insert" on storage.objects with check (bucket_id = 'reviews');
alter policy "reviews bucket authenticated update" on storage.objects
	using (bucket_id = 'reviews') with check (bucket_id = 'reviews');
alter policy "reviews bucket authenticated delete" on storage.objects using (true);
alter policy "reviews bucket public read" on storage.objects using (true);

-- anon 쓰기 권한 복구가 필요하면(권장하지 않음):
-- grant insert, update, delete on all tables in schema public to anon;

-- contacts 권한 회수(적용 전 상태 = 관리자 문의화면이 안 되던 상태):
-- revoke select, update on table public.contacts from authenticated;

update storage.buckets set file_size_limit = null where id in ('blog', 'reviews');
