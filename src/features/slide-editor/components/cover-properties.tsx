"use client";

import { useId } from "react";
import { TextField } from "@/components/ui";
import type { Slide, SlideFields } from "@/types/domain";
import {
  SLIDE_AUTHOR_MAX_LENGTH,
  SLIDE_SUBTITLE_MAX_LENGTH,
  SLIDE_TITLE_MAX_LENGTH,
} from "../constants";

export type CoverPropertiesProps = {
  slide: Slide;
  /** 표지 tint는 프레젠테이션 공통 설정이라 슬라이드가 아니라 테마에서 온다. */
  coverTint: number;
  onFieldChange: (patch: Partial<SlideFields>) => void;
  onCoverTintChange: (coverTint: number) => void;
};

/** 표지 템플릿의 입력 필드. */
export function CoverProperties({
  slide,
  coverTint,
  onFieldChange,
  onCoverTintChange,
}: CoverPropertiesProps) {
  const tintId = useId();

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="제목"
        maxLength={SLIDE_TITLE_MAX_LENGTH}
        value={slide.title}
        onChange={(event) => onFieldChange({ title: event.target.value })}
      />

      <TextField
        label="소제목"
        maxLength={SLIDE_SUBTITLE_MAX_LENGTH}
        value={slide.subtitle}
        onChange={(event) => onFieldChange({ subtitle: event.target.value })}
      />

      <TextField
        label="발표자 이름"
        maxLength={SLIDE_AUTHOR_MAX_LENGTH}
        value={slide.author}
        onChange={(event) => onFieldChange({ author: event.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={tintId} className="text-sm font-medium text-foreground">
          표지 배경 tint
        </label>
        <div className="flex items-center gap-3">
          <input
            id={tintId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={coverTint}
            onChange={(event) => onCoverTintChange(Number(event.target.value))}
            className="h-2 flex-1 accent-brand-500"
          />
          <span className="w-8 text-right text-sm tabular-nums text-foreground-muted">
            {coverTint}
          </span>
        </div>
        <p className="text-xs text-foreground-muted">
          모든 표지에 함께 적용되는 공통 설정입니다. 0은 흰색입니다.
        </p>
      </div>
    </div>
  );
}
