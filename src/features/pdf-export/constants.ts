/**
 * PDF 생성 화면과 생성기가 함께 쓰는 값.
 *
 * 준비 상태는 DOM 속성으로 주고받는다.
 * 서버의 Playwright가 이 속성을 기다렸다가 인쇄하므로 이름이 어긋나면 안 된다.
 */

export const PDF_READY_ATTRIBUTE = "data-pdf-ready";
export const PDF_READY_SELECTOR = `[${PDF_READY_ATTRIBUTE}="true"]`;

/** 웹페이지 로딩 결과. `timeout`이면 인쇄해도 빈 화면만 남으므로 실패로 처리한다. */
export const PDF_FRAMES_ATTRIBUTE = "data-pdf-frames";
export type PdfFramesState = "pending" | "loaded" | "timeout";

/** 웹페이지 로딩을 기다리는 최대 시간. */
export const PDF_FRAME_TIMEOUT_MS = 20_000;
/** 마지막 그리기가 끝나도록 기다리는 시간. */
export const PDF_SETTLE_MS = 600;
/** 서버 브라우저가 화면을 열고 준비될 때까지 기다리는 최대 시간. */
export const PDF_RENDER_TIMEOUT_MS = 60_000;
