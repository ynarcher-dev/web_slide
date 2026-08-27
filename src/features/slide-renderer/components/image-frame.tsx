import type { SlideImage } from "@/types/domain";
import { cn } from "@/lib/cn";
import styles from "./slide.module.css";

export type ImageFrameProps = {
  /** 이미지를 아직 올리지 않았으면 안내 문구만 보여준다. */
  image: SlideImage | null;
  /** 슬라이드 제목. 이미지 대체 텍스트에 사용한다. */
  slideTitle?: string;
};

/**
 * 이미지 슬라이드의 16:9 그림 영역.
 *
 * 웹페이지 영역과 같은 자리, 같은 크기를 쓴다. 다른 점은 iframe 대신 이미지를 넣고
 * 조작할 것이 없다는 점뿐이다. 그림은 잘리지 않게 프레임 안에 맞춘다.
 */
export function ImageFrame({ image, slideTitle }: ImageFrameProps) {
  if (!image) {
    return (
      <div className={cn(styles.frame, styles.framePlaceholder)}>
        <p>이미지가 아직 없습니다.</p>
        <p>속성 패널에서 이미지를 올리세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      {/* Storage 공개 주소를 그대로 쓴다. next/image 최적화는 PDF 브라우저에서 이점이 없다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={slideTitle ? `${slideTitle} 이미지` : "슬라이드 이미지"}
        className={styles.frameImage}
      />
    </div>
  );
}
