import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("기본 type은 submit이 아닌 button이다", () => {
    render(<Button>확인</Button>);
    expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute("type", "button");
  });

  it("클릭하면 onClick을 호출한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading이면 비활성화하고 진행 상태를 알린다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        저장 중
      </Button>,
    );

    const button = screen.getByRole("button", { name: "저장 중" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
