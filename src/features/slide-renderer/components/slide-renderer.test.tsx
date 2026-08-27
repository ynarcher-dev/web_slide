import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PresentationTheme, Slide } from "@/types/domain";
import { SlideRenderer } from "./slide-renderer";

const THEME: PresentationTheme = {
  brandColor: "#e42317",
  coverTint: 20,
  footerText: "Copyright © 2026 Y&ARCHER",
  showPageNumber: true,
};

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    presentationId: "presentation-1",
    template: "content",
    sortOrder: 0,
    title: "사용자 대시보드",
    subtitle: "주요 기능을 직접 확인합니다.",
    author: "",
    pageName: "PRODUCT DEMO",
    content: null,
    image: null,
    html: null,
    ...overrides,
  };
}

describe("표지 템플릿", () => {
  it("제목, 소제목, 발표자와 로고를 보여 준다", () => {
    render(
      <SlideRenderer
        slide={slide({ template: "cover", title: "Web Slide", author: "Y&ARCHER" })}
        theme={THEME}
        pageNumber={1}
      />,
    );

    expect(screen.getByRole("heading", { name: "Web Slide" })).toBeInTheDocument();
    expect(screen.getByText("주요 기능을 직접 확인합니다.")).toBeInTheDocument();
    expect(screen.getByText("Y&ARCHER")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Y&ARCHER" })).toBeInTheDocument();
  });

  it("표지에는 푸터와 페이지 번호를 넣지 않는다", () => {
    render(<SlideRenderer slide={slide({ template: "cover" })} theme={THEME} pageNumber={1} />);

    expect(screen.queryByText(THEME.footerText)).not.toBeInTheDocument();
  });
});

describe("이미지 템플릿", () => {
  it("본문과 같은 자리에 이미지를 보여 준다", () => {
    render(
      <SlideRenderer
        slide={slide({
          template: "image",
          image: { path: "p-1/photo.png", url: "https://cdn.example.com/photo.png" },
        })}
        theme={THEME}
        pageNumber={2}
      />,
    );

    // 글 영역과 푸터는 본문 슬라이드와 똑같이 그린다.
    expect(screen.getByText("PRODUCT DEMO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "사용자 대시보드" })).toBeInTheDocument();
    expect(screen.getByText(THEME.footerText)).toBeInTheDocument();

    const image = screen.getByRole("img", { name: "사용자 대시보드 이미지" });
    expect(image).toHaveAttribute("src", "https://cdn.example.com/photo.png");
    // 이미지 슬라이드에는 조작할 웹페이지가 없다.
    expect(screen.queryByTestId("web-frame-lock")).not.toBeInTheDocument();
  });

  it("이미지가 없으면 안내 문구를 보여 준다", () => {
    render(<SlideRenderer slide={slide({ template: "image" })} theme={THEME} pageNumber={2} />);

    expect(screen.getByText("이미지가 아직 없습니다.")).toBeInTheDocument();
  });
});

describe("HTML 템플릿", () => {
  it("붙여 넣은 HTML을 격리된 화면으로 보여 준다", () => {
    render(
      <SlideRenderer
        slide={slide({ template: "html", html: { source: "<p>차트</p>" } })}
        theme={THEME}
        pageNumber={4}
      />,
    );

    // 글 영역과 푸터는 본문 슬라이드와 똑같이 그린다.
    expect(screen.getByRole("heading", { name: "사용자 대시보드" })).toBeInTheDocument();
    expect(screen.getByText(THEME.footerText)).toBeInTheDocument();

    const frame = screen.getByTestId("html-frame");
    // 조각은 기본 문서로 감싸 슬라이드 영역을 꽉 채운다.
    expect(frame.getAttribute("srcdoc")).toContain("<p>차트</p>");
    expect(frame.getAttribute("srcdoc")).toContain("height: 100%");
    // allow-same-origin이 없어야 우리 쪽 쿠키와 DOM에 닿지 못한다.
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    // 기본은 조작 잠금 상태다.
    expect(screen.getByTestId("html-frame-lock")).toBeInTheDocument();
  });

  it("HTML이 없으면 안내 문구를 보여 준다", () => {
    render(<SlideRenderer slide={slide({ template: "html" })} theme={THEME} pageNumber={4} />);

    expect(screen.getByText("HTML이 아직 없습니다.")).toBeInTheDocument();
  });

  it("정적 모드에서는 iframe을 만들지 않는다", () => {
    render(
      <SlideRenderer
        slide={slide({ template: "html", html: { source: "<p>차트</p>" } })}
        theme={THEME}
        pageNumber={4}
        mode="static"
      />,
    );

    expect(screen.queryByTestId("html-frame")).not.toBeInTheDocument();
    expect(screen.getByText("HTML 슬라이드")).toBeInTheDocument();
  });
});

describe("본문 템플릿", () => {
  it("페이지명, 대제목, 소제목, 푸터, 페이지 번호를 보여 준다", () => {
    render(<SlideRenderer slide={slide()} theme={THEME} pageNumber={3} />);

    expect(screen.getByText("PRODUCT DEMO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "사용자 대시보드" })).toBeInTheDocument();
    expect(screen.getByText(THEME.footerText)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("페이지 번호 표시를 끄면 번호를 감춘다", () => {
    render(
      <SlideRenderer slide={slide()} theme={{ ...THEME, showPageNumber: false }} pageNumber={3} />,
    );

    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("URL이 없으면 안내 문구를 보여 준다", () => {
    render(<SlideRenderer slide={slide()} theme={THEME} pageNumber={2} />);

    expect(screen.getByText("웹페이지 URL이 아직 없습니다.")).toBeInTheDocument();
  });

  it("URL이 있으면 웹페이지를 iframe으로 띄운다", () => {
    render(
      <SlideRenderer
        slide={slide({
          content: {
            type: "website",
            url: "https://example.com",
            reloadOnEnter: false,
            viewport: { width: 1920, height: 1080 },
          },
        })}
        theme={THEME}
        pageNumber={2}
      />,
    );

    const frame = screen.getByTitle("사용자 대시보드 웹페이지");
    expect(frame).toHaveAttribute("src", "https://example.com");
    // 기본은 조작 잠금 상태다.
    expect(screen.getByTestId("web-frame-lock")).toBeInTheDocument();
  });

  it("조작을 켜면 웹페이지 영역을 활성 상태로 표시한다", () => {
    const content = {
      type: "website",
      url: "https://example.com",
      reloadOnEnter: false,
      viewport: { width: 1920, height: 1080 },
    } as const;

    const { rerender } = render(
      <SlideRenderer slide={slide({ content })} theme={THEME} pageNumber={2} />,
    );

    // 테두리 색을 바꾸는 표시다. 잠겨 있을 때는 켜지지 않는다.
    expect(
      screen.getByTitle("사용자 대시보드 웹페이지").closest("[data-interactive]"),
    ).toHaveAttribute("data-interactive", "false");

    rerender(<SlideRenderer slide={slide({ content })} theme={THEME} pageNumber={2} interactive />);

    expect(
      screen.getByTitle("사용자 대시보드 웹페이지").closest("[data-interactive]"),
    ).toHaveAttribute("data-interactive", "true");
  });

  it("정적 모드에서는 iframe 대신 주소만 보여 준다", () => {
    render(
      <SlideRenderer
        slide={slide({
          content: {
            type: "website",
            url: "https://demo.example.com/path",
            reloadOnEnter: false,
            viewport: { width: 1920, height: 1080 },
          },
        })}
        theme={THEME}
        pageNumber={2}
        mode="static"
      />,
    );

    expect(screen.queryByTitle("사용자 대시보드 웹페이지")).not.toBeInTheDocument();
    expect(screen.getByText("demo.example.com")).toBeInTheDocument();
  });
});
