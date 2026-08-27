"use client";

import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import type { SlideHtml } from "@/types/domain";
import { toHtmlSlideDocument } from "../html-document";
import styles from "./slide.module.css";

export type HtmlFrameProps = {
  /** HTML을 아직 넣지 않았으면 안내 문구만 보여준다. */
  html: SlideHtml | null;
  /** 슬라이드 제목. iframe 접근성 이름에 사용한다. */
  slideTitle?: string;
  /** false면 덮개를 씌워 안쪽 조작을 막는다. */
  interactive?: boolean;
  /** 잠긴 영역을 눌렀을 때 조작을 켜는 동작. */
  onActivate?: () => void;
  /** `static`이면 iframe을 만들지 않는다. 썸네일처럼 여러 장을 한 번에 그릴 때 사용한다. */
  mode?: "live" | "static";
};

/**
 * 붙여 넣은 HTML을 보여 주는 16:9 영역.
 *
 * 웹페이지 영역과 같은 자리, 같은 크기, 같은 조작 규칙을 쓴다. 다른 점은 주소 대신
 * HTML 원본을 `srcdoc`으로 넣는다는 것뿐이다.
 *
 * iframe은 `allow-same-origin` 없이 샌드박스로 띄운다. 그래서 안에서 스크립트가 돌아도
 * 우리 쪽 쿠키, 저장소, DOM에는 닿지 못한다. 스크립트 자체는 차트나 애니메이션 같은
 * 자료를 그대로 붙여 넣을 수 있도록 허용한다.
 *
 * 내용은 1920×1080 기준으로 그린 뒤 표시 크기에 맞춰 축소한다. 웹페이지 영역과 같은 규칙이라
 * 슬라이드 크기가 달라져도 안쪽 배치가 흔들리지 않는다.
 */
export function HtmlFrame({
  html,
  slideTitle,
  interactive = false,
  onActivate,
  mode,
}: HtmlFrameProps) {
  const mounted = useMounted();

  if (!html) {
    return (
      <div className={cn(styles.frame, styles.framePlaceholder)}>
        <p>HTML이 아직 없습니다.</p>
        <p>속성 패널에 HTML을 붙여 넣으세요.</p>
      </div>
    );
  }

  if (mode === "static") {
    return (
      <div className={cn(styles.frame, styles.framePlaceholder)}>
        <p>HTML 슬라이드</p>
      </div>
    );
  }

  return (
    <div className={styles.frame} data-interactive={interactive ? "true" : "false"}>
      {/* 하이드레이션 이후에 만든다. 웹페이지 영역과 같은 이유다. */}
      {mounted ? (
        <iframe
          srcDoc={toHtmlSlideDocument(html.source)}
          title={slideTitle ? `${slideTitle} HTML` : "슬라이드 HTML"}
          sandbox="allow-scripts"
          className={styles.frameHtml}
          data-testid="html-frame"
        />
      ) : null}

      {interactive ? null : onActivate ? (
        <div
          className={cn(styles.frameOverlay, styles.frameActivator)}
          aria-hidden="true"
          data-testid="html-frame-lock"
          onClick={(event) => {
            event.stopPropagation();
            onActivate();
          }}
        />
      ) : (
        <div className={styles.frameOverlay} aria-hidden="true" data-testid="html-frame-lock" />
      )}
    </div>
  );
}
