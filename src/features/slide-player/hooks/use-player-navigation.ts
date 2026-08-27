"use client";

import { useCallback, useState } from "react";

function clamp(value: number, max: number): number {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/**
 * 발표 중 현재 슬라이드 위치를 관리한다.
 *
 * 첫 페이지에서 이전, 마지막 페이지에서 다음을 눌러도 범위를 벗어나지 않는다.
 * 이동은 목표 위치를 그대로 지정하는 방식이라 빠르게 여러 번 눌러도 상태가 엉키지 않는다.
 */
export function usePlayerNavigation(total: number) {
  const maxIndex = Math.max(total - 1, 0);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => setIndex(clamp(next, Math.max(total - 1, 0))),
    [total],
  );

  // 슬라이드가 지워져 목록이 짧아져도 화면이 빈 곳을 가리키지 않게 한다.
  const safeIndex = clamp(index, maxIndex);

  return {
    index: safeIndex,
    goTo,
    isFirst: safeIndex <= 0,
    isLast: safeIndex >= maxIndex,
  };
}
