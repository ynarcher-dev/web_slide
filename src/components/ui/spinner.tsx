import { cn } from "@/lib/cn";

const SIZE_CLASS = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-[3px]",
} as const;

export type SpinnerSize = keyof typeof SIZE_CLASS;

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
};

/**
 * 순수 표시용 회전 표시. 화면 낭독기용 텍스트는 감싸는 쪽에서 제공한다.
 * 모션 감소 설정에서도 진행 상태를 알 수 있도록 회전은 유지한다.
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      data-keep-motion=""
      className={cn(
        "inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]",
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}
