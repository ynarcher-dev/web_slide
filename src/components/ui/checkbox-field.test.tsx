import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CheckboxField } from "./checkbox-field";

describe("CheckboxField", () => {
  it("라벨로 입력을 찾을 수 있고 도움말을 연결한다", () => {
    render(<CheckboxField label="페이지 번호 표시" description="본문 슬라이드에 표시합니다." />);

    const checkbox = screen.getByLabelText("페이지 번호 표시");
    expect(checkbox).toHaveAccessibleDescription("본문 슬라이드에 표시합니다.");
    expect(checkbox).not.toBeChecked();
  });

  it("클릭으로 상태를 바꾼다", async () => {
    const user = userEvent.setup();
    render(<CheckboxField label="공개 공유 허용" defaultChecked />);

    const checkbox = screen.getByLabelText("공개 공유 허용");
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
