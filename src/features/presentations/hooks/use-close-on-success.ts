"use client";

import { useEffect, useRef } from "react";
import type { PresentationActionState } from "../types";

/**
 * 액션이 성공하면 모달을 닫는다.
 *
 * `useActionState`는 마지막 결과를 계속 들고 있으므로 성공 상태는 이후 렌더에도 남는다.
 * 이미 처리한 상태 객체를 기억해 두고 새 결과일 때만 닫는다.
 * 그렇지 않으면 목록이 다시 그려질 때마다 지금 열려 있는 다른 모달까지 닫힌다.
 *
 * 서버 액션이 `revalidatePath`로 목록을 다시 그리므로 화면 상태를 따로 갱신하지 않는다.
 */
export function useCloseOnSuccess(state: PresentationActionState, onClose: () => void) {
  const handledState = useRef<PresentationActionState | null>(null);

  useEffect(() => {
    if (state.status !== "success" || handledState.current === state) return;
    handledState.current = state;
    onClose();
  }, [state, onClose]);
}
