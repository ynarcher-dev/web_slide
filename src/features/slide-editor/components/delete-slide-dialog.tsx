"use client";

import { Button, Modal } from "@/components/ui";

export type DeleteSlideDialogProps = {
  open: boolean;
  /** 확인 문구에 보여줄 슬라이드 이름. */
  slideName: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** 실수로 슬라이드를 지우지 않도록 삭제 전에 한 번 확인한다. */
export function DeleteSlideDialog({
  open,
  slideName,
  pending,
  onClose,
  onConfirm,
}: DeleteSlideDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="슬라이드 삭제"
      description={`"${slideName}" 슬라이드를 지웁니다. 되돌릴 수 없습니다.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="danger" loading={pending} onClick={onConfirm}>
            삭제
          </Button>
        </>
      }
    />
  );
}
