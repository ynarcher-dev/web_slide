"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { SlideView, slideContentKindLabel } from "@/features/slide-renderer";
import type { Presentation, Slide } from "@/types/domain";
import { useControlsReveal } from "../hooks/use-controls-reveal";
import { useFullscreen } from "../hooks/use-fullscreen";
import { usePlayerKeyboard } from "../hooks/use-player-keyboard";
import { usePlayerNavigation } from "../hooks/use-player-navigation";
import styles from "./player.module.css";
import { PresentationControls } from "./presentation-controls";

/** 발표를 시작하고 컨트롤이 스스로 접힐 때까지 기다리는 시간. */
const CONTROLS_HIDE_DELAY_MS = 2600;
/** 이 높이 안으로 포인터가 들어오면 상단 컨트롤이 내려온다. */
const CONTROLS_REVEAL_ZONE_PX = 120;
/** 현재 슬라이드 기준으로 웹페이지를 미리 띄워 둘 범위. */
const LIVE_WINDOW = 1;

/** 조작할 것이 있는 슬라이드인지 확인한다. 웹페이지와 HTML 슬라이드가 해당한다. */
function hasInteractiveContent(slide: Slide | undefined): boolean {
  if (!slide) return false;
  return slide.template === "html" ? slide.html !== null : slide.content !== null;
}

export type SlidePlayerProps = {
  presentation: Presentation;
  slides: Slide[];
  /** 발표를 끝내고 돌아갈 경로. 읽기 전용 공유 화면에서는 넘기지 않는다. */
  exitHref?: string;
};

/**
 * 전체화면 발표 화면.
 *
 * 슬라이드는 모두 DOM에 두고 현재 것만 보여 준다. 이동할 때마다 iframe을 다시 만들면
 * 시연 중이던 웹페이지 상태가 사라지기 때문이다. 새로고침은 슬라이드 설정을 따른다.
 *
 * 웹페이지 조작은 화면을 눌러 전환한다. 잠긴 웹페이지 영역을 누르면 켜지고, 그 바깥(제목, 여백,
 * 검은 배경)을 누르면 꺼진다. 조작 중에는 클릭이 iframe 안으로 들어가므로 끄는 자리는 바깥뿐이다.
 *
 * 편집 화면과 공유 화면이 같은 컴포넌트를 쓴다. 편집으로 이어지는 UI는 `exitHref`가 있을 때만
 * 나타나므로, 공유 화면에서는 이 값을 넘기지 않는 것만으로 읽기 전용이 된다.
 */
export function SlidePlayer({ presentation, slides, exitHref }: SlidePlayerProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [interactive, setInteractive] = useState(false);
  const [reloadTokens, setReloadTokens] = useState<Record<string, number>>({});

  const { index, goTo, isFirst, isLast } = usePlayerNavigation(slides.length);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(container);
  const controlsVisible = useControlsReveal({
    topZonePx: CONTROLS_REVEAL_ZONE_PX,
    hideDelayMs: CONTROLS_HIDE_DELAY_MS,
  });

  const currentSlide = slides[index];

  const navigate = useCallback(
    (nextIndex: number) => {
      const target = slides[Math.min(Math.max(nextIndex, 0), slides.length - 1)];

      // 슬라이드를 옮기면 다시 슬라이드 이동 모드로 돌아온다.
      setInteractive(false);
      if (target?.content?.reloadOnEnter) {
        setReloadTokens((tokens) => ({ ...tokens, [target.id]: (tokens[target.id] ?? 0) + 1 }));
      }
      goTo(nextIndex);
    },
    [goTo, slides],
  );

  const goNext = useCallback(() => navigate(index + 1), [index, navigate]);
  const goPrevious = useCallback(() => navigate(index - 1), [index, navigate]);
  const goFirst = useCallback(() => navigate(0), [navigate]);
  const goLast = useCallback(() => navigate(slides.length - 1), [navigate, slides.length]);

  const handleEscape = useCallback(() => {
    // 웹페이지 조작 중이라면 먼저 슬라이드 이동으로 돌아온다.
    setInteractive(false);
    container?.focus();
  }, [container]);

  usePlayerKeyboard({
    onNext: goNext,
    onPrevious: goPrevious,
    onFirst: goFirst,
    onLast: goLast,
    onEscape: handleEscape,
    onToggleFullscreen: toggleFullscreen,
  });

  return (
    <div
      ref={setContainer}
      tabIndex={-1}
      className={styles.player}
      data-fullscreen={isFullscreen ? "true" : "false"}
      aria-label={`${presentation.title} 발표`}
    >
      {/* 웹페이지 바깥을 누르면 슬라이드 이동 모드로 돌아온다. 키보드는 ESC가 같은 일을 한다. */}
      <div className={styles.viewport} onClick={() => setInteractive(false)}>
        <div className={styles.slideBox}>
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index;
            const distance = Math.abs(slideIndex - index);

            return (
              <motion.div
                key={slide.id}
                className={styles.layer}
                data-active={active ? "true" : "false"}
                inert={!active}
                initial={false}
                animate={{ opacity: active ? 1 : 0, x: active ? 0 : slideIndex < index ? -48 : 48 }}
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                style={{ zIndex: active ? 1 : 0 }}
              >
                <SlideView
                  slide={slide}
                  theme={presentation.theme}
                  pageNumber={slideIndex + 1}
                  interactive={active && interactive}
                  reloadToken={reloadTokens[slide.id] ?? 0}
                  onActivateWebFrame={active ? () => setInteractive(true) : undefined}
                  mode={distance <= LIVE_WINDOW ? "live" : "static"}
                  fill={isFullscreen}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <PresentationControls
        currentPage={index + 1}
        totalPages={slides.length}
        isFirst={isFirst}
        isLast={isLast}
        visible={controlsVisible}
        interactive={interactive}
        isFullscreen={isFullscreen}
        hasWebContent={hasInteractiveContent(currentSlide)}
        contentKind={slideContentKindLabel(currentSlide?.template ?? "content")}
        exitHref={exitHref}
        onPrevious={goPrevious}
        onNext={goNext}
        onToggleInteractive={() => setInteractive((current) => !current)}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
