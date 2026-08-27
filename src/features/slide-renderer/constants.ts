/**
 * 슬라이드 렌더링 기준값.
 *
 * 편집 미리보기, 발표 화면, PDF가 모두 이 좌표계를 공유한다.
 * 슬라이드 내부는 항상 1920×1080 px로 그리고, 바깥에서 실제 크기에 맞춰 축소한다.
 */

export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;
export const SLIDE_ASPECT_RATIO = SLIDE_WIDTH / SLIDE_HEIGHT;

/** 본문 슬라이드에 삽입하는 웹페이지의 기준 뷰포트. */
export const WEB_VIEWPORT_WIDTH = 1920;
export const WEB_VIEWPORT_HEIGHT = 1080;

/** 표지 tint가 100일 때 브랜드 색상을 흰 배경에 섞는 비율. */
export const MAX_COVER_TINT_ALPHA = 0.12;
