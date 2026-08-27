import { SLIDE_IMAGE_BUCKET } from "@/lib/supabase/storage";
import type { SupabaseServerClient } from "@/lib/supabase/types";

/**
 * 더 이상 쓰지 않는 슬라이드 이미지를 Storage에서 지운다.
 *
 * DB 행이 사라져도 Storage 객체는 남으므로 지우는 쪽에서 함께 정리한다.
 * 삭제 권한은 `storage.objects` RLS가 프레젠테이션 소유자로 제한한다. 그래서 프레젠테이션 행을
 * 지우기 "전"에 호출해야 한다. 행이 없어지면 정책이 소유자를 확인할 수 없다.
 *
 * 실패해도 예외를 던지지 않는다. 파일이 남는 것보다 삭제 자체가 막히는 쪽이 사용자에게 더 나쁘다.
 */
export async function removePresentationImages(
  supabase: SupabaseServerClient,
  presentationId: string,
): Promise<void> {
  const storage = supabase.storage.from(SLIDE_IMAGE_BUCKET);
  const { data, error } = await storage.list(presentationId);

  if (error) {
    console.error("슬라이드 이미지 목록을 불러오지 못했습니다.", error);
    return;
  }

  const paths = (data ?? []).map((file) => `${presentationId}/${file.name}`);
  if (paths.length === 0) return;

  const { error: removeError } = await storage.remove(paths);
  if (removeError) console.error("슬라이드 이미지를 지우지 못했습니다.", removeError);
}

/** 슬라이드 한 장이 쓰던 이미지를 지운다. 경로가 없으면 아무것도 하지 않는다. */
export async function removeSlideImageByPath(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<void> {
  if (!path) return;

  const { error } = await supabase.storage.from(SLIDE_IMAGE_BUCKET).remove([path]);
  if (error) console.error("슬라이드 이미지를 지우지 못했습니다.", error);
}
