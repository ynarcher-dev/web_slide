import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "./use-auto-save";
import type { SlideSaveResult } from "../types";

const SUCCESS: SlideSaveResult = { status: "success" };
const FAILURE: SlideSaveResult = { status: "error", message: "저장하지 못했습니다." };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** 예약된 타이머를 진행시키고 저장 응답까지 기다린다. */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useAutoSave", () => {
  it("입력이 멈춘 뒤 마지막 값만 한 번 저장한다", async () => {
    const save = vi.fn().mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAutoSave(save, { delay: 500 }));

    act(() => {
      result.current.schedule("첫 값");
      result.current.schedule("마지막 값");
    });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe("saving");

    await advance(500);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("마지막 값");
    expect(result.current.status).toBe("saved");
  });

  it("flush는 기다리지 않고 즉시 저장한다", async () => {
    const save = vi.fn().mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAutoSave(save, { delay: 500 }));

    act(() => result.current.schedule("값"));
    await act(async () => result.current.flush());

    expect(save).toHaveBeenCalledWith("값");
    expect(result.current.status).toBe("saved");
  });

  it("예약된 값이 없으면 flush해도 저장하지 않는다", async () => {
    const save = vi.fn().mockResolvedValue(SUCCESS);
    const { result } = renderHook(() => useAutoSave(save, { delay: 500 }));

    await act(async () => result.current.flush());

    expect(save).not.toHaveBeenCalled();
  });

  it("저장에 실패하면 상태와 안내 문구를 남기고 재시도할 수 있다", async () => {
    const save = vi.fn().mockResolvedValueOnce(FAILURE).mockResolvedValueOnce(SUCCESS);
    const { result } = renderHook(() => useAutoSave(save, { delay: 500 }));

    act(() => result.current.schedule("값"));
    await advance(500);

    expect(result.current.status).toBe("error");
    expect(result.current.message).toBe("저장하지 못했습니다.");

    await act(async () => result.current.retry());

    expect(save).toHaveBeenNthCalledWith(2, "값");
    expect(result.current.status).toBe("saved");
    expect(result.current.message).toBeUndefined();
  });

  it("먼저 보낸 저장이 늦게 끝나도 마지막 결과만 반영한다", async () => {
    let resolveFirst: (value: SlideSaveResult) => void = () => {};
    const save = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<SlideSaveResult>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(SUCCESS);

    const { result } = renderHook(() => useAutoSave(save, { delay: 500 }));

    act(() => result.current.schedule("첫 값"));
    await advance(500);

    act(() => result.current.schedule("두 번째 값"));
    await advance(500);

    expect(result.current.status).toBe("saved");

    // 먼저 시작한 저장이 뒤늦게 실패해도 최신 상태를 덮지 않는다.
    await act(async () => resolveFirst(FAILURE));

    expect(result.current.status).toBe("saved");
  });

  it("화면에서 사라질 때 예약된 값을 저장한다", async () => {
    const save = vi.fn().mockResolvedValue(SUCCESS);
    const { result, unmount } = renderHook(() => useAutoSave(save, { delay: 500 }));

    act(() => result.current.schedule("남은 값"));
    await act(async () => unmount());

    expect(save).toHaveBeenCalledWith("남은 값");
  });
});
