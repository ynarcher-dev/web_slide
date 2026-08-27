"use client";

import { useEffect, useState } from "react";
import { PDF_FRAME_TIMEOUT_MS, PDF_SETTLE_MS, type PdfFramesState } from "../constants";

/**
 * PDF 화면이 인쇄해도 되는 상태인지 알린다.
 *
 * 서버 브라우저는 이 결과가 DOM에 반영된 뒤에 인쇄한다. 기다리는 것은 세 가지다.
 * - 본문 슬라이드의 iframe 로딩. 끝나지 않으면 흰 상자만 찍힌다.
 * - 이미지 슬라이드의 그림 로딩. 끝나지 않으면 빈 자리만 찍힌다.
 * - 웹폰트 적용. 늦게 적용되면 줄바꿈과 자간이 화면과 달라진다.
 *
 * 제한 시간을 넘기면 기다리기를 멈추고 `timeout`으로 알린다.
 * 그래야 생성기가 반쯤 빈 PDF를 내려주지 않고 실패로 처리할 수 있다.
 *
 * @param enabled iframe이 화면에 만들어진 뒤에 true가 되어야 한다. 그전에는 기다릴 대상이 없다.
 */
export function usePdfReady(enabled: boolean): { ready: boolean; frames: PdfFramesState } {
  const [state, setState] = useState<{ ready: boolean; frames: PdfFramesState }>({
    ready: false,
    frames: "pending",
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const frames = Array.from(document.querySelectorAll("iframe"));
    // 아직 다 받지 못한 이미지만 센다. 캐시에서 바로 온 그림은 load 이벤트가 오지 않는다.
    const images = Array.from(document.querySelectorAll("img")).filter((image) => !image.complete);
    let remaining = frames.length + images.length;

    const finish = (result: PdfFramesState) => {
      if (finished) return;
      finished = true;

      // 폰트 API가 없는 환경에서도 멈추지 않게 한다.
      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      void fontsReady.then(() => {
        settleTimer = setTimeout(() => {
          if (!cancelled) setState({ ready: true, frames: result });
        }, PDF_SETTLE_MS);
      });
    };

    const handleFrameSettled = () => {
      remaining -= 1;
      if (remaining <= 0) finish("loaded");
    };

    for (const element of [...frames, ...images]) {
      // 주소가 잘못돼 실패로 끝나도 더 기다릴 이유는 없다. error도 완료로 본다.
      element.addEventListener("load", handleFrameSettled, { once: true });
      element.addEventListener("error", handleFrameSettled, { once: true });
    }

    if (remaining === 0) finish("loaded");
    const frameTimeout = setTimeout(() => finish("timeout"), PDF_FRAME_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(frameTimeout);
      clearTimeout(settleTimer);
      for (const element of [...frames, ...images]) {
        element.removeEventListener("load", handleFrameSettled);
        element.removeEventListener("error", handleFrameSettled);
      }
    };
  }, [enabled]);

  return state;
}
