import { chromium, type Browser } from "playwright-core";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/features/slide-renderer";
import { PDF_FRAMES_ATTRIBUTE, PDF_READY_SELECTOR, PDF_RENDER_TIMEOUT_MS } from "./constants";

/**
 * 서버에서 PDF를 만든다. Node 런타임 전용이며 브라우저 번들에 들어가면 안 된다.
 *
 * 브라우저 인쇄 대신 서버 Playwright를 쓰는 이유는 폰트와 iframe 로딩 결과를 항상 같게
 * 만들기 위해서다. 결과는 메모리에만 두고 요청이 끝나면 브라우저와 함께 사라진다.
 */

/** 사용자에게 그대로 보여줄 수 있는 실패 원인. */
export class PdfExportError extends Error {}

export type SessionCookie = { name: string; value: string };

export type RenderPdfInput = {
  /** PDF 전용 화면의 절대 주소. 서버가 자기 자신을 연다. */
  url: string;
  /** 요청자의 세션 쿠키. 이 값이 있어야 소유자 화면을 열 수 있다. */
  cookies: SessionCookie[];
};

export async function renderPresentationPdf({
  url,
  cookies,
}: RenderPdfInput): Promise<Uint8Array<ArrayBuffer>> {
  const target = new URL(url);
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      // 슬라이드 좌표계와 같은 뷰포트로 열어야 축소 없이 1:1로 그려진다.
      viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
      deviceScaleFactor: 1,
    });

    if (cookies.length > 0) {
      await context.addCookies(
        cookies.map((cookie) => ({
          ...cookie,
          domain: target.hostname,
          path: "/",
          secure: target.protocol === "https:",
          sameSite: "Lax" as const,
        })),
      );
    }

    const page = await context.newPage();
    // 기본값인 print 미디어로 두면 화면과 다른 스타일이 적용될 수 있다.
    await page.emulateMedia({ media: "screen" });

    const response = await page.goto(url, { waitUntil: "load", timeout: PDF_RENDER_TIMEOUT_MS });
    if (!response?.ok()) {
      throw new PdfExportError("PDF 화면을 열지 못했습니다. 잠시 후 다시 시도하세요.");
    }

    // 폰트와 웹페이지 로딩이 끝났다는 신호를 기다린다.
    await page.waitForSelector(PDF_READY_SELECTOR, { timeout: PDF_RENDER_TIMEOUT_MS });

    // 웹페이지를 못 불러온 채로 인쇄하면 빈 상자만 남는다. 그때는 실패로 알린다.
    const frames = await page.getAttribute(PDF_READY_SELECTOR, PDF_FRAMES_ATTRIBUTE);
    if (frames === "timeout") {
      throw new PdfExportError(
        "본문 슬라이드의 웹페이지를 제한 시간 안에 불러오지 못했습니다. 주소를 확인하고 다시 시도하세요.",
      );
    }

    const pdf = await page.pdf({
      width: `${SLIDE_WIDTH}px`,
      height: `${SLIDE_HEIGHT}px`,
      printBackground: true,
    });

    // Playwright는 Node Buffer를 돌려준다. 응답 본문으로 바로 쓸 수 있게 타입만 좁힌다.
    return pdf as Uint8Array<ArrayBuffer>;
  } finally {
    // 실패해도 브라우저와 임시 데이터를 남기지 않는다.
    await browser?.close();
  }
}
