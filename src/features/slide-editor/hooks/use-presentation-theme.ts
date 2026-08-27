"use client";

import { useCallback, useState } from "react";
import { updateCoverTintAction } from "@/features/presentations/actions/presentation-actions";
import type { Presentation } from "@/types/domain";
import { SLIDE_AUTO_SAVE_DELAY_MS } from "../constants";
import type { SlideSaveResult } from "../types";
import { useAutoSave } from "./use-auto-save";

/**
 * 편집 화면에서 다루는 공통 테마 값.
 *
 * 표지 tint는 슬라이드가 아니라 프레젠테이션에 저장되므로 슬라이드 자동 저장과 분리한다.
 * 슬라이더를 움직이는 동안에는 화면만 먼저 바꾸고, 저장은 debounce로 모아서 보낸다.
 */
export function usePresentationTheme(presentation: Presentation) {
  const [theme, setTheme] = useState(presentation.theme);
  const [lastServerTheme, setLastServerTheme] = useState(presentation.theme);

  // 공통 설정 모달에서 값을 바꾸면 서버가 새 데이터를 내려준다. 그때 화면 상태도 맞춘다.
  // effect 대신 렌더 중에 맞추면 한 번 더 그리지 않는다.
  if (lastServerTheme !== presentation.theme) {
    setLastServerTheme(presentation.theme);
    setTheme(presentation.theme);
  }

  const save = useCallback(
    async (value: { presentationId: string; coverTint: number }): Promise<SlideSaveResult> => {
      const result = await updateCoverTintAction(value);
      if (result.status === "success") return { status: "success" };

      return {
        status: "error",
        message: result.message ?? result.fieldErrors?.coverTint ?? "설정을 저장하지 못했습니다.",
      };
    },
    [],
  );

  const autoSave = useAutoSave(save, { delay: SLIDE_AUTO_SAVE_DELAY_MS });
  const { schedule } = autoSave;

  const setCoverTint = useCallback(
    (coverTint: number) => {
      setTheme((current) => ({ ...current, coverTint }));
      schedule({ presentationId: presentation.id, coverTint });
    },
    [presentation.id, schedule],
  );

  return { theme, setCoverTint, themeSaveStatus: autoSave.status };
}
