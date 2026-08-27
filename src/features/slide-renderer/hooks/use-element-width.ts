"use client";

import { useLayoutEffect, useState } from "react";

/**
 * 요소의 레이아웃 크기(px)를 추적한다.
 *
 * `offsetWidth`/`offsetHeight`와 `ResizeObserver`는 CSS transform의 영향을 받지 않는 레이아웃
 * 크기를 준다. 그래서 이미 축소된 슬라이드 안에서도 기준 좌표계 기준의 크기를 그대로 얻을 수 있다.
 * `getBoundingClientRect`는 transform이 반영된 값이라 여기서 쓰면 안 된다.
 *
 * `ResizeObserver`는 관찰을 시작할 때 현재 크기로 한 번 호출되므로 초기값도 여기서 채워진다.
 */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() =>
      setSize((current) =>
        current.width === element.offsetWidth && current.height === element.offsetHeight
          ? current
          : { width: element.offsetWidth, height: element.offsetHeight },
      ),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, width: size.width, height: size.height };
}

/** 너비만 필요한 곳을 위한 축약형. */
export function useElementWidth<T extends HTMLElement>() {
  const { ref, width } = useElementSize<T>();
  return { ref, width };
}
