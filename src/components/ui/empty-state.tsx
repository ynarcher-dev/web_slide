import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  /** 비어 있는 상태에서 이어서 할 수 있는 동작. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-border-strong p-8 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="text-sm text-foreground-muted">{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
