"use client";

import { SlideView } from "@/features/slide-renderer";
import type { Presentation, Slide } from "@/types/domain";
import { useMounted } from "@/lib/use-mounted";
import { PDF_FRAMES_ATTRIBUTE, PDF_READY_ATTRIBUTE } from "../constants";
import { usePdfReady } from "../hooks/use-pdf-ready";
import styles from "./pdf.module.css";

export type PdfDocumentProps = {
  presentation: Presentation;
  slides: Slide[];
};

/**
 * PDF로 인쇄할 화면.
 *
 * 슬라이드를 저장된 순서대로 한 페이지에 한 장씩 쌓는다.
 * 편집과 발표가 쓰는 렌더러를 그대로 사용하므로 화면과 같은 결과가 나온다.
 * 웹페이지는 조작할 수 없는 정적 화면이 되어야 하므로 상호작용을 켜지 않는다.
 *
 * 슬라이드는 하이드레이션이 끝난 뒤에 만든다. 서버 HTML에 iframe이 들어 있으면
 * 로딩 완료 이벤트를 놓쳐, 다 불러온 웹페이지를 계속 기다리게 되기 때문이다.
 */
export function PdfDocument({ presentation, slides }: PdfDocumentProps) {
  const mounted = useMounted();
  const { ready, frames } = usePdfReady(mounted);

  return (
    <div
      className={styles.document}
      {...{
        [PDF_READY_ATTRIBUTE]: ready ? "true" : "false",
        [PDF_FRAMES_ATTRIBUTE]: frames,
      }}
    >
      {mounted
        ? slides.map((slide, index) => (
            <div key={slide.id} className={styles.page}>
              <SlideView
                slide={slide}
                theme={presentation.theme}
                pageNumber={index + 1}
                interactive={false}
                mode="live"
                linkToSource
              />
            </div>
          ))
        : null}
    </div>
  );
}
