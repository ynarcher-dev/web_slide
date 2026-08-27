"use client";

import { EmptyState } from "@/components/ui";
import { slideTemplateLabel } from "@/features/slide-renderer";
import type { Slide, SlideFields } from "@/types/domain";
import { ContentProperties } from "./content-properties";
import { CoverProperties } from "./cover-properties";

export type SlidePropertiesPanelProps = {
  slide: Slide | null;
  coverTint: number;
  onFieldChange: (patch: Partial<SlideFields>) => void;
  onCoverTintChange: (coverTint: number) => void;
};

/**
 * 선택한 슬라이드의 속성 패널.
 * 템플릿에 따라 표시할 입력 필드가 다르므로 여기서 갈라 준다.
 */
export function SlidePropertiesPanel({
  slide,
  coverTint,
  onFieldChange,
  onCoverTintChange,
}: SlidePropertiesPanelProps) {
  if (!slide) {
    return (
      <EmptyState
        title="선택한 슬라이드가 없습니다."
        description="목록에서 슬라이드를 선택하면 편집할 수 있습니다."
        className="m-3"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold text-foreground">
        {slideTemplateLabel(slide.template)} 슬라이드
      </h2>

      {slide.template === "cover" ? (
        <CoverProperties
          key={slide.id}
          slide={slide}
          coverTint={coverTint}
          onFieldChange={onFieldChange}
          onCoverTintChange={onCoverTintChange}
        />
      ) : (
        <ContentProperties key={slide.id} slide={slide} onFieldChange={onFieldChange} />
      )}
    </div>
  );
}
