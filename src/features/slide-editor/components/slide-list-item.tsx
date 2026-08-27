"use client";

import { motion } from "motion/react";
import { Menu } from "@/components/ui";
import {
  SlideView,
  slideAriaLabel,
  slideDisplayTitle,
  slideTemplateLabel,
} from "@/features/slide-renderer";
import { cn } from "@/lib/cn";
import type { PresentationTheme, Slide } from "@/types/domain";

export type SlideListItemProps = {
  slide: Slide;
  theme: PresentationTheme;
  /** 1부터 시작하는 표시용 페이지 번호. */
  pageNumber: number;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
};

/**
 * 슬라이드 목록의 한 항목.
 *
 * 썸네일은 발표 화면과 같은 렌더러를 축소해 사용한다.
 * 다만 목록에서 웹페이지를 여러 개 동시에 띄우지 않도록 정적 모드로 그린다.
 */
export function SlideListItem({
  slide,
  theme,
  pageNumber,
  selected,
  isFirst,
  isLast,
  dragging,
  dropTarget,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: SlideListItemProps) {
  return (
    <motion.li
      layout
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cn(
        "flex items-start gap-2 rounded-panel border p-2",
        "transition-colors duration-150 ease-standard",
        selected ? "border-brand-500 bg-brand-50" : "border-transparent hover:bg-ink-50",
        dropTarget && !dragging && "border-brand-300",
        dragging && "opacity-50",
      )}
    >
      <span className="w-5 shrink-0 pt-1 text-right text-xs tabular-nums text-foreground-muted">
        {pageNumber}
      </span>

      <button
        type="button"
        onClick={onSelect}
        aria-label={slideAriaLabel(slide, pageNumber)}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-control text-left"
      >
        <SlideView
          slide={slide}
          theme={theme}
          pageNumber={pageNumber}
          mode="static"
          className="rounded-control border border-border-subtle"
        />
        <span className="flex items-center gap-1.5">
          <span className="rounded-control bg-ink-100 px-1.5 py-0.5 text-[0.6875rem] text-foreground-muted">
            {slideTemplateLabel(slide.template)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">
            {slideDisplayTitle(slide)}
          </span>
        </span>
      </button>

      <Menu
        label={`${pageNumber}페이지 슬라이드 메뉴`}
        triggerContent={<span aria-hidden="true">⋯</span>}
        triggerVariant="ghost"
        triggerSize="sm"
        className="shrink-0"
        items={[
          { id: "up", label: "위로 이동", disabled: isFirst, onSelect: onMoveUp },
          { id: "down", label: "아래로 이동", disabled: isLast, onSelect: onMoveDown },
          { id: "delete", label: "삭제", destructive: true, onSelect: onDelete },
        ]}
      />
    </motion.li>
  );
}
