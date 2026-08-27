"use client";

import { useActionState } from "react";
import { Button, ErrorMessage, Modal, TextField } from "@/components/ui";
import type { Presentation } from "@/types/domain";
import { renamePresentationAction } from "../actions/presentation-actions";
import { useCloseOnSuccess } from "../hooks/use-close-on-success";
import { IDLE_PRESENTATION_ACTION_STATE } from "../types";

export type RenamePresentationDialogProps = {
  presentation: Presentation;
  open: boolean;
  onClose: () => void;
};

export function RenamePresentationDialog({
  presentation,
  open,
  onClose,
}: RenamePresentationDialogProps) {
  const [state, submit, pending] = useActionState(
    renamePresentationAction,
    IDLE_PRESENTATION_ACTION_STATE,
  );

  useCloseOnSuccess(state, onClose);

  return (
    <Modal open={open} onClose={onClose} title="제목 수정">
      <form action={submit} className="flex flex-col gap-4">
        <input type="hidden" name="presentationId" value={presentation.id} />

        <TextField
          label="제목"
          name="title"
          required
          maxLength={120}
          defaultValue={presentation.title}
          error={state.fieldErrors?.title}
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
