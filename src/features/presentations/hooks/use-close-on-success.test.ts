import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PresentationActionState } from "../types";
import { useCloseOnSuccess } from "./use-close-on-success";

const SUCCESS: PresentationActionState = { status: "success", message: "저장했습니다." };

type HookProps = { state: PresentationActionState; onClose: () => void };

function renderCloseOnSuccess(initialProps: HookProps) {
  return renderHook(({ state, onClose }: HookProps) => useCloseOnSuccess(state, onClose), {
    initialProps,
  });
}

describe("useCloseOnSuccess", () => {
  it("아직 성공하지 않았으면 닫지 않는다", () => {
    const onClose = vi.fn();
    renderCloseOnSuccess({ state: { status: "idle" }, onClose });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("성공 상태가 되면 닫는다", () => {
    const onClose = vi.fn();
    const { rerender } = renderCloseOnSuccess({ state: { status: "idle" }, onClose });

    rerender({ state: SUCCESS, onClose });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("닫기 함수가 새로 만들어져도 같은 결과로 다시 닫지 않는다", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderCloseOnSuccess({ state: SUCCESS, onClose: first });

    expect(first).toHaveBeenCalledTimes(1);

    // 목록이 다시 그려져 닫기 함수만 새로 만들어진 상황.
    rerender({ state: SUCCESS, onClose: second });

    expect(second).not.toHaveBeenCalled();
  });

  it("새 성공 결과가 오면 다시 닫는다", () => {
    const onClose = vi.fn();
    const { rerender } = renderCloseOnSuccess({ state: SUCCESS, onClose });

    rerender({ state: { status: "success", message: "다시 저장했습니다." }, onClose });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
