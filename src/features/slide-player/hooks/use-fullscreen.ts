"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 브라우저 전체화면 상태를 다룬다.
 *
 * 전체화면은 사용자가 ESC로도 빠져나갈 수 있으므로 상태를 직접 들고 있지 않고
 * `fullscreenchange` 이벤트로 브라우저의 실제 상태를 따라간다.
 */
export function useFullscreen(element: HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const enter = useCallback(async () => {
    // 사용자 동작 없이 호출하면 브라우저가 거부한다. 발표 진행을 막지 않도록 조용히 넘어간다.
    try {
      await element?.requestFullscreen();
    } catch {
      // 전체화면에 실패해도 발표는 창 안에서 그대로 진행할 수 있다.
    }
  }, [element]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // 이미 빠져나온 경우다.
    }
  }, []);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      await exit();
      return;
    }
    await enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
