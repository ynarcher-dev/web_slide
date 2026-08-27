"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import type { WebPageContent } from "@/types/domain";
import { useElementWidth } from "../hooks/use-element-width";
import styles from "./slide.module.css";

export type WebFrameProps = {
  /** URL이 아직 없으면 안내 문구만 보여준다. */
  content: WebPageContent | null;
  /** 슬라이드 제목. iframe 접근성 이름에 사용한다. */
  slideTitle?: string;
  /** false면 덮개를 씌워 iframe 안쪽 조작을 막는다. */
  interactive?: boolean;
  /**
   * 잠긴 웹페이지 영역을 눌렀을 때 조작을 켜는 동작.
   * 넘기지 않으면 덮개는 클릭을 막기만 한다.
   */
  onActivate?: () => void;
  /** 값이 바뀌면 iframe을 다시 마운트해 새로고침한다. */
  reloadToken?: string | number;
  /** `static`이면 iframe을 만들지 않는다. 썸네일처럼 여러 장을 한 번에 그릴 때 사용한다. */
  mode?: "live" | "static";
};

/** 정적 표시에 쓸 짧은 주소. 파싱할 수 없으면 원본을 그대로 보여준다. */
function shortLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * 실제 iframe을 띄우는 부분.
 *
 * 주소나 새로고침 요청이 바뀌면 부모가 key를 바꿔 이 컴포넌트를 다시 마운트한다.
 * 그래서 로딩 상태를 effect로 되돌릴 필요가 없다.
 *
 * iframe은 하이드레이션이 끝난 뒤에 만든다. 서버 HTML에 들어 있으면 하이드레이션 전에
 * 로딩이 끝나 `load` 이벤트를 아무도 받지 못하고, 다 불러온 웹페이지 위에 로딩 문구가 남는다.
 */
function LiveFrame({
  content,
  slideTitle,
  interactive,
  onActivate,
}: {
  content: WebPageContent;
  slideTitle?: string;
  interactive: boolean;
  onActivate?: () => void;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const mounted = useMounted();
  const [loaded, setLoaded] = useState(false);
  const scale = width > 0 ? width / content.viewport.width : 0;

  return (
    <div ref={ref} className={styles.frame} data-interactive={interactive ? "true" : "false"}>
      {mounted ? (
        <iframe
          src={content.url}
          title={slideTitle ? `${slideTitle} 웹페이지` : "슬라이드 웹페이지"}
          onLoad={() => setLoaded(true)}
          referrerPolicy="no-referrer-when-downgrade"
          className={styles.frameViewport}
          style={{
            width: content.viewport.width,
            height: content.viewport.height,
            transform: `scale(${scale})`,
          }}
        />
      ) : null}

      {interactive ? null : onActivate ? (
        // 덮개를 눌러 조작을 켠다. 클릭이 바깥으로 퍼지면 켜자마자 다시 꺼지므로 여기서 멈춘다.
        // 슬라이드는 role="img"이라 안쪽에 포커스 가능한 요소를 두지 않는다. 키보드는 바깥 버튼을 쓴다.
        <div
          className={cn(styles.frameOverlay, styles.frameActivator)}
          aria-hidden="true"
          data-testid="web-frame-lock"
          onClick={(event) => {
            event.stopPropagation();
            onActivate();
          }}
        />
      ) : (
        // 조작을 켤 수 없는 곳에서는 클릭이 iframe으로 새어 들어가지 않게 막기만 한다.
        <div className={styles.frameOverlay} aria-hidden="true" data-testid="web-frame-lock" />
      )}

      {mounted && loaded ? null : (
        <div className={styles.frameStatus} role="status">
          웹페이지를 불러오는 중입니다.
        </div>
      )}
    </div>
  );
}

/**
 * 본문 슬라이드의 16:9 웹페이지 영역.
 *
 * iframe은 항상 기준 뷰포트(기본 1920×1080)로 그린 뒤 프레임 폭에 맞춰 축소한다.
 * 그래서 슬라이드 표시 크기가 달라져도 웹페이지 안의 레이아웃은 그대로 유지된다.
 */
export function WebFrame({
  content,
  slideTitle,
  interactive = false,
  reloadToken,
  mode = "live",
  onActivate,
}: WebFrameProps) {
  if (!content) {
    return (
      <div className={cn(styles.frame, styles.framePlaceholder)}>
        <p>웹페이지 URL이 아직 없습니다.</p>
        <p>속성 패널에서 https 주소를 입력하세요.</p>
      </div>
    );
  }

  if (mode === "static") {
    return (
      <div className={cn(styles.frame, styles.framePlaceholder)}>
        <p>{shortLabel(content.url)}</p>
      </div>
    );
  }

  return (
    <LiveFrame
      key={`${content.url}:${reloadToken ?? ""}`}
      content={content}
      slideTitle={slideTitle}
      interactive={interactive}
      onActivate={onActivate}
    />
  );
}
