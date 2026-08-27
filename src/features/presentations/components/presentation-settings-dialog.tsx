"use client";

import { useActionState } from "react";
import { Button, CheckboxField, ErrorMessage, Modal, TextField } from "@/components/ui";
import type { Presentation } from "@/types/domain";
import { updatePresentationSettingsAction } from "../actions/presentation-actions";
import { useCloseOnSuccess } from "../hooks/use-close-on-success";
import { IDLE_PRESENTATION_ACTION_STATE } from "../types";

export type PresentationSettingsDialogProps = {
  presentation: Presentation;
  open: boolean;
  onClose: () => void;
};

/**
 * 프레젠테이션 단위 공통 설정을 저장한다.
 * 슬라이드는 이 값을 상속하므로 슬라이드마다 다시 입력하지 않는다.
 */
export function PresentationSettingsDialog({
  presentation,
  open,
  onClose,
}: PresentationSettingsDialogProps) {
  const [state, submit, pending] = useActionState(
    updatePresentationSettingsAction,
    IDLE_PRESENTATION_ACTION_STATE,
  );
  const { theme } = presentation;

  useCloseOnSuccess(state, onClose);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="공통 설정"
      description="모든 슬라이드가 함께 사용하는 값입니다."
    >
      <form action={submit} className="flex flex-col gap-4">
        <input type="hidden" name="presentationId" value={presentation.id} />

        <TextField
          label="브랜드 색상"
          name="brandColor"
          type="color"
          defaultValue={theme.brandColor}
          error={state.fieldErrors?.brandColor}
          className="cursor-pointer"
          description="제목 강조와 표지 tint에 사용합니다."
        />

        <TextField
          label="표지 배경 tint"
          name="coverTint"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={theme.coverTint}
          error={state.fieldErrors?.coverTint}
          description="0은 흰색, 100은 브랜드 색상을 가장 진하게 적용합니다."
        />

        <TextField
          label="푸터 텍스트"
          name="footerText"
          maxLength={120}
          defaultValue={theme.footerText}
          error={state.fieldErrors?.footerText}
          placeholder="Copyright © 2026 Y&ARCHER"
        />

        <CheckboxField
          label="페이지 번호 표시"
          name="showPageNumber"
          defaultChecked={theme.showPageNumber}
          description="본문 슬라이드 오른쪽 아래에 번호를 표시합니다."
        />

        <CheckboxField
          label="공개 공유 허용"
          name="isPublic"
          defaultChecked={presentation.isPublic}
          description="공개하면 링크를 가진 누구나 읽기 전용으로 볼 수 있습니다."
        />

        {state.status === "error" && state.message ? (
          <ErrorMessage message={state.message} />
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={pending}>
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}
