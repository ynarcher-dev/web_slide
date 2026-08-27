"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PresentationTheme } from "@/types/domain";
import { useElementSize } from "../hooks/use-element-width";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "../constants";
import { slideThemeStyle } from "../slide-theme";
import styles from "./slide.module.css";

export type SlideStageProps = {
  theme: PresentationTheme;
  /** 화면 낭독기가 읽을 슬라이드 설명. */
  label?: string;
  /**
   * 16:9를 지키는 대신 바깥 상자를 가로세로 모두 100%로 채운다.
   * 전체화면 발표처럼 화면에 여백을 남기지 않아야 할 때만 사용한다.
   */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * 16:9 슬라이드 스케일링 컨테이너.
 *
 * 안쪽은 항상 1920×1080 좌표계로 그리고, 바깥 크기에 맞춰 통째로 축소한다.
 * 덕분에 편집 미리보기, 썸네일, 발표 화면이 같은 렌더러를 그대로 재사용한다.
 *
 * `fill`이면 가로세로 배율을 따로 계산해 상자를 빈틈없이 채운다. 화면 비율이 16:9가 아니면
 * 슬라이드가 그만큼 늘어나지만, 전체화면에서 검은 여백을 남기지 않는 쪽을 택한 결과다.
 */
export function SlideStage({ theme, label, fill, className, style, children }: SlideStageProps) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  // 크기를 재기 전에는 0이다. 잘못된 배율로 한 프레임 그려지는 것보다 낫다.
  const scaleX = width > 0 ? width / SLIDE_WIDTH : 0;
  const scaleY = fill ? (height > 0 ? height / SLIDE_HEIGHT : 0) : scaleX;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={cn(styles.stage, fill && styles.stageFill, className)}
      style={{ ...slideThemeStyle(theme), ...style }}
    >
      <div className={styles.canvas} style={{ transform: `scale(${scaleX}, ${scaleY})` }}>
        {children}
      </div>
    </div>
  );
}
