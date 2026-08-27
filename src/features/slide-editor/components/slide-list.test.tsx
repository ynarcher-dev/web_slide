import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PresentationTheme, Slide } from "@/types/domain";
import { SlideList } from "./slide-list";

const THEME: PresentationTheme = {
  brandColor: "#e42317",
  coverTint: 0,
  footerText: "",
  showPageNumber: true,
};

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    presentationId: "presentation-1",
    template: "content",
    sortOrder: 0,
    title: "",
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
  slide({ id: "b", title: "사용자 대시보드", sortOrder: 1 }),
  slide({ id: "c", title: "", sortOrder: 2 }),
];

function renderList(overrides: Partial<Parameters<typeof SlideList>[0]> = {}) {
  const props = {
    slides: SLIDES,
    theme: THEME,
    selectedSlideId: "a",
    pending: false,
    error: null,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
    onDismissError: vi.fn(),
    ...overrides,
  };

  render(<SlideList {...props} />);
  return props;
}

describe("슬라이드 목록", () => {
  it("페이지 번호, 템플릿 유형, 제목을 함께 보여 준다", () => {
    renderList();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("1");
    expect(items[0]).toHaveTextContent("표지");
    expect(items[0]).toHaveTextContent("Web Slide");
    expect(items[1]).toHaveTextContent("본문");
    expect(items[1]).toHaveTextContent("사용자 대시보드");
  });

  it("제목이 없으면 대신 안내 문구를 보여 준다", () => {
    renderList();

    expect(screen.getAllByRole("listitem")[2]).toHaveTextContent("제목 없는 슬라이드");
  });

  it("선택한 슬라이드를 표시한다", () => {
    renderList({ selectedSlideId: "b" });

    const selected = screen.getAllByRole("button", { current: true });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("사용자 대시보드");
  });

  it("항목을 누르면 선택을 알린다", async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(
      screen.getByRole("button", { name: "2페이지 본문 슬라이드: 사용자 대시보드" }),
    );

    expect(props.onSelect).toHaveBeenCalledWith("b");
  });
});

describe("슬라이드 만들기", () => {
  it("추가 메뉴에서 표지와 본문을 고를 수 있다", async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole("button", { name: /슬라이드 추가/ }));
    await user.click(screen.getByRole("menuitem", { name: "본문 슬라이드" }));

    expect(props.onCreate).toHaveBeenCalledWith("content");
  });

  it("슬라이드가 없으면 표지와 본문 만들기를 함께 제안한다", async () => {
    const user = userEvent.setup();
    const props = renderList({ slides: [], selectedSlideId: null });

    expect(screen.getByText("슬라이드가 없습니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "표지 만들기" }));
    expect(props.onCreate).toHaveBeenCalledWith("cover");

    await user.click(screen.getByRole("button", { name: "본문 만들기" }));
    expect(props.onCreate).toHaveBeenCalledWith("content");
  });
});

describe("순서 변경", () => {
  it("항목 메뉴로 위아래로 옮길 수 있다", async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole("button", { name: "2페이지 슬라이드 메뉴" }));
    await user.click(screen.getByRole("menuitem", { name: "위로 이동" }));

    expect(props.onMove).toHaveBeenCalledWith(1, 0);
  });

  it("첫 슬라이드는 위로, 마지막 슬라이드는 아래로 옮길 수 없다", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("button", { name: "1페이지 슬라이드 메뉴" }));
    expect(screen.getByRole("menuitem", { name: "위로 이동" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "아래로 이동" })).toBeEnabled();
  });
});

describe("슬라이드 삭제", () => {
  it("확인 절차를 거친 뒤에만 삭제한다", async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole("button", { name: "2페이지 슬라이드 메뉴" }));
    await user.click(screen.getByRole("menuitem", { name: "삭제" }));

    const dialog = screen.getByRole("dialog", { name: "슬라이드 삭제" });
    expect(dialog).toHaveTextContent("사용자 대시보드");
    expect(props.onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(props.onDelete).toHaveBeenCalledWith("b");
  });

  it("취소하면 삭제하지 않는다", async () => {
    const user = userEvent.setup();
    const props = renderList();

    await user.click(screen.getByRole("button", { name: "2페이지 슬라이드 메뉴" }));
    await user.click(screen.getByRole("menuitem", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(props.onDelete).not.toHaveBeenCalled();
  });
});

describe("오류 상태", () => {
  it("목록 요청이 실패하면 메시지를 보여 준다", () => {
    renderList({ error: "슬라이드 순서를 저장하지 못했습니다." });

    expect(screen.getByRole("alert")).toHaveTextContent("슬라이드 순서를 저장하지 못했습니다.");
  });
});
