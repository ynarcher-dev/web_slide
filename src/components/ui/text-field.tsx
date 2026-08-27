"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export type TextFieldProps = Omit<ComponentPropsWithRef<"input">, "id"> & {
  label: string;
  /** 입력 아래에 표시할 도움말. 오류가 있으면 오류 메시지가 우선한다. */
  description?: string;
  error?: string;
  /** 라벨을 시각적으로 숨기고 화면 낭독기에만 노출한다. */
  hideLabel?: boolean;
  containerClassName?: string;
};

export function TextField({
  label,
  description,
  error,
  hideLabel = false,
  containerClassName,
  className,
  required,
  type = "text",
  ...props
}: TextFieldProps) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label
        htmlFor={inputId}
        className={cn("text-sm font-medium text-foreground", hideLabel && "sr-only")}
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-brand-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <input
        id={inputId}
        type={type}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={cn(description && descriptionId, hasError && errorId) || undefined}
        className={cn(
          "h-9 w-full rounded-control border bg-surface px-3 text-sm text-foreground",
          "placeholder:text-foreground-subtle",
          "transition-colors duration-150 ease-standard",
          "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-foreground-muted",
          hasError
            ? "border-danger-600 hover:border-danger-700"
            : "border-border-strong hover:border-ink-400",
          className,
        )}
        {...props}
      />

      {description && !hasError ? (
        <p id={descriptionId} className="text-xs text-foreground-muted">
          {description}
        </p>
      ) : null}

      {hasError ? (
        <p id={errorId} className="text-xs text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
