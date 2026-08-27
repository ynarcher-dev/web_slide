import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveStatusBadge } from "./save-status-badge";

describe("SaveStatusBadge", () => {
  it("저장 중과 저장 완료 상태를 알려 준다", () => {
    const { rerender } = render(<SaveStatusBadge status="saving" onRetry={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("저장 중");

    rerender(<SaveStatusBadge status="saved" onRetry={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("저장됨");
  });

  it("실패했을 때만 원인과 재시도 버튼을 보여 준다", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { rerender } = render(<SaveStatusBadge status="saved" onRetry={onRetry} />);
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();

    rerender(<SaveStatusBadge status="error" message="네트워크 오류입니다." onRetry={onRetry} />);
    expect(screen.getByRole("status")).toHaveTextContent("저장 실패: 네트워크 오류입니다.");

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
