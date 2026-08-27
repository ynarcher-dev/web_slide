"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type { Presentation } from "@/types/domain";
import { DeletePresentationDialog } from "./delete-presentation-dialog";
import { PresentationSettingsDialog } from "./presentation-settings-dialog";
import { RenamePresentationDialog } from "./rename-presentation-dialog";
import { ShareLinkDialog } from "./share-link-dialog";

type DialogId = "rename" | "settings" | "share" | "delete";

export function PresentationCard({ presentation }: { presentation: Presentation }) {
  const [dialog, setDialog] = useState<DialogId | null>(null);
  const router = useRouter();
  const editHref = ROUTES.presentationEdit(presentation.id);
  // 목록이 다시 그려져도 모달의 닫기 함수가 바뀌지 않도록 고정한다.
  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <li className="flex flex-col gap-3 rounded-panel border border-border-subtle bg-surface p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground">
            <Link href={editHref} className="rounded-control hover:text-brand-600">
              {presentation.title}
            </Link>
          </h2>
          <p className="mt-1 text-xs text-foreground-muted">
            {formatDateTime(presentation.updatedAt)} 수정
          </p>
        </div>

        <Menu
          label="관리"
          triggerSize="sm"
          items={[
            { id: "edit", label: "편집 열기", onSelect: () => router.push(editHref) },
            { id: "rename", label: "제목 수정", onSelect: () => setDialog("rename") },
            { id: "settings", label: "공통 설정", onSelect: () => setDialog("settings") },
            { id: "share", label: "공유 링크", onSelect: () => setDialog("share") },
            {
              id: "delete",
              label: "삭제",
              destructive: true,
              onSelect: () => setDialog("delete"),
            },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5 rounded-control bg-ink-100 px-2 py-1">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: presentation.theme.brandColor }}
          />
          {presentation.theme.brandColor.toUpperCase()}
        </span>
        <span className="rounded-control bg-ink-100 px-2 py-1">
          tint {presentation.theme.coverTint}
        </span>
        <span
          className={
            presentation.isPublic
              ? "rounded-control bg-success-50 px-2 py-1 text-success-600"
              : "rounded-control bg-ink-100 px-2 py-1"
          }
        >
          {presentation.isPublic ? "공개" : "비공개"}
        </span>
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
      <DeletePresentationDialog
        presentation={presentation}
        open={dialog === "delete"}
        onClose={closeDialog}
      />
    </li>
  );
}
