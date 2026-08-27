"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import styles from "./player.module.css";

export type PresentationControlsProps = {
  currentPage: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  visible: boolean;
  interactive: boolean;
  isFullscreen: boolean;
  /** 현재 슬라이드에 조작할 콘텐츠가 있는지 여부. */
  hasWebContent: boolean;
  /** 조작 대상의 이름. 슬라이드 유형에 따라 "웹페이지" 또는 "HTML"이다. */
  contentKind: string;
  /** 발표를 끝내고 돌아갈 경로. 공유 화면처럼 돌아갈 곳이 없으면 넘기지 않는다. */
  exitHref?: string;
  onPrevious: () => void;
  onNext: () => void;
  onToggleInteractive: () => void;
  onToggleFullscreen: () => void;
};

/**
 * iframe 바깥에 있는 발표 컨트롤.
 *
 * 화면을 눌러서도 전환할 수 있지만, 키보드 사용자를 위해 버튼도 함께 둔다.
 * 웹페이지를 조작하는 동안에는 키보드 입력이 iframe으로 넘어간다. 이때 돌아오는 길은
 * 마우스를 화면 위로 올려 이 컨트롤을 부르거나, 웹페이지 바깥을 누르거나, ESC를 쓰는 것이다.
 */
export function PresentationControls({
  currentPage,
  totalPages,
  isFirst,
  isLast,
  visible,
  interactive,
  isFullscreen,
  hasWebContent,
  contentKind,
  exitHref,
  onPrevious,
  onNext,
  onToggleInteractive,
  onToggleFullscreen,
}: PresentationControlsProps) {
  return (
    <div className={styles.controlsLayer} data-visible={visible ? "true" : "false"}>
      <div className={styles.controls} role="group" aria-label="발표 컨트롤">
        <Button size="sm" variant="secondary" disabled={isFirst} onClick={onPrevious}>
          이전
        </Button>
        <p className={styles.pageIndicator} aria-live="polite">
          <span className="sr-only">현재 페이지 </span>
          {currentPage} / {totalPages}
        </p>
        <Button size="sm" variant="secondary" disabled={isLast} onClick={onNext}>
          다음
        </Button>

        {hasWebContent ? (
          <Button
            size="sm"
            variant={interactive ? "primary" : "secondary"}
            aria-pressed={interactive}
            onClick={onToggleInteractive}
          >
            {interactive ? "슬라이드 이동으로 돌아가기" : `${contentKind} 조작`}
          </Button>
        ) : null}

        <Button size="sm" variant="secondary" onClick={onToggleFullscreen}>
          {isFullscreen ? "전체화면 끝내기" : "전체화면"}
        </Button>

        {exitHref ? (
          <Link
            href={exitHref}
            className="rounded-control px-2 py-1 text-sm text-white/80 hover:text-white"
          >
            발표 종료
          </Link>
        ) : null}

        {interactive ? (
          <p className={styles.hint}>
            {contentKind}를 조작하는 중입니다. {contentKind} 바깥을 누르거나 ESC로 돌아옵니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
