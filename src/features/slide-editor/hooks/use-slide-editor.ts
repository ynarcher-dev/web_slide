"use client";

import { useCallback, useState, useTransition } from "react";
import type { Slide, SlideFields, SlideTemplate } from "@/types/domain";
import {
  createSlideAction,
  deleteSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "../actions/slide-actions";
import { SLIDE_AUTO_SAVE_DELAY_MS } from "../constants";
import { moveItem, nextSelectionAfterRemoval } from "../ordering";
import { applySlideFields, toSlideFields } from "../slide-fields";
import { useAutoSave } from "./use-auto-save";

type PendingSave = { presentationId: string; slideId: string; fields: SlideFields };

/**
 * 편집 화면의 슬라이드 상태를 한곳에서 관리한다.
 *
 * 목록, 미리보기, 속성 패널이 같은 배열을 보므로 입력한 값이 곧바로 세 곳에 반영된다.
 * 서버 저장은 자동 저장 훅이 debounce로 처리하고, 목록이 바뀌는 동작은 그때그때 서버 결과로 맞춘다.
 */
export function useSlideEditor(presentationId: string, initialSlides: Slide[]) {
  const [slides, setSlides] = useState(initialSlides);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    initialSlides[0]?.id ?? null,
  );
  const [listError, setListError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = useCallback((value: PendingSave) => updateSlideAction(value), []);
  const autoSave = useAutoSave(save, { delay: SLIDE_AUTO_SAVE_DELAY_MS });
  const { flush, schedule } = autoSave;

  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? null;

  const selectSlide = useCallback(
    (slideId: string) => {
      // 슬라이드를 바꾸기 전에 예약된 저장을 끝내 입력을 잃지 않게 한다.
      flush();
      setSelectedSlideId(slideId);
    },
    [flush],
  );

  const createSlide = useCallback(
    (template: SlideTemplate) => {
      flush();
      startTransition(async () => {
        const result = await createSlideAction({
          presentationId,
          template,
          afterSlideId: selectedSlideId,
        });

        if (result.status === "error") {
          setListError(result.message);
          return;
        }

        setListError(null);
        setSlides(result.slides);
        if (result.createdSlideId) setSelectedSlideId(result.createdSlideId);
      });
    },
    [flush, presentationId, selectedSlideId],
  );

  const removeSlide = useCallback(
    (slideId: string) => {
      flush();
      startTransition(async () => {
        const result = await deleteSlideAction({ presentationId, slideId });

        if (result.status === "error") {
          setListError(result.message);
          return;
        }

        setListError(null);
        setSelectedSlideId((current) =>
          current === slideId
            ? nextSelectionAfterRemoval(
                slides.map((slide) => slide.id),
                slideId,
              )
            : current,
        );
        setSlides(result.slides);
      });
    },
    [flush, presentationId, slides],
  );

  const moveSlide = useCallback(
    (fromIndex: number, toIndex: number) => {
      const reordered = moveItem(slides, fromIndex, toIndex);
      if (reordered === slides) return;

      // 드래그 결과를 먼저 보여주고, 실패하면 원래 순서로 되돌린다.
      const previous = slides;
      setSlides(reordered);

      startTransition(async () => {
        const result = await reorderSlidesAction({
          presentationId,
          orderedSlideIds: reordered.map((slide) => slide.id),
        });

        if (result.status === "error") {
          setSlides(previous);
          setListError(result.message);
          return;
        }

        setListError(null);
        setSlides(result.slides);
      });
    },
    [presentationId, slides],
  );

  const updateSelectedFields = useCallback(
    (patch: Partial<SlideFields>) => {
      if (!selectedSlide) return;

      const fields = { ...toSlideFields(selectedSlide), ...patch };
      setSlides((current) =>
        current.map((slide) =>
          slide.id === selectedSlide.id ? applySlideFields(slide, fields) : slide,
        ),
      );
      schedule({ presentationId, slideId: selectedSlide.id, fields });
    },
    [presentationId, schedule, selectedSlide],
  );

  const dismissListError = useCallback(() => setListError(null), []);

  return {
    slides,
    selectedSlide,
    selectedSlideId,
    listError,
    pending,
    saveStatus: autoSave.status,
    saveMessage: autoSave.message,
    retrySave: autoSave.retry,
    selectSlide,
    createSlide,
    removeSlide,
    moveSlide,
    updateSelectedFields,
    dismissListError,
  };
}

export type SlideEditorController = ReturnType<typeof useSlideEditor>;
