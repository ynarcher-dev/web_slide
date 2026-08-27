"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export type TextAreaFieldProps = Omit<ComponentPropsWithRef<"textarea">, "id"> & {
  label: string;
  /** 입력 아래에 표시할 도움말. 오류가 있으면 오류 메시지가 우선한다. */
  description?: string;
  error?: string;
  /** 등폭 글꼴로 보여 준다. 코드나 마크업을 넣는 칸에 사용한다. */
  monospace?: boolean;
  containerClassName?: string;
};

/** 여러 줄 입력. 규칙은 `TextField`와 같고 높이만 직접 정할 수 있다. */
export function TextAreaField({
  label,
  description,
  error,
  monospace = false,
  containerClassName,
  className,
  required,
  rows = 8,
  ...props
}: TextAreaFieldProps) {
  const fieldId = useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-brand-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={cn(description && descriptionId, hasError && errorId) || undefined}
        className={cn(
          "w-full rounded-control border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-foreground-subtle",
          "transition-colors duration-150 ease-standard",
          "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-foreground-muted",
          monospace && "font-mono text-xs leading-relaxed",
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
