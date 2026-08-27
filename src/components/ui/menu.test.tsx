import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Menu } from "./menu";

function renderMenu(onDelete = vi.fn(), onDuplicate = vi.fn()) {
  render(
    <Menu
      label="슬라이드 메뉴"
      items={[
        { id: "duplicate", label: "복제", onSelect: onDuplicate },
        { id: "delete", label: "삭제", destructive: true, onSelect: onDelete },
      ]}
    />,
  );
  return { onDelete, onDuplicate };
}

describe("Menu", () => {
  it("처음에는 닫혀 있다", () => {
    renderMenu();

    expect(screen.getByRole("button", { name: /슬라이드 메뉴/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("트리거를 클릭하면 열리고 첫 항목으로 포커스를 옮긴다", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: /슬라이드 메뉴/ }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "복제" })).toHaveFocus();
  });

  it("방향키로 항목을 이동하고 Enter로 선택한다", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderMenu();

    await user.click(screen.getByRole("button", { name: /슬라이드 메뉴/ }));
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("첫 항목이 비활성이면 건너뛰고 사용할 수 있는 항목에 포커스를 준다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <Menu
        label="슬라이드 메뉴"
        items={[
          { id: "up", label: "위로 이동", disabled: true, onSelect: vi.fn() },
          { id: "down", label: "아래로 이동", disabled: true, onSelect: vi.fn() },
          { id: "delete", label: "삭제", destructive: true, onSelect: onDelete },
        ]}
      />,
    );

    // 비활성 버튼은 포커스를 받지 못한다. 건너뛰지 않으면 키보드로 메뉴를 쓸 수 없다.
    await user.click(screen.getByRole("button", { name: /슬라이드 메뉴/ }));
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveFocus();

    // 방향키로 돌아도 사용할 수 있는 항목에만 머문다.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("Escape를 누르면 닫고 트리거로 포커스를 되돌린다", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: /슬라이드 메뉴/ });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    // 닫기 애니메이션이 끝난 뒤 실제로 제거된다.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
