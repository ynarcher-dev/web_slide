import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SlideEditorShell } from "./slide-editor-shell";

function renderShell() {
  render(
    <SlideEditorShell
      header={<span>서비스 소개</span>}
      slideList={<p>목록 영역</p>}
      preview={<p>미리보기 영역</p>}
      properties={<p>속성 영역</p>}
    />,
  );
}

describe("SlideEditorShell", () => {
  it("세 패널을 각각 이름 있는 영역으로 렌더링한다", () => {
    renderShell();

    expect(screen.getByRole("region", { name: "슬라이드 목록" })).toHaveTextContent("목록 영역");
    expect(screen.getByRole("region", { name: "슬라이드 미리보기" })).toHaveTextContent(
      "미리보기 영역",
    );
    expect(screen.getByRole("region", { name: "슬라이드 속성" })).toHaveTextContent("속성 영역");
  });

  it("좁은 화면 전환 버튼의 기본 선택은 미리보기다", () => {
    renderShell();

    expect(screen.getByRole("button", { name: "미리보기" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "슬라이드" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("전환 버튼을 누르면 해당 패널만 좁은 화면에서 보이게 한다", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "속성" }));

    expect(screen.getByRole("button", { name: "속성" })).toHaveAttribute("aria-pressed", "true");
    // 좁은 화면에서는 숨기고 lg 이상에서는 다시 보이도록 클래스를 전환한다.
    expect(screen.getByRole("region", { name: "슬라이드 미리보기" }).className).toContain("hidden");
    expect(screen.getByRole("region", { name: "슬라이드 속성" }).className).toContain("flex");
  });
});
