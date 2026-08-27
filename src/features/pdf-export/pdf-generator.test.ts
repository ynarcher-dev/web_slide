import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 실제 브라우저를 띄우지 않고, 생성기가 세션과 인쇄 조건을 올바르게 넘기는지 확인한다.
 * 임시 결과물을 남기지 않도록 실패해도 브라우저를 닫는지 함께 본다.
 */

const page = vi.hoisted(() => ({
  emulateMedia: vi.fn(async () => {}),
  goto: vi.fn(async (): Promise<{ ok: () => boolean } | null> => ({ ok: () => true })),
  waitForSelector: vi.fn(async () => {}),
  getAttribute: vi.fn(async (): Promise<string | null> => "loaded"),
  pdf: vi.fn(async () => Buffer.from("%PDF-1.4")),
}));
const context = vi.hoisted(() => ({
  addCookies: vi.fn(async () => {}),
  newPage: vi.fn(async () => page),
}));
const browser = vi.hoisted(() => ({
  newContext: vi.fn(async () => context),
  close: vi.fn(async () => {}),
}));
const chromium = vi.hoisted(() => ({ launch: vi.fn(async () => browser) }));

vi.mock("playwright-core", () => ({ chromium }));

import { renderPresentationPdf } from "./pdf-generator";

const URL_UNDER_TEST = "http://localhost:3000/presentations/p1/pdf";

beforeEach(() => {
  vi.clearAllMocks();
  page.goto.mockResolvedValue({ ok: () => true });
  page.getAttribute.mockResolvedValue("loaded");
});

describe("renderPresentationPdf", () => {
  it("세션 쿠키를 요청 도메인으로 옮겨 담는다", async () => {
    await renderPresentationPdf({
      url: URL_UNDER_TEST,
      cookies: [{ name: "sb-auth-token", value: "abc" }],
    });

    expect(context.addCookies).toHaveBeenCalledWith([
      {
        name: "sb-auth-token",
        value: "abc",
        domain: "localhost",
        path: "/",
        secure: false,
        sameSite: "Lax",
      },
    ]);
  });

  it("16:9 한 페이지 크기로 배경까지 인쇄한다", async () => {
    const pdf = await renderPresentationPdf({ url: URL_UNDER_TEST, cookies: [] });

    expect(context.addCookies).not.toHaveBeenCalled();
    expect(page.emulateMedia).toHaveBeenCalledWith({ media: "screen" });
    expect(page.pdf).toHaveBeenCalledWith({
      width: "1920px",
      height: "1080px",
      printBackground: true,
    });
    expect(Buffer.from(pdf).toString()).toBe("%PDF-1.4");
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("화면이 준비되기 전에는 인쇄하지 않는다", async () => {
    page.waitForSelector.mockRejectedValueOnce(new Error("timeout"));

    await expect(renderPresentationPdf({ url: URL_UNDER_TEST, cookies: [] })).rejects.toThrow(
      "timeout",
    );

    expect(page.pdf).not.toHaveBeenCalled();
    // 실패해도 브라우저와 임시 데이터를 남기지 않는다.
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("PDF 화면을 열지 못하면 실패로 처리한다", async () => {
    page.goto.mockResolvedValueOnce({ ok: () => false });

    await expect(renderPresentationPdf({ url: URL_UNDER_TEST, cookies: [] })).rejects.toThrow(
      "PDF 화면을 열지 못했습니다.",
    );

    expect(page.pdf).not.toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("웹페이지를 불러오지 못했으면 빈 PDF를 내려주지 않는다", async () => {
    page.getAttribute.mockResolvedValueOnce("timeout");

    await expect(renderPresentationPdf({ url: URL_UNDER_TEST, cookies: [] })).rejects.toThrow(
      /웹페이지를 제한 시간 안에 불러오지 못했습니다/,
    );

    expect(page.pdf).not.toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
