"use client";

import { useState } from "react";
import { Button, EmptyState } from "@/components/ui";
import { SlideView, slideContentKindLabel } from "@/features/slide-renderer";
import type { PresentationTheme, Slide } from "@/types/domain";

export type SlidePreviewProps = {
  slide: Slide | null;
  theme: PresentationTheme;
  /** 1부터 시작하는 표시용 페이지 번호. */
  pageNumber: number;
};

/**
 * 편집 화면 가운데의 16:9 미리보기.
 *
 * 기본은 조작 잠금 상태다. 클릭이 iframe으로 새어 들어가면 슬라이드를 선택하거나
 * 편집기로 포커스를 되돌리기 어려워지기 때문이다. 필요할 때만 조작을 켠다.
 *
 * 켜고 끄는 방법은 발표 화면과 같다. 웹페이지 영역을 누르면 켜지고 그 바깥을 누르면 꺼진다.
 * 버튼은 키보드 사용자를 위해 남겨 둔다.
 */
export function SlidePreview({ slide, theme, pageNumber }: SlidePreviewProps) {
  // 조작을 허용한 슬라이드를 기억한다. 다른 슬라이드로 옮기면 자동으로 잠금 상태가 된다.
  const [interactiveSlideId, setInteractiveSlideId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const interactive = slide !== null && interactiveSlideId === slide.id;

  if (!slide) {
    return (
      <EmptyState
        title="표시할 슬라이드가 없습니다."
        description="왼쪽 목록에서 슬라이드를 만들거나 선택하세요."
        className="w-full max-w-2xl bg-surface"
      />
    );
  }

  const hasWebContent =
    (slide.template === "content" && slide.content !== null) ||
    (slide.template === "html" && slide.html !== null);
  const contentKind = slideContentKindLabel(slide.template);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3">
      {/* 웹페이지 바깥을 누르면 다시 잠근다. 조작 중에는 클릭이 iframe으로 들어가므로 여기까지 오지 않는다. */}
      <div onClick={() => setInteractiveSlideId(null)}>
        <SlideView
          slide={slide}
          theme={theme}
          pageNumber={pageNumber}
          interactive={interactive}
          reloadToken={reloadToken}
          onActivateWebFrame={() => setInteractiveSlideId(slide.id)}
          className="rounded-panel border border-border-subtle shadow-sm"
        />
      </div>

      {hasWebContent ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={interactive ? "primary" : "secondary"}
            aria-pressed={interactive}
            onClick={() => setInteractiveSlideId(interactive ? null : slide.id)}
          >
            {interactive ? `${contentKind} 조작 끄기` : `${contentKind} 조작 켜기`}
          </Button>
          {slide.template === "content" ? (
            <Button size="sm" variant="ghost" onClick={() => setReloadToken((token) => token + 1)}>
              웹페이지 새로고침
            </Button>
          ) : null}
          <p className="text-xs text-foreground-muted">
            {contentKind} 영역을 눌러도 켜지고, 그 바깥을 누르면 다시 잠깁니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
