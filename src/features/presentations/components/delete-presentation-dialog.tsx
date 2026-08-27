"use client";

import { useActionState } from "react";
import { Button, ErrorMessage, Modal } from "@/components/ui";
import type { Presentation } from "@/types/domain";
import { deletePresentationAction } from "../actions/presentation-actions";
import { useCloseOnSuccess } from "../hooks/use-close-on-success";
import { IDLE_PRESENTATION_ACTION_STATE } from "../types";

export type DeletePresentationDialogProps = {
  presentation: Presentation;
  open: boolean;
  onClose: () => void;
};

export function DeletePresentationDialog({
  presentation,
  open,
  onClose,
}: DeletePresentationDialogProps) {
  const [state, submit, pending] = useActionState(
    deletePresentationAction,
    IDLE_PRESENTATION_ACTION_STATE,
  );

  useCloseOnSuccess(state, onClose);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="프레젠테이션 삭제"
      description={`"${presentation.title}"과 이 자료의 모든 슬라이드를 지웁니다. 되돌릴 수 없습니다.`}
    >
      <form action={submit} className="flex flex-col gap-4">
        <input type="hidden" name="presentationId" value={presentation.id} />

        {state.status === "error" && state.message ? (
          <ErrorMessage message={state.message} />
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="danger" loading={pending}>
            삭제
          </Button>
        </div>
      </form>
    </Modal>
  );
}
