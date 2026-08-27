-- Web Slide 초기 스키마
-- profiles, presentations, slides 테이블과 RLS 정책을 만든다.

-- ---------------------------------------------------------------------------
-- 공통 함수
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is '행이 수정될 때 updated_at을 현재 시각으로 갱신한다.';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '서비스 사용자 프로필. auth.users와 1:1로 대응한다.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 회원 가입 시 프로필을 자동으로 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user is 'auth.users에 사용자가 추가되면 public.profiles 행을 만든다.';

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- presentations
-- ---------------------------------------------------------------------------

create table public.presentations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '제목 없는 프레젠테이션',
  brand_color text not null default '#E42317' check (brand_color ~* '^#[0-9a-f]{6}$'),
  cover_tint smallint not null default 0 check (cover_tint between 0 and 100),
  footer_text text not null default '',
  show_page_number boolean not null default true,
  is_public boolean not null default false,
  share_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentations_share_id_key unique (share_id)
);

comment on table public.presentations is '프레젠테이션과 프레젠테이션 단위 공통 테마 설정.';
comment on column public.presentations.cover_tint is '표지 배경 tint 세기. 0은 흰색, 100은 최대 적용.';
comment on column public.presentations.share_id is '읽기 전용 공유 링크에 사용하는 공개 식별자.';

create index presentations_owner_id_updated_at_idx
  on public.presentations (owner_id, updated_at desc);

create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- slides
-- ---------------------------------------------------------------------------

create type public.slide_template as enum ('cover', 'content');

create table public.slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations (id) on delete cascade,
  template public.slide_template not null,
  sort_order integer not null default 0,
  title text not null default '',
  subtitle text not null default '',
  author text not null default '',
  page_name text not null default '',
  content_url text check (content_url is null or content_url ~* '^https://'),
  reload_on_enter boolean not null default false,
  viewport_width integer not null default 1920 check (viewport_width > 0),
  viewport_height integer not null default 1080 check (viewport_height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.slides is '표지와 본문 슬라이드. 페이지 번호는 sort_order로 계산한다.';
comment on column public.slides.sort_order is '프레젠테이션 안에서의 표시 순서. 0부터 시작한다.';
comment on column public.slides.content_url is '본문 슬라이드에 삽입할 웹페이지 주소. HTTPS만 허용한다.';

create index slides_presentation_id_sort_order_idx
  on public.slides (presentation_id, sort_order);

create trigger slides_set_updated_at
before update on public.slides
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.presentations to anon, authenticated;
grant insert, update, delete on public.presentations to authenticated;

grant select on public.slides to anon, authenticated;
grant insert, update, delete on public.slides to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "본인 프로필 조회"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "본인 프로필 생성"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "본인 프로필 수정"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- RLS: presentations
-- ---------------------------------------------------------------------------

alter table public.presentations enable row level security;

create policy "소유자 프레젠테이션 조회"
  on public.presentations for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "공개 프레젠테이션 조회"
  on public.presentations for select to anon, authenticated
  using (is_public);

create policy "소유자 프레젠테이션 생성"
  on public.presentations for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "소유자 프레젠테이션 수정"
  on public.presentations for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "소유자 프레젠테이션 삭제"
  on public.presentations for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- RLS: slides
-- ---------------------------------------------------------------------------

alter table public.slides enable row level security;

create policy "소유자 슬라이드 조회"
  on public.slides for select to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "공개 프레젠테이션 슬라이드 조회"
  on public.slides for select to anon, authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.is_public
    )
  );

create policy "소유자 슬라이드 생성"
  on public.slides for insert to authenticated
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "소유자 슬라이드 수정"
  on public.slides for update to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy "소유자 슬라이드 삭제"
  on public.slides for delete to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.owner_id = (select auth.uid())
    )
  );
