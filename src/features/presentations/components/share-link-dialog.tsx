"use client";

import { useRef, useState } from "react";
import { Button, ErrorMessage, Modal, TextField } from "@/components/ui";
import { useMounted } from "@/lib/use-mounted";
import type { Presentation } from "@/types/domain";
import { buildShareUrl } from "../share-link";

export type ShareLinkDialogProps = {
  presentation: Presentation;
  open: boolean;
  onClose: () => void;
};

type CopyState = "idle" | "copied" | "error";

/**
 * 읽기 전용 공유 링크를 보여 주고 복사한다.
 *
 * 공개 여부는 공통 설정에서 바꾸므로 여기서는 현재 상태만 알려 준다.
 * 비공개 상태에서도 주소는 보여 준다. 미리 복사해 두고 공개로 바꾸는 순서가 자연스럽기 때문이다.
 *
 * 주소의 기준은 지금 보고 있는 브라우저의 origin이다. 그래서 배포 도메인을 빌드 시점에
 * 알 필요가 없다. `NEXT_PUBLIC_SITE_URL`은 하이드레이션 전 서버 렌더 결과에만 쓰이는 대비값이며,
 * 사용자는 다이얼로그를 직접 열어야 주소를 보므로 항상 마운트 이후의 실제 주소를 본다.
 */
export function ShareLinkDialog({ presentation, open, onClose }: ShareLinkDialogProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [lastOpen, setLastOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useMounted();
  const shareUrl = buildShareUrl(
    presentation.shareId,
    mounted ? window.location.origin : undefined,
  );

  // 다시 열었을 때 지난 복사 결과가 남아 있지 않게 한다.
  // effect 대신 렌더 중에 맞추면 한 번 더 그리지 않는다.
  if (lastOpen !== open) {
    setLastOpen(open);
    setCopyState("idle");
  }

  async function handleCopy() {
    try {
      // 클립보드 API는 보안 컨텍스트에서만 동작한다. 실패하면 직접 복사할 수 있게 선택해 둔다.
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      inputRef.current?.select();
      setCopyState("error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="공유 링크"
      description="링크를 받은 사람은 로그인 없이 읽기 전용으로 볼 수 있습니다."
    >
      <div className="flex flex-col gap-4">
        {presentation.isPublic ? null : (
          <p className="rounded-control bg-ink-100 px-3 py-2 text-sm text-foreground-muted">
            지금은 비공개입니다. 공통 설정에서 &ldquo;공개 공유 허용&rdquo;을 켜야 링크가 열립니다.
          </p>
        )}

        <TextField
          ref={inputRef}
          label="공유 주소"
          value={shareUrl}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />

        {copyState === "copied" ? (
          <p className="text-sm text-success-600" role="status">
            링크를 복사했습니다.
          </p>
        ) : null}
        {copyState === "error" ? (
          <ErrorMessage message="복사하지 못했습니다. 선택된 주소를 직접 복사하세요." />
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {presentation.isPublic ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-control px-2 py-1 text-sm text-foreground-muted hover:text-foreground"
            >
              공유 화면 열기
            </a>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="button" onClick={handleCopy}>
            링크 복사
          </Button>
        </div>
      </div>
    </Modal>
  );
}
