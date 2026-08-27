import { env } from "@/lib/env";
import { ROUTES } from "@/lib/routes";

/**
 * 공개 공유 링크 주소를 만든다.
 *
 * 공유 주소에는 프레젠테이션의 내부 id 대신 DB가 만든 별도 식별자 `share_id`를 쓴다.
 * 편집 주소를 추측할 수 없게 하고, 나중에 링크를 회수해야 할 때 식별자만 바꾸면 되기 때문이다.
 * 식별자 자체는 `presentations.share_id`의 기본값(`gen_random_uuid()`)이 만든다.
 */
export function buildShareUrl(shareId: string, origin?: string): string {
  // origin을 주지 않을 때만 환경 변수를 쓴다. 화면은 브라우저의 실제 주소를 넘긴다.
  // 배포 도메인 뒤에 슬래시가 붙어 있어도 `//share/...`가 되지 않게 정리한다.
  const base = (origin ?? env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, "");
  return `${base}${ROUTES.share(shareId)}`;
}
