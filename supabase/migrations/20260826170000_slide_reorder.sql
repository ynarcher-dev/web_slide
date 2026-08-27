-- 슬라이드 순서 변경을 한 번의 요청으로 처리한다.
--
-- 드래그로 순서를 바꾸면 여러 행의 sort_order가 동시에 달라진다.
-- 행마다 update를 보내면 중간 상태가 화면에 보일 수 있어 함수 하나로 묶는다.
-- security invoker이므로 slides의 RLS 정책이 그대로 적용된다.

create or replace function public.reorder_slides(
  p_presentation_id uuid,
  p_slide_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.slides s
  set sort_order = ordered.position - 1
  from unnest(p_slide_ids) with ordinality as ordered(slide_id, position)
  where s.id = ordered.slide_id
    and s.presentation_id = p_presentation_id;
end;
$$;

comment on function public.reorder_slides is
  '주어진 순서대로 슬라이드의 sort_order를 0부터 다시 매긴다.';

grant execute on function public.reorder_slides(uuid, uuid[]) to authenticated;
