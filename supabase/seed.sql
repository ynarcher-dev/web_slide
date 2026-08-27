-- 개발용 seed 데이터.
--
-- 목적: 로그인, 목록, 편집 화면을 손으로 확인할 수 있는 최소 데이터를 만든다.
-- 주의: 개발과 검증 환경에서만 사용한다. 운영 데이터베이스에 넣지 않는다.
--
-- 실행 방법
--   로컬 Supabase:  supabase db reset
--   원격 개발 DB:   pnpm db:seed
--
-- 계정: demo@webslide.test / WebSlide!2026

do $$
declare
  demo_user_id constant uuid := '00000000-0000-4000-8000-000000000001';
  demo_email constant text := 'demo@webslide.test';
  demo_presentation_id constant uuid := '00000000-0000-4000-8000-000000000010';
begin
  -- 인증 사용자. 이메일 확인을 마친 상태로 만들어 메일 발송 없이 로그인할 수 있게 한다.
  --
  -- 토큰 컬럼을 NULL로 두면 GoTrue가 값을 읽지 못해
  -- 로그인 시 "Database error querying schema"가 발생한다. 반드시 빈 문자열로 채운다.
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    demo_user_id,
    'authenticated',
    'authenticated',
    demo_email,
    extensions.crypt('WebSlide!2026', extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"display_name": "데모 사용자"}'::jsonb,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  )
  on conflict (id) do update
  set encrypted_password = excluded.encrypted_password,
      email_confirmed_at = excluded.email_confirmed_at,
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '';

  -- 비밀번호 로그인을 위해 email 아이덴티티가 필요하다.
  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    demo_user_id::text,
    demo_user_id,
    jsonb_build_object('sub', demo_user_id::text, 'email', demo_email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do nothing;

  -- 프로필은 auth.users 트리거가 만든다. 없으면 여기서 보완한다.
  insert into public.profiles (id, display_name)
  values (demo_user_id, '데모 사용자')
  on conflict (id) do nothing;

  -- 데모 프레젠테이션
  insert into public.presentations (
    id,
    owner_id,
    title,
    brand_color,
    cover_tint,
    footer_text,
    show_page_number,
    is_public
  )
  values (
    demo_presentation_id,
    demo_user_id,
    'Web Slide 데모',
    '#E42317',
    12,
    'Copyright © 2026 Y&ARCHER',
    true,
    false
  )
  on conflict (id) do nothing;

  -- 표지 1장과 본문 2장
  insert into public.slides (
    id,
    presentation_id,
    template,
    sort_order,
    title,
    subtitle,
    author,
    page_name,
    content_url,
    html_content
  )
  values
    (
      '00000000-0000-4000-8000-000000000101',
      demo_presentation_id,
      'cover',
      0,
      'Web Slide',
      '웹 제품을 직접 시연하는 프레젠테이션',
      'Y&ARCHER',
      '',
      null,
      null
    ),
    (
      '00000000-0000-4000-8000-000000000102',
      demo_presentation_id,
      'content',
      1,
      '서비스 소개',
      '슬라이드 안에서 실제 웹페이지를 그대로 보여줍니다.',
      '',
      'PRODUCT',
      'https://example.com',
      null
    ),
    (
      '00000000-0000-4000-8000-000000000103',
      demo_presentation_id,
      'content',
      2,
      '실시간 시연',
      '발표 흐름을 끊지 않고 제품을 조작합니다.',
      '',
      'DEMO',
      'https://example.com',
      null
    ),
    (
      '00000000-0000-4000-8000-000000000104',
      demo_presentation_id,
      'html',
      3,
      'HTML 뷰어',
      '붙여 넣은 HTML을 그대로 보여줍니다.',
      '',
      'HTML',
      null,
      '<main style="display:flex;height:100%;align-items:center;justify-content:center;font-family:sans-serif;font-size:72px">붙여 넣은 HTML</main>'
    )
  on conflict (id) do nothing;
end
$$;
