"use client";

import type { CSSProperties } from "react";
import type { PresentationTheme, Slide } from "@/types/domain";
import { slideAriaLabel } from "../slide-summary";
import { SlideRenderer, type SlideRenderMode } from "./slide-renderer";
import { SlideStage } from "./slide-stage";

export type SlideViewProps = {
  slide: Slide;
  theme: PresentationTheme;
  /** 1부터 시작하는 표시용 페이지 번호. */
  pageNumber: number;
  interactive?: boolean;
  reloadToken?: string | number;
  mode?: SlideRenderMode;
  /** 웹페이지 영역을 원본 주소 링크로 만든다. PDF 전용이다. */
  linkToSource?: boolean;
  /** 잠긴 웹페이지 영역을 눌렀을 때 조작을 켜는 동작. */
  onActivateWebFrame?: () => void;
  /** 16:9 대신 바깥 상자를 가로세로 모두 채운다. 전체화면 발표에서 사용한다. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * 16:9 스케일 컨테이너와 템플릿 렌더러를 묶은 기본 표시 단위.
 * 슬라이드를 화면에 그릴 때는 이 컴포넌트를 사용한다.
 */
export function SlideView({
  slide,
  theme,
  pageNumber,
  interactive,
  reloadToken,
  mode,
  linkToSource,
  onActivateWebFrame,
  fill,
  className,
  style,
}: SlideViewProps) {
  return (
    <SlideStage
      theme={theme}
      label={slideAriaLabel(slide, pageNumber)}
      fill={fill}
      className={className}
      style={style}
    >
      <SlideRenderer
        slide={slide}
        theme={theme}
        pageNumber={pageNumber}
        interactive={interactive}
        reloadToken={reloadToken}
        mode={mode}
        linkToSource={linkToSource}
        onActivateWebFrame={onActivateWebFrame}
      />
    </SlideStage>
  );
}
