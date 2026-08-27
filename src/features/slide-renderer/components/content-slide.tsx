import { Logo } from "@/components/ui";
import type { PresentationTheme, Slide } from "@/types/domain";
import { HtmlFrame } from "./html-frame";
import { ImageFrame } from "./image-frame";
import styles from "./slide.module.css";
import { WebFrame } from "./web-frame";

export type ContentSlideProps = {
  slide: Slide;
  theme: PresentationTheme;
  /** 1부터 시작하는 표시용 페이지 번호. */
  pageNumber: number;
  interactive?: boolean;
  reloadToken?: string | number;
  mode?: "live" | "static";
  /** 웹페이지 영역을 원본 주소 링크로 만든다. PDF 전용이다. */
  linkToSource?: boolean;
  /** 잠긴 웹페이지 영역을 눌렀을 때 조작을 켜는 동작. */
  onActivateWebFrame?: () => void;
};

/**
 * 본문 템플릿. 제목 영역과 푸터 높이를 뺀 나머지에 16:9 콘텐츠 영역을 배치한다.
 *
 * 웹페이지, 이미지, HTML 슬라이드가 이 레이아웃을 그대로 함께 쓴다.
 * 가운데 16:9 영역에 무엇을 넣느냐만 다르다.
 */
export function ContentSlide({
  slide,
  theme,
  pageNumber,
  interactive,
  reloadToken,
  mode,
  linkToSource,
  onActivateWebFrame,
}: ContentSlideProps) {
  return (
    <div className={`${styles.surface} ${styles.content}`}>
      <div className={styles.contentTop}>
        <div className={styles.contentHeading}>
          {slide.pageName ? <p className={styles.pageName}>{slide.pageName}</p> : null}
          <h2 className={styles.contentTitle}>{slide.title}</h2>
          {slide.subtitle ? <p className={styles.contentSubtitle}>{slide.subtitle}</p> : null}
        </div>
        <Logo height={44} decorative />
      </div>

      <div className={styles.contentMain}>
        {slide.template === "image" ? (
          <ImageFrame image={slide.image} slideTitle={slide.title} />
        ) : slide.template === "html" ? (
          <HtmlFrame
            html={slide.html}
            slideTitle={slide.title}
            interactive={interactive}
            onActivate={onActivateWebFrame}
            mode={mode}
          />
        ) : (
          <WebFrame
            content={slide.content}
            slideTitle={slide.title}
            interactive={interactive}
            reloadToken={reloadToken}
            mode={mode}
            linkToSource={linkToSource}
            onActivate={onActivateWebFrame}
          />
        )}
      </div>

      <div className={styles.contentFooter}>
        <p>{theme.footerText}</p>
        {theme.showPageNumber ? <p className={styles.pageNumber}>{pageNumber}</p> : null}
      </div>
    </div>
  );
}
