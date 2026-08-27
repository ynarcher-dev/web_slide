"use client";

import { useState } from "react";
import { TextField } from "@/components/ui";
import { isHttpsUrl, normalizeUrlInput } from "@/lib/validation/url";
import { SLIDE_CONTENT_URL_MAX_LENGTH } from "../constants";

export type SlideUrlFieldProps = {
  /** 저장된 URL. 빈 문자열이면 아직 지정하지 않은 상태다. */
  value: string;
  onCommit: (url: string) => void;
};

/**
 * 본문 웹페이지 주소 입력.
 *
 * 잘못된 주소를 저장하지 않도록 입력 중에는 화면 안에만 두고, 검증을 통과했을 때만 저장한다.
 * 스킴을 생략하면 https를 붙여 준다.
 */
export function SlideUrlField({ value, onCommit }: SlideUrlFieldProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | undefined>(undefined);

  const commit = (raw: string) => {
    const normalized = normalizeUrlInput(raw);

    if (normalized !== "" && !isHttpsUrl(normalized)) {
      setError("https로 시작하는 주소만 사용할 수 있습니다.");
      return;
    }

    setError(undefined);
    setDraft(normalized);
    if (normalized !== value) onCommit(normalized);
  };

  return (
    <TextField
      label="웹페이지 주소"
      type="url"
      inputMode="url"
      maxLength={SLIDE_CONTENT_URL_MAX_LENGTH}
      placeholder="https://example.com"
      value={draft}
      error={error}
      description="iframe 삽입이 허용된 https 주소만 사용할 수 있습니다."
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commit(event.currentTarget.value);
      }}
    />
  );
}
