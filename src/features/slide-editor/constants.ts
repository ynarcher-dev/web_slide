/** 슬라이드 편집 입력값의 길이 제한. DB 스키마와 화면 검증이 같은 값을 쓴다. */
export const SLIDE_TITLE_MAX_LENGTH = 120;
export const SLIDE_SUBTITLE_MAX_LENGTH = 200;
export const SLIDE_AUTHOR_MAX_LENGTH = 60;
export const SLIDE_PAGE_NAME_MAX_LENGTH = 60;
export const SLIDE_CONTENT_URL_MAX_LENGTH = 2048;
export const SLIDE_IMAGE_PATH_MAX_LENGTH = 300;
/** 붙여 넣을 수 있는 HTML 길이. 슬라이드 한 장에 넣을 조각으로 넉넉한 값이다. */
export const SLIDE_HTML_MAX_LENGTH = 100_000;

/** 입력이 멈춘 뒤 자동 저장까지 기다리는 시간(ms). */
export const SLIDE_AUTO_SAVE_DELAY_MS = 700;
