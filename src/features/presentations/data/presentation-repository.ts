import { toPresentation, toPresentationSettingsUpdate } from "@/lib/supabase/mappers";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import type { Presentation, PresentationSettings } from "@/types/domain";

/**
 * `presentations` 테이블 접근을 한곳에 모은다.
 *
 * - 클라이언트는 호출자가 넘긴다. 이 파일은 세션이나 쿠키를 직접 다루지 않는다.
 * - 모든 조회와 변경은 `owner_id`로 한 번 더 좁힌다. RLS가 1차로 막지만 서버에서도 확인한다.
 * - DB 행 모양은 이 파일 밖으로 내보내지 않고 도메인 타입으로 바꿔 반환한다.
 */

function fail(message: string, cause: unknown): Error {
  // 원인은 서버 로그로만 남기고 사용자에게는 정리된 문구만 보여준다.
  console.error(message, cause);
  return new Error(message);
}

export async function listPresentations(
  supabase: SupabaseServerClient,
  ownerId: string,
): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw fail("프레젠테이션 목록을 불러오지 못했습니다.", error);

  return data.map(toPresentation);
}

/** 소유자의 프레젠테이션 한 건. 없거나 권한이 없으면 null이다. */
export async function getPresentationById(
  supabase: SupabaseServerClient,
  presentationId: string,
  ownerId: string,
): Promise<Presentation | null> {
  const { data, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("id", presentationId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw fail("프레젠테이션을 불러오지 못했습니다.", error);

  return data ? toPresentation(data) : null;
}

/**
 * 공개 공유 링크로 여는 프레젠테이션 한 건.
 *
 * 로그인하지 않은 사용자도 호출하므로 소유자 조건을 쓰지 않는다.
 * 대신 공개 여부를 조건에 직접 넣어 RLS의 공개 읽기 정책과 같은 범위만 조회한다.
 */
export async function getPublicPresentationByShareId(
  supabase: SupabaseServerClient,
  shareId: string,
): Promise<Presentation | null> {
  const { data, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw fail("공유 프레젠테이션을 불러오지 못했습니다.", error);

  return data ? toPresentation(data) : null;
}

export async function insertPresentation(
  supabase: SupabaseServerClient,
  ownerId: string,
  title: string,
): Promise<Presentation> {
  const { data, error } = await supabase
    .from("presentations")
    .insert({ owner_id: ownerId, title })
    .select("*")
    .single();

  if (error) throw fail("프레젠테이션을 만들지 못했습니다.", error);

  return toPresentation(data);
}

/** 제목을 바꾼다. 대상이 없거나 소유자가 아니면 null이다. */
export async function updatePresentationTitle(
  supabase: SupabaseServerClient,
  presentationId: string,
  ownerId: string,
  title: string,
): Promise<Presentation | null> {
  const { data, error } = await supabase
    .from("presentations")
    .update({ title })
    .eq("id", presentationId)
    .eq("owner_id", ownerId)
    .select("*")
    .maybeSingle();

  if (error) throw fail("제목을 저장하지 못했습니다.", error);

  return data ? toPresentation(data) : null;
}

/** 공통 설정을 저장한다. 대상이 없거나 소유자가 아니면 null이다. */
export async function updatePresentationSettings(
  supabase: SupabaseServerClient,
  presentationId: string,
  ownerId: string,
  settings: PresentationSettings,
): Promise<Presentation | null> {
  const { data, error } = await supabase
    .from("presentations")
    .update(toPresentationSettingsUpdate(settings))
    .eq("id", presentationId)
    .eq("owner_id", ownerId)
    .select("*")
    .maybeSingle();

  if (error) throw fail("설정을 저장하지 못했습니다.", error);

  return data ? toPresentation(data) : null;
}

/** 삭제에 성공하면 true, 대상이 없거나 소유자가 아니면 false다. */
export async function deletePresentation(
  supabase: SupabaseServerClient,
  presentationId: string,
  ownerId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("presentations")
    .delete()
    .eq("id", presentationId)
    .eq("owner_id", ownerId)
    .select("id");

  if (error) throw fail("프레젠테이션을 삭제하지 못했습니다.", error);

  return (data?.length ?? 0) > 0;
}
