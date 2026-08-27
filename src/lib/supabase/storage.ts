import { env } from "@/lib/env";

/**
 * 슬라이드 이미지 Storage 규칙.
 *
 * 버킷은 공개다. 공유 링크를 여는 비로그인 사용자가 로그인 없이
 * 같은 이미지를 읽어야 하기 때문이다. 대신 파일명을 무작위로 만들어 주소를 추측할 수 없게 한다.
 * 쓰기 권한은 `storage.objects` RLS가 프레젠테이션 소유자로 제한한다.
 */

export const SLIDE_IMAGE_BUCKET = "slide-images";

/** 업로드를 허용하는 이미지 형식. 버킷 설정과 같은 값을 쓴다. */
export const SLIDE_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** 업로드 최대 크기(바이트). 버킷 설정과 같은 값을 쓴다. */
export const SLIDE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** 객체 경로의 첫 칸은 항상 프레젠테이션 id다. RLS 정책이 같은 규칙으로 소유권을 확인한다. */
export function isSlideImagePath(path: string, presentationId: string): boolean {
  return path.startsWith(`${presentationId}/`) && path.length > presentationId.length + 1;
}

/** 공개 버킷의 객체 주소. 서명이 필요 없으므로 모든 화면이 같은 주소를 쓴다. */
export function slideImagePublicUrl(path: string): string {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${SLIDE_IMAGE_BUCKET}/${encoded}`;
}
