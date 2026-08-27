"use client";

import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export type CheckboxFieldProps = Omit<ComponentPropsWithRef<"input">, "id" | "type"> & {
  label: string;
  /** 체크박스 아래에 표시할 도움말. */
  description?: string;
  containerClassName?: string;
};

export function CheckboxField({
  label,
  description,
  containerClassName,
  className,
  ...props
}: CheckboxFieldProps) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;

  return (
    <div className={cn("flex items-start gap-2", containerClassName)}>
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "mt-0.5 size-4 shrink-0 accent-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />

      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
