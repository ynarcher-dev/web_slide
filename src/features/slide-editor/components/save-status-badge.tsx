"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SaveStatus } from "../types";

const LABELS: Record<SaveStatus, string> = {
  idle: "변경 없음",
  saving: "저장 중",
  saved: "저장됨",
  error: "저장 실패",
};

export type SaveStatusBadgeProps = {
  status: SaveStatus;
  message?: string;
  onRetry: () => void;
  className?: string;
};

/** 자동 저장 상태를 상단에 계속 보여 준다. 실패했을 때만 재시도 버튼을 함께 낸다. */
export function SaveStatusBadge({ status, message, onRetry, className }: SaveStatusBadgeProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "text-xs whitespace-nowrap",
          status === "error" ? "font-medium text-danger-600" : "text-foreground-muted",
        )}
      >
        {status === "error" && message ? `${LABELS.error}: ${message}` : LABELS[status]}
      </p>
      {status === "error" ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
