"use client";

import { useActionState, useState } from "react";
import { Button, ErrorMessage, Modal, TextField, type ButtonVariant } from "@/components/ui";
import { createPresentationAction } from "../actions/presentation-actions";
import { IDLE_PRESENTATION_ACTION_STATE } from "../types";

const DEFAULT_TITLE = "제목 없는 프레젠테이션";

export function CreatePresentationButton({
  variant = "primary",
  label = "새 프레젠테이션",
}: {
  variant?: ButtonVariant;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(
    createPresentationAction,
    IDLE_PRESENTATION_ACTION_STATE,
  );

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="새 프레젠테이션 만들기"
        description="제목을 입력하면 편집 화면이 열립니다. 제목은 나중에 바꿀 수 있습니다."
      >
        <form action={submit} className="flex flex-col gap-4">
          <TextField
            label="제목"
            name="title"
            required
            maxLength={120}
            defaultValue={DEFAULT_TITLE}
            error={state.fieldErrors?.title}
          />

          {state.status === "error" && state.message ? (
            <ErrorMessage message={state.message} />
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" loading={pending}>
              만들기
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
