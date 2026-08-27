import { Logo } from "@/components/ui";
import type { Slide } from "@/types/domain";
import styles from "./slide.module.css";

/**
 * 표지 템플릿. 배경 이미지는 없고 흰색 기반 tint 배경만 사용한다.
 */
export function CoverSlide({ slide }: { slide: Slide }) {
  return (
    <div className={`${styles.surface} ${styles.cover}`}>
      <div className={styles.coverTop}>
        <Logo height={52} />
      </div>

      <div className={styles.coverBody}>
        <div className={styles.coverAccent} aria-hidden="true" />
        <h1 className={styles.coverTitle}>{slide.title}</h1>
        {slide.subtitle ? <p className={styles.coverSubtitle}>{slide.subtitle}</p> : null}
      </div>

      <div className={styles.coverBottom}>
        <p className={styles.coverAuthor}>{slide.author}</p>
      </div>
    </div>
  );
}
