"use client";

import { CheckboxField, TextField } from "@/components/ui";
import type { Slide, SlideFields } from "@/types/domain";
import {
  SLIDE_PAGE_NAME_MAX_LENGTH,
  SLIDE_SUBTITLE_MAX_LENGTH,
  SLIDE_TITLE_MAX_LENGTH,
} from "../constants";
import { SlideHtmlField } from "./slide-html-field";
import { SlideImageField } from "./slide-image-field";
import { SlideUrlField } from "./slide-url-field";

export type ContentPropertiesProps = {
  slide: Slide;
  onFieldChange: (patch: Partial<SlideFields>) => void;
};

/**
 * 본문 템플릿의 입력 필드와 콘텐츠 설정.
 *
 * 글 영역은 웹페이지, 이미지, HTML 슬라이드가 똑같다. 아래 콘텐츠 부분만 갈린다.
 */
export function ContentProperties({ slide, onFieldChange }: ContentPropertiesProps) {
  const hasUrl = slide.content !== null;
  const isImage = slide.template === "image";
  const isHtml = slide.template === "html";

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="페이지명"
        maxLength={SLIDE_PAGE_NAME_MAX_LENGTH}
        placeholder="PRODUCT DEMO"
        value={slide.pageName}
        onChange={(event) => onFieldChange({ pageName: event.target.value })}
        description="슬라이드 위쪽에 작게 표시하는 섹션명입니다."
      />

      <TextField
        label="대제목"
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

      <hr className="border-border-subtle" />

      {isImage ? (
        <SlideImageField
          presentationId={slide.presentationId}
          image={slide.image}
          onCommit={(imagePath) => onFieldChange({ imagePath })}
        />
      ) : isHtml ? (
        <SlideHtmlField
          value={slide.html?.source ?? ""}
          onCommit={(htmlSource) => onFieldChange({ htmlSource })}
        />
      ) : (
        <>
          <SlideUrlField
            value={slide.content?.url ?? ""}
            onCommit={(url) => onFieldChange({ contentUrl: url })}
          />

          <CheckboxField
            label="슬라이드 진입 시 새로고침"
            checked={slide.content?.reloadOnEnter ?? false}
            disabled={!hasUrl}
            onChange={(event) => onFieldChange({ reloadOnEnter: event.target.checked })}
            description="발표 중 이 슬라이드로 이동할 때마다 웹페이지를 다시 불러옵니다."
          />
        </>
      )}
    </div>
  );
}
