import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers 배포 설정.
 *
 * 증분 캐시(R2/KV) 오버라이드를 넣지 않는다. 프레젠테이션과 슬라이드 화면은 모두
 * 로그인 사용자나 공유 식별자에 따라 달라지는 동적 라우트라 ISR 캐시를 쓰지 않는다.
 * 캐시가 필요해지면 `@opennextjs/cloudflare/overrides/incremental-cache`의 구현을 붙이고
 * `wrangler.jsonc`에 해당 바인딩을 함께 추가한다.
 */
export default defineCloudflareConfig();
