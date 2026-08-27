-- 이미지 본문 슬라이드
-- 본문 슬라이드와 같은 구조에서 웹페이지 대신 이미지를 넣는 유형을 추가한다.

-- ---------------------------------------------------------------------------
-- 슬라이드 유형과 이미지 경로
-- ---------------------------------------------------------------------------

-- 새 값은 같은 트랜잭션 안에서 사용할 수 없다. 이 파일에서는 선언만 하고 쓰지 않는다.
alter type public.slide_template add value if not exists 'image';

alter table public.slides
  add column if not exists image_path text
    check (image_path is null or image_path <> '');

comment on column public.slides.image_path is
  '이미지 슬라이드에 표시할 Storage 객체 경로. slide-images 버킷 기준이며 "<presentation_id>/<파일명>" 모양이다.';

-- ---------------------------------------------------------------------------
-- Storage 버킷
-- ---------------------------------------------------------------------------

-- 공개 버킷을 쓴다. 공유 링크를 여는 비로그인 사용자와 서버 PDF 브라우저가
-- 로그인 없이 같은 이미지를 읽어야 하기 때문이다. 경로에 무작위 파일명을 써서 추측을 막는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'slide-images',
  'slide-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- RLS: storage.objects
-- ---------------------------------------------------------------------------

-- 쓰기는 자기 프레젠테이션 폴더 안에서만 허용한다. 읽기는 공개 버킷 규칙을 따른다.
create or replace function public.owns_slide_image(object_name text)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.presentations p
    where p.owner_id = (select auth.uid())
      and object_name like p.id::text || '/%'
  );
$$;

comment on function public.owns_slide_image is
  'slide-images 객체 경로의 첫 칸이 로그인 사용자가 소유한 프레젠테이션인지 확인한다.';

drop policy if exists "슬라이드 이미지 업로드" on storage.objects;
create policy "슬라이드 이미지 업로드"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'slide-images' and public.owns_slide_image(name));

drop policy if exists "슬라이드 이미지 수정" on storage.objects;
create policy "슬라이드 이미지 수정"
  on storage.objects for update to authenticated
  using (bucket_id = 'slide-images' and public.owns_slide_image(name))
  with check (bucket_id = 'slide-images' and public.owns_slide_image(name));

drop policy if exists "슬라이드 이미지 삭제" on storage.objects;
create policy "슬라이드 이미지 삭제"
  on storage.objects for delete to authenticated
  using (bucket_id = 'slide-images' and public.owns_slide_image(name));
