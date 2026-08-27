import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";
import { ErrorMessage } from "./error-message";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  it("진행 상태를 status 역할로 알린다", () => {
    render(<LoadingState message="슬라이드를 불러오는 중입니다." />);

    expect(screen.getByRole("status")).toHaveTextContent("슬라이드를 불러오는 중입니다.");
  });
});

describe("EmptyState", () => {
  it("제목, 설명과 동작을 표시한다", () => {
    render(
      <EmptyState
        title="아직 슬라이드가 없습니다."
        description="표지부터 만들어 보세요."
        action={<button type="button">표지 만들기</button>}
      />,
    );

    expect(screen.getByText("아직 슬라이드가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("표지부터 만들어 보세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "표지 만들기" })).toBeInTheDocument();
  });
});

describe("ErrorMessage", () => {
  it("alert 역할로 오류를 알리고 재시도를 호출한다", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorMessage message="저장하지 못했습니다." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다.");

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
