"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SLIDE_IMAGE_BUCKET,
  SLIDE_IMAGE_MAX_BYTES,
  SLIDE_IMAGE_MIME_TYPES,
} from "@/lib/supabase/storage";

/**
 * 슬라이드 이미지 업로드와 삭제.
 *
 * 파일은 브라우저에서 Storage로 바로 올린다. Server Action으로 보내면 파일 전체가
 * 서버 함수를 한 번 더 거치기 때문이다. 접근 제한은 `storage.objects` RLS가 담당한다.
 * 경로는 `<presentation_id>/<무작위 이름>` 모양이며, RLS 정책이 첫 칸으로 소유권을 확인한다.
 */

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** 업로드 전 형식과 크기를 확인한다. 문제가 없으면 null이다. */
export function validateSlideImageFile(file: File): string | null {
  if (!SLIDE_IMAGE_MIME_TYPES.includes(file.type)) {
    return "PNG, JPG, WEBP, GIF 이미지만 올릴 수 있습니다.";
  }
  if (file.size > SLIDE_IMAGE_MAX_BYTES) {
    return `이미지는 ${Math.floor(SLIDE_IMAGE_MAX_BYTES / (1024 * 1024))}MB 이하만 올릴 수 있습니다.`;
  }
  return null;
}

/** 업로드에 사용할 객체 경로를 만든다. 파일명은 추측할 수 없게 무작위로 짓는다. */
export function buildSlideImagePath(presentationId: string, file: File): string {
  const extension = EXTENSIONS[file.type] ?? "png";
  return `${presentationId}/${crypto.randomUUID()}.${extension}`;
}

/** 업로드에 성공하면 저장할 객체 경로를 돌려준다. */
export async function uploadSlideImage(presentationId: string, file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const path = buildSlideImagePath(presentationId, file);

  const { error } = await supabase.storage.from(SLIDE_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("슬라이드 이미지를 올리지 못했습니다.", error);
    throw new Error("이미지를 올리지 못했습니다. 잠시 후 다시 시도하세요.");
  }

  return path;
}

/**
 * 더 이상 쓰지 않는 이미지를 지운다.
 *
 * 실패해도 편집을 막지 않는다. 슬라이드가 가리키지 않는 파일이 남는 것뿐이고,
 * 사용자가 방금 한 작업(교체 또는 제거)은 이미 끝났기 때문이다.
 */
export async function removeSlideImage(path: string): Promise<void> {
  if (path === "") return;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(SLIDE_IMAGE_BUCKET).remove([path]);

  if (error) console.error("이전 슬라이드 이미지를 지우지 못했습니다.", error);
}
