import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

function renderModal(onClose = vi.fn()) {
  render(
    <Modal open onClose={onClose} title="슬라이드를 삭제할까요?" description="되돌릴 수 없습니다.">
      <button type="button">내부 버튼</button>
    </Modal>,
  );
  return onClose;
}

describe("Modal", () => {
  it("닫혀 있으면 아무것도 렌더링하지 않는다", () => {
    render(<Modal open={false} onClose={vi.fn()} title="제목" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("제목과 설명을 접근 가능한 이름으로 연결한다", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("슬라이드를 삭제할까요?");
    expect(dialog).toHaveAccessibleDescription("되돌릴 수 없습니다.");
  });

  it("열리면 내부 첫 요소로 포커스를 옮긴다", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "내부 버튼" })).toHaveFocus();
  });

  it("Escape를 누르면 onClose를 호출한다", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("배경을 클릭하면 onClose를 호출한다", async () => {
    const user = userEvent.setup();
    const onClose = renderModal();

    await user.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
