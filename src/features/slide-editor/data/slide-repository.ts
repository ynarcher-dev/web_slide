import { toNewSlideInsert, toSlide, toSlideFieldsUpdate } from "@/lib/supabase/mappers";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import type { Slide, SlideFields, SlideTemplate } from "@/types/domain";

/**
 * `slides` 테이블 접근을 한곳에 모은다.
 *
 * - 소유권은 호출자가 먼저 확인한다. 이 파일의 모든 함수는 `presentation_id`로 한 번 더 좁힌다.
 * - RLS가 1차로 막지만, 다른 프레젠테이션의 슬라이드를 실수로 건드리지 않도록 조건을 항상 붙인다.
 * - DB 행 모양은 밖으로 내보내지 않고 도메인 타입으로 바꿔 반환한다.
 */

function fail(message: string, cause: unknown): Error {
  // 원인은 서버 로그로만 남기고 사용자에게는 정리된 문구만 보여준다.
  console.error(message, cause);
  return new Error(message);
}

export async function listSlides(
  supabase: SupabaseServerClient,
  presentationId: string,
): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("presentation_id", presentationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw fail("슬라이드를 불러오지 못했습니다.", error);

  return data.map(toSlide);
}

/** 맨 뒤에 빈 슬라이드를 만든다. 위치 조정은 `reorderSlides`가 이어서 처리한다. */
export async function insertSlide(
  supabase: SupabaseServerClient,
  presentationId: string,
  template: SlideTemplate,
  sortOrder: number,
): Promise<Slide> {
  const { data, error } = await supabase
    .from("slides")
    .insert(toNewSlideInsert(presentationId, template, sortOrder))
    .select("*")
    .single();

  if (error) throw fail("슬라이드를 만들지 못했습니다.", error);

  return toSlide(data);
}

/** 편집 폼의 값을 저장한다. 대상이 없으면 null이다. */
export async function updateSlideFields(
  supabase: SupabaseServerClient,
  presentationId: string,
  slideId: string,
  fields: SlideFields,
): Promise<Slide | null> {
  const { data, error } = await supabase
    .from("slides")
    .update(toSlideFieldsUpdate(fields))
    .eq("id", slideId)
    .eq("presentation_id", presentationId)
    .select("*")
    .maybeSingle();

  if (error) throw fail("슬라이드를 저장하지 못했습니다.", error);

  return data ? toSlide(data) : null;
}

/** 삭제에 성공하면 true, 대상이 없으면 false다. */
export async function deleteSlide(
  supabase: SupabaseServerClient,
  presentationId: string,
  slideId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("slides")
    .delete()
    .eq("id", slideId)
    .eq("presentation_id", presentationId)
    .select("id");

  if (error) throw fail("슬라이드를 삭제하지 못했습니다.", error);

  return (data?.length ?? 0) > 0;
}

/**
 * 주어진 순서대로 sort_order를 0부터 다시 매긴다.
 * 여러 행이 한꺼번에 바뀌므로 DB 함수 한 번으로 처리한다.
 */
export async function reorderSlides(
  supabase: SupabaseServerClient,
  presentationId: string,
  orderedSlideIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc("reorder_slides", {
    p_presentation_id: presentationId,
    p_slide_ids: orderedSlideIds,
  });

  if (error) throw fail("슬라이드 순서를 저장하지 못했습니다.", error);
}
