"use client";

import { useState } from "react";
import { Button, TextAreaField } from "@/components/ui";
import { SLIDE_HTML_MAX_LENGTH } from "../constants";

export type SlideHtmlFieldProps = {
  /** 저장된 HTML. 빈 문자열이면 아직 넣지 않은 상태다. */
  value: string;
  onCommit: (source: string) => void;
};

const PLACEHOLDER = `<div style="padding: 40px; font-size: 32px">
  붙여 넣은 HTML이 이 자리에 그대로 표시됩니다.
</div>`;

/**
 * HTML 슬라이드의 내용 입력.
 *
 * 글자 하나마다 iframe을 다시 그리면 편집 중 화면이 계속 깜빡인다.
 * 그래서 입력은 화면 안에만 두고, 포커스를 옮기거나 "미리보기에 적용"을 눌렀을 때 저장한다.
 */
export function SlideHtmlField({ value, onCommit }: SlideHtmlFieldProps) {
  const [draft, setDraft] = useState(value);
  const dirty = draft !== value;

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <div className="flex flex-col gap-2">
      <TextAreaField
        label="HTML"
        rows={12}
        monospace
        maxLength={SLIDE_HTML_MAX_LENGTH}
        placeholder={PLACEHOLDER}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        description="입력을 마치면 미리보기에 반영됩니다. 안전을 위해 격리된 화면에서 실행됩니다."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={!dirty} onClick={commit}>
          미리보기에 적용
        </Button>
        {dirty ? (
          <p className="text-xs text-foreground-muted">아직 반영하지 않은 변경이 있습니다.</p>
        ) : null}
      </div>
    </div>
  );
}
