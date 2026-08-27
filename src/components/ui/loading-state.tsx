import { cn } from "@/lib/cn";
import { Spinner, type SpinnerSize } from "./spinner";

type LoadingStateProps = {
  message?: string;
  size?: SpinnerSize;
  className?: string;
};

/**
 * 목록, 패널 등 영역 단위 로딩 표시.
 */
export function LoadingState({
  message = "불러오는 중입니다.",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-foreground-muted",
        className,
      )}
    >
      <Spinner size={size} className="text-brand-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
