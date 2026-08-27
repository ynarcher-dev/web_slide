import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("라벨과 입력창을 연결한다", async () => {
    const user = userEvent.setup();
    render(<TextField label="대제목" />);

    const input = screen.getByLabelText("대제목");
    await user.type(input, "사용자 대시보드");

    expect(input).toHaveValue("사용자 대시보드");
  });

  it("도움말을 aria-describedby로 연결한다", () => {
    render(<TextField label="푸터" description="모든 슬라이드에 표시됩니다." />);

    expect(screen.getByLabelText("푸터")).toHaveAccessibleDescription(
      "모든 슬라이드에 표시됩니다.",
    );
  });

  it("오류가 있으면 aria-invalid와 오류 메시지를 표시하고 도움말을 대체한다", () => {
    render(
      <TextField label="주소" description="도움말" error="HTTPS 주소만 사용할 수 있습니다." />,
    );

    const input = screen.getByLabelText("주소");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("HTTPS 주소만 사용할 수 있습니다.");
    expect(screen.queryByText("도움말")).not.toBeInTheDocument();
  });
});
