import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Presentation, Slide } from "@/types/domain";
import { SlidePlayer } from "./slide-player";

const PRESENTATION: Presentation = {
  id: "presentation-1",
  ownerId: "owner-1",
  title: "Web Slide 데모",
  theme: {
    brandColor: "#e42317",
    coverTint: 12,
    footerText: "Copyright © 2026 Y&ARCHER",
    showPageNumber: true,
  },
  isPublic: false,
  shareId: "share-1",
  createdAt: "2026-08-26T00:00:00Z",
  updatedAt: "2026-08-26T00:00:00Z",
};

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    presentationId: PRESENTATION.id,
    template: "content",
    sortOrder: 0,
    title: "본문",
    subtitle: "",
    author: "",
    pageName: "",
    content: null,
    image: null,
    html: null,
    ...overrides,
  };
}

const SLIDES = [
  slide({ id: "a", template: "cover", title: "Web Slide", sortOrder: 0 }),
  slide({
    id: "b",
    title: "실시간 시연",
    sortOrder: 1,
    content: {
      type: "website",
      url: "https://example.com",
      reloadOnEnter: false,
      viewport: { width: 1920, height: 1080 },
    },
  }),
  slide({ id: "c", title: "마무리", sortOrder: 2 }),
];

function renderPlayer(slides = SLIDES) {
  const view = render(
    <SlidePlayer presentation={PRESENTATION} slides={slides} exitHref="/presentations" />,
  );

  /** 현재 보이는 슬라이드 레이어. */
  const activeLayer = () => view.container.querySelector('[data-active="true"]');
  return { ...view, activeLayer };
}

describe("발표 시작", () => {
  it("첫 슬라이드부터 보여 준다", () => {
    const { activeLayer } = renderPlayer();

    expect(activeLayer()).toHaveTextContent("Web Slide");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});

describe("슬라이드 이동", () => {
  it("다음과 이전 버튼으로 이동한다", async () => {
    const user = userEvent.setup();
    const { activeLayer } = renderPlayer();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(activeLayer()).toHaveTextContent("실시간 시연");

    await user.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("방향키로도 이동한다", async () => {
    const user = userEvent.setup();
    renderPlayer();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.keyboard("{End}");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("첫 페이지와 마지막 페이지에서는 더 이동하지 않는다", async () => {
    const user = userEvent.setup();
    renderPlayer();

    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });
});

describe("웹페이지 조작 모드", () => {
  it("웹페이지가 있는 슬라이드에서만 조작 버튼을 보여 준다", async () => {
    const user = userEvent.setup();
    renderPlayer();

    expect(screen.queryByRole("button", { name: "웹페이지 조작" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByRole("button", { name: "웹페이지 조작" })).toBeInTheDocument();
  });

  it("조작을 켜면 잠금을 풀고, 슬라이드를 옮기면 다시 잠근다", async () => {
    const user = userEvent.setup();
    renderPlayer();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getAllByTestId("web-frame-lock").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "웹페이지 조작" }));
    expect(screen.queryByTestId("web-frame-lock")).not.toBeInTheDocument();
    expect(screen.getByText(/웹페이지를 조작하는 중입니다/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.queryByText(/웹페이지를 조작하는 중입니다/)).not.toBeInTheDocument();
  });

  it("웹페이지 영역을 누르면 조작이 켜지고 바깥을 누르면 꺼진다", async () => {
    const user = userEvent.setup();
    const { activeLayer } = renderPlayer();

    await user.click(screen.getByRole("button", { name: "다음" }));

    // 잠긴 웹페이지 영역이 조작을 켜는 버튼 노릇을 한다.
    await user.click(screen.getByTestId("web-frame-lock"));
    expect(screen.queryByTestId("web-frame-lock")).not.toBeInTheDocument();
    expect(screen.getByText(/웹페이지를 조작하는 중입니다/)).toBeInTheDocument();

    // 웹페이지 바깥을 누르면 다시 슬라이드 이동 모드가 된다.
    await user.click(activeLayer() as HTMLElement);
    expect(screen.getByTestId("web-frame-lock")).toBeInTheDocument();
    expect(screen.queryByText(/웹페이지를 조작하는 중입니다/)).not.toBeInTheDocument();
    // 이동 위치는 그대로 유지한다.
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("ESC를 누르면 슬라이드 이동 모드로 돌아온다", async () => {
    const user = userEvent.setup();
    renderPlayer();

    await user.click(screen.getByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "웹페이지 조작" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByText(/웹페이지를 조작하는 중입니다/)).not.toBeInTheDocument();
    // 이동 위치는 그대로 유지한다.
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});

describe("발표 컨트롤", () => {
  it("iframe 바깥의 컨트롤은 항상 화면에 남아 있다", () => {
    renderPlayer();

    expect(screen.getByRole("group", { name: "발표 컨트롤" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "발표 종료" })).toHaveAttribute(
      "href",
      "/presentations",
    );
  });
});

describe("슬라이드 진입 시 새로고침", () => {
  const reloadingSlides = [
    slide({ id: "cover", template: "cover", title: "표지", sortOrder: 0 }),
    slide({
      id: "keep",
      title: "유지",
      sortOrder: 1,
      content: {
        type: "website",
        url: "https://keep.example.com",
        reloadOnEnter: false,
        viewport: { width: 1920, height: 1080 },
      },
    }),
    slide({
      id: "reload",
      title: "새로고침",
      sortOrder: 2,
      content: {
        type: "website",
        url: "https://reload.example.com",
        reloadOnEnter: true,
        viewport: { width: 1920, height: 1080 },
      },
    }),
  ];

  it("설정을 켠 슬라이드만 다시 들어올 때 웹페이지를 새로 만든다", async () => {
    const user = userEvent.setup();
    renderPlayer(reloadingSlides);

    const keepFrame = () => screen.getByTitle("유지 웹페이지");
    const reloadFrame = () => screen.getByTitle("새로고침 웹페이지");

    await user.click(screen.getByRole("button", { name: "다음" }));
    const keepBefore = keepFrame();
    await user.click(screen.getByRole("button", { name: "다음" }));
    const reloadBefore = reloadFrame();

    await user.click(screen.getByRole("button", { name: "이전" }));
    // 새로고침을 끈 슬라이드는 시연하던 상태를 잃지 않도록 그대로 둔다.
    expect(keepFrame()).toBe(keepBefore);

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(reloadFrame()).not.toBe(reloadBefore);
  });
});

describe("빠른 연속 이동", () => {
  it("연달아 눌러도 마지막 위치 하나로 정리된다", async () => {
    const user = userEvent.setup();
    const { activeLayer } = renderPlayer();

    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowLeft}");

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(activeLayer()).toHaveTextContent("실시간 시연");
    // 화면에 남는 현재 슬라이드는 항상 한 장이다.
    expect(document.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  });
});
