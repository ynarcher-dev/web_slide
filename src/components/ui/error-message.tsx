import { cn } from "@/lib/cn";
import { Button } from "./button";

type ErrorMessageProps = {
  title?: string;
  message: string;
  /** 재시도 동작이 있으면 버튼을 함께 표시한다. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorMessage({
  title = "문제가 발생했습니다.",
  message,
  onRetry,
  retryLabel = "다시 시도",
  className,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-2 rounded-panel border border-danger-500 bg-danger-50 p-4",
        className,
      )}
    >
      <p className="text-sm font-semibold text-danger-700">{title}</p>
      <p className="text-sm text-danger-700">{message}</p>
      {onRetry ? (
        <div className="mt-1">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
