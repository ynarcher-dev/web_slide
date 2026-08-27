"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const PANELS = [
  { id: "list", label: "슬라이드" },
  { id: "preview", label: "미리보기" },
  { id: "properties", label: "속성" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

export type SlideEditorShellProps = {
  /** 제목, 저장 상태, 발표 시작 등 상단 영역. */
  header?: ReactNode;
  slideList: ReactNode;
  preview: ReactNode;
  properties: ReactNode;
  className?: string;
};

/**
 * 편집기의 3단 레이아웃만 담당한다. 데이터 조회와 저장은 이 컴포넌트에서 다루지 않는다.
 *
 * 넓은 화면에서는 목록, 미리보기, 속성을 동시에 보여준다.
 * 좁은 화면에서는 한 번에 한 패널만 보여주고 상단 전환 버튼으로 이동한다.
 */
export function SlideEditorShell({
  header,
  slideList,
  preview,
  properties,
  className,
}: SlideEditorShellProps) {
  const [activePanel, setActivePanel] = useState<PanelId>("preview");

  const panelClass = (id: PanelId) =>
    cn("min-h-0 flex-1 flex-col lg:flex", activePanel === id ? "flex" : "hidden");

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-canvas", className)}>
      {header ? (
        <header className="flex h-(--editor-header-height) shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-4">
          {header}
        </header>
      ) : null}

      <div className="flex shrink-0 gap-1 border-b border-border-subtle bg-surface px-2 py-1.5 lg:hidden">
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            aria-pressed={activePanel === panel.id}
            aria-controls={`editor-panel-${panel.id}`}
            onClick={() => setActivePanel(panel.id)}
            className={cn(
              "flex-1 rounded-control px-3 py-1.5 text-sm font-medium",
              "transition-colors duration-150 ease-standard",
              activePanel === panel.id
                ? "bg-brand-50 text-brand-700"
                : "text-foreground-muted hover:bg-ink-100",
            )}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 lg:gap-px lg:bg-border-subtle">
        <section
          id="editor-panel-list"
          aria-label="슬라이드 목록"
          className={cn(
            panelClass("list"),
            "overflow-y-auto bg-surface lg:w-(--editor-list-width) lg:flex-none",
          )}
        >
          {slideList}
        </section>

        <section
          id="editor-panel-preview"
          aria-label="슬라이드 미리보기"
          className={cn(
            panelClass("preview"),
            "min-w-0 items-center justify-center overflow-auto bg-canvas p-4 lg:flex-1",
          )}
        >
          {preview}
        </section>

        <section
          id="editor-panel-properties"
          aria-label="슬라이드 속성"
          className={cn(
            panelClass("properties"),
            "overflow-y-auto bg-surface lg:w-(--editor-properties-width) lg:flex-none",
          )}
        >
          {properties}
        </section>
      </div>
    </div>
  );
}
