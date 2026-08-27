"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Menu } from "@/components/ui";
import { PresentationSettingsDialog } from "@/features/presentations/components/presentation-settings-dialog";
import { RenamePresentationDialog } from "@/features/presentations/components/rename-presentation-dialog";
import { ShareLinkDialog } from "@/features/presentations/components/share-link-dialog";
import { ROUTES } from "@/lib/routes";
import type { Presentation } from "@/types/domain";
import type { SaveStatus } from "../types";
import { SaveStatusBadge } from "./save-status-badge";

type DialogId = "rename" | "settings" | "share";

export type EditorHeaderProps = {
  presentation: Presentation;
  saveStatus: SaveStatus;
  saveMessage?: string;
  onRetrySave: () => void;
  /** 발표할 수 있는 슬라이드가 있는지 여부. */
  canPresent: boolean;
};

/** 편집 화면 상단. 제목 수정과 공통 설정을 목록으로 돌아가지 않고 바로 열 수 있게 한다. */
export function EditorHeader({
  presentation,
  saveStatus,
  saveMessage,
  onRetrySave,
  canPresent,
}: EditorHeaderProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogId | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <>
      <Link
        href={ROUTES.presentations}
        className="shrink-0 rounded-control text-sm whitespace-nowrap text-foreground-muted hover:text-foreground"
      >
        ← 목록
      </Link>

      <h1 className="min-w-0 truncate text-sm font-semibold text-foreground">
        {presentation.title}
      </h1>

      {/* 좁은 화면에서는 자리를 많이 차지해 감춘다. 같은 값을 공통 설정에서 확인할 수 있다. */}
      <span className="hidden shrink-0 rounded-control bg-ink-100 px-2 py-1 text-xs text-foreground-muted sm:inline">
        {presentation.isPublic ? "공개" : "비공개"}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SaveStatusBadge status={saveStatus} message={saveMessage} onRetry={onRetrySave} />

        <Menu
          label="프레젠테이션 설정"
          triggerContent="설정"
          triggerSize="sm"
          items={[
            { id: "rename", label: "제목 수정", onSelect: () => setDialog("rename") },
            { id: "settings", label: "공통 설정", onSelect: () => setDialog("settings") },
            { id: "share", label: "공유 링크", onSelect: () => setDialog("share") },
          ]}
        />

        <Button
          size="sm"
          disabled={!canPresent}
          // 발표는 전체화면 전용 화면에서 진행한다.
          onClick={() => router.push(ROUTES.presentationPresent(presentation.id))}
        >
          발표 시작
        </Button>
      </div>

      <RenamePresentationDialog
        presentation={presentation}
        open={dialog === "rename"}
        onClose={closeDialog}
      />
      <PresentationSettingsDialog
        presentation={presentation}
        open={dialog === "settings"}
        onClose={closeDialog}
      />
      <ShareLinkDialog
        presentation={presentation}
        open={dialog === "share"}
        onClose={closeDialog}
      />
    </>
  );
}
