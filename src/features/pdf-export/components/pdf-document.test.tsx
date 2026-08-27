import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Presentation, Slide } from "@/types/domain";
import { PDF_FRAME_TIMEOUT_MS, PDF_SETTLE_MS } from "../constants";
import { PdfDocument } from "./pdf-document";

const PRESENTATION: Presentation = {
  id: "33333333-3333-4333-8333-333333333333",
  ownerId: "11111111-1111-4111-8111-111111111111",
  title: "서비스 소개",
  theme: {
    brandColor: "#e42317",
    coverTint: 20,
    footerText: "Copyright © 2026 Y&ARCHER",
    showPageNumber: true,
  },
  isPublic: false,
  shareId: "44444444-4444-4444-8444-444444444444",
  createdAt: "2026-08-26T00:00:00Z",
  updatedAt: "2026-08-26T01:00:00Z",
};

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    presentationId: PRESENTATION.id,
    template: "cover",
    sortOrder: 0,
    title: "표지",
    subtitle: "",
    author: "Y&ARCHER",
    pageName: "",
    content: null,
    image: null,
    html: null,
    ...overrides,
  };
}

const CONTENT_SLIDE = slide({
  id: "slide-2",
  template: "content",
  title: "실시간 시연",
  author: "",
  pageName: "DEMO",
  content: {
    type: "website",
    url: "https://example.com",
    reloadOnEnter: false,
    viewport: { width: 1920, height: 1080 },
  },
});

function renderDocument(slides: Slide[]) {
  const { container } = render(<PdfDocument presentation={PRESENTATION} slides={slides} />);
  return container.firstElementChild as HTMLElement;
}

/**
 * jsdom은 이미지를 실제로 불러오지 않아 `complete`가 계속 false다.
 * 실제 브라우저에서 로고와 슬라이드 이미지가 다 뜬 상태를 흉내 낸다.
 */
function settleImages() {
  for (const image of Array.from(window.document.querySelectorAll("img"))) {
    fireEvent.load(image);
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe("PdfDocument", () => {
  it("슬라이드마다 한 페이지를 저장된 순서로 만든다", () => {
    renderDocument([slide(), CONTENT_SLIDE]);

    // 로고도 이미지 역할을 가지므로 슬라이드 설명이 붙은 것만 고른다.
    const pages = screen.getAllByRole("img", { name: /페이지/ });
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveAccessibleName("1페이지 표지 슬라이드: 표지");
    expect(pages[1]).toHaveAccessibleName("2페이지 본문 슬라이드: 실시간 시연");
  });

  it("웹페이지가 없으면 폰트 준비만 기다린 뒤 인쇄해도 된다고 알린다", async () => {
    vi.useFakeTimers();
    const document = renderDocument([slide()]);

    expect(document).toHaveAttribute("data-pdf-ready", "false");

    await act(async () => {
      settleImages();
      await vi.advanceTimersByTimeAsync(PDF_SETTLE_MS + 50);
    });

    expect(document).toHaveAttribute("data-pdf-ready", "true");
  });

  it("웹페이지 로딩이 끝나기 전에는 인쇄 준비를 알리지 않는다", async () => {
    vi.useFakeTimers();
    const document = renderDocument([CONTENT_SLIDE]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PDF_SETTLE_MS + 50);
    });
    expect(document).toHaveAttribute("data-pdf-ready", "false");

    const frame = screen.getByTitle("실시간 시연 웹페이지");
    await act(async () => {
      fireEvent.load(frame);
      settleImages();
      await vi.advanceTimersByTimeAsync(PDF_SETTLE_MS + 50);
    });

    expect(document).toHaveAttribute("data-pdf-ready", "true");
    expect(document).toHaveAttribute("data-pdf-frames", "loaded");
  });

  it("웹페이지가 끝내 응답하지 않으면 기다리기를 멈추고 실패를 알린다", async () => {
    vi.useFakeTimers();
    const document = renderDocument([slide(), CONTENT_SLIDE]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PDF_FRAME_TIMEOUT_MS + PDF_SETTLE_MS + 50);
    });

    // 생성기는 이 값을 보고 반쯤 빈 PDF 대신 오류를 돌려준다.
    expect(document).toHaveAttribute("data-pdf-ready", "true");
    expect(document).toHaveAttribute("data-pdf-frames", "timeout");
  });
});
