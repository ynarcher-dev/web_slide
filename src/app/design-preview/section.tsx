import type { ReactNode } from "react";

export function PreviewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-border-subtle bg-surface p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-foreground-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
