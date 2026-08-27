-- HTML 본문 슬라이드
-- 웹페이지 주소 대신 HTML 조각을 직접 붙여 넣어 보여 주는 유형을 추가한다.

-- 새 값은 같은 트랜잭션 안에서 사용할 수 없다. 이 파일에서는 선언만 하고 쓰지 않는다.
alter type public.slide_template add value if not exists 'html';

alter table public.slides
  add column if not exists html_content text;

comment on column public.slides.html_content is
  'HTML 슬라이드에 표시할 원본 HTML. 샌드박스 iframe의 srcdoc으로 넣는다.';
