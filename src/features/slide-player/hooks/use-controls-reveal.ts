"use client";

import { useEffect, useState } from "react";

export type ControlsRevealOptions = {
  /** 화면 위에서 이 높이(px) 안으로 포인터가 들어오면 컨트롤을 내린다. */
  topZonePx: number;
  /** 처음 보여 준 뒤 스스로 접힐 때까지 기다리는 시간. */
  hideDelayMs: number;
};

/**
 * 상단 발표 컨트롤의 표시 여부.
 *
 * 처음에는 컨트롤이 어디 있는지 알 수 있게 잠시 보여 준 뒤 접는다. 그다음부터는 포인터가
 * 화면 위쪽 구역에 있을 때만 내려온다. 키보드로 포커스를 옮겼을 때는 CSS `:focus-within`이
 * 같은 일을 하므로 여기서 다루지 않는다.
 *
 * 웹페이지 조작 중에도 규칙은 같다. 조작 중에는 포인터가 iframe 안에 있어 이벤트가 오지 않지만,
 * 마우스를 화면 위로 빼는 순간 다시 내려온다. 돌아오는 길은 이 밖에도 ESC와 웹페이지 바깥 클릭이 있다.
 */
export function useControlsReveal({ topZonePx, hideDelayMs }: ControlsRevealOptions) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => setVisible(false),
      hideDelayMs,
    );

    // 포인터가 한 번이라도 움직이면 첫 노출 타이머는 의미가 없다. 위치가 곧 표시 여부다.
    const track = (event: PointerEvent) => {
      clearTimeout(timer);
      timer = undefined;
      setVisible(event.clientY <= topZonePx);
    };

    window.addEventListener("pointermove", track);
    window.addEventListener("pointerdown", track);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", track);
      window.removeEventListener("pointerdown", track);
    };
  }, [hideDelayMs, topZonePx]);

  return visible;
}
