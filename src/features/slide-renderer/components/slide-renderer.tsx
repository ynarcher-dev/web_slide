import type { PresentationTheme, Slide } from "@/types/domain";
import { ContentSlide } from "./content-slide";
import { CoverSlide } from "./cover-slide";

export type SlideRenderMode = "live" | "static";

export type SlideRendererProps = {
  slide: Slide;
  theme: PresentationTheme;
  /** 1부터 시작하는 표시용 페이지 번호. */
  pageNumber: number;
  /** 본문 웹페이지를 조작할 수 있는지 여부. */
  interactive?: boolean;
  /** 값이 바뀌면 웹페이지를 다시 불러온다. */
  reloadToken?: string | number;
  /** `static`이면 웹페이지를 iframe으로 띄우지 않는다. */
  mode?: SlideRenderMode;
  /** 웹페이지 영역을 원본 주소 링크로 만든다. PDF 전용이다. */
  linkToSource?: boolean;
  /** 잠긴 웹페이지 영역을 눌렀을 때 조작을 켜는 동작. */
  onActivateWebFrame?: () => void;
};

/**
 * 템플릿별 시각 렌더러를 고르는 단일 진입점.
 * 편집 미리보기, 썸네일, 발표 화면, PDF가 모두 이 컴포넌트를 통해 슬라이드를 그린다.
 */
export function SlideRenderer({
  slide,
  theme,
  pageNumber,
  interactive,
  reloadToken,
  mode,
  linkToSource,
  onActivateWebFrame,
}: SlideRendererProps) {
  if (slide.template === "cover") return <CoverSlide slide={slide} />;

  return (
    <ContentSlide
      slide={slide}
      theme={theme}
      pageNumber={pageNumber}
      interactive={interactive}
      reloadToken={reloadToken}
      mode={mode}
      linkToSource={linkToSource}
      onActivateWebFrame={onActivateWebFrame}
    />
  );
}
