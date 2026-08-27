"use client";

import { useSyncExternalStore } from "react";

/** 구독할 외부 상태가 없다. 서버와 클라이언트의 값 차이만 이용한다. */
const subscribeToNothing = () => () => {};

/**
 * 하이드레이션이 끝났는지 알린다.
 *
 * 서버 HTML에 iframe이 들어 있으면 하이드레이션 전에 로딩이 끝날 수 있고,
 * 그러면 React가 로딩 완료 이벤트를 아무도 받지 못한다. 그래서 iframe은 이 값이
 * true가 된 뒤에 만든다. 편집, 발표, PDF 화면이 모두 같은 규칙을 따른다.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
