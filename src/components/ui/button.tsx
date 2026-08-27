import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

const VARIANT_CLASS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:bg-ink-50 active:bg-ink-100",
  ghost: "bg-transparent text-foreground-muted hover:bg-ink-100 hover:text-foreground",
  danger: "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700",
} as const;

const SIZE_CLASS = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-5 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;
export type ButtonSize = keyof typeof SIZE_CLASS;

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** true이면 버튼을 비활성화하고 진행 표시를 보여준다. */
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-control font-medium whitespace-nowrap",
        "transition-colors duration-150 ease-standard",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
