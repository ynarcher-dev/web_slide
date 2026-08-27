-- 슬라이드 이미지 객체 조회 정책
--
-- 파일 내려받기는 공개 버킷 경로로 이루어져 이 정책과 무관하다.
-- 소유자가 자기 객체 행을 읽을 수 있어야 하는 이유는 두 가지다.
-- - `insert ... returning`이 새 행을 되읽으므로 select 권한이 필요하다.
-- - 나중에 쓰지 않는 파일을 정리하려면 목록 조회가 필요하다.

drop policy if exists "슬라이드 이미지 조회" on storage.objects;
create policy "슬라이드 이미지 조회"
  on storage.objects for select to authenticated
  using (bucket_id = 'slide-images' and public.owns_slide_image(name));
