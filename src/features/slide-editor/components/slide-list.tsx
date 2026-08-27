"use client";

import { useState } from "react";
import { Button, EmptyState, ErrorMessage, Menu } from "@/components/ui";
import { slideDisplayTitle } from "@/features/slide-renderer";
import type { PresentationTheme, Slide, SlideTemplate } from "@/types/domain";
import { DeleteSlideDialog } from "./delete-slide-dialog";
import { SlideListItem } from "./slide-list-item";

export type SlideListProps = {
  slides: Slide[];
  theme: PresentationTheme;
  selectedSlideId: string | null;
  /** 목록을 바꾸는 요청이 진행 중인지 여부. */
  pending: boolean;
  error: string | null;
  onSelect: (slideId: string) => void;
  onCreate: (template: SlideTemplate) => void;
  onDelete: (slideId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDismissError: () => void;
};

/**
 * 편집 화면 왼쪽의 슬라이드 목록.
 *
 * 순서 변경은 드래그로 하고, 같은 동작을 항목 메뉴의 위/아래 이동으로도 할 수 있게 한다.
 * 드래그만 제공하면 키보드 사용자가 순서를 바꿀 방법이 없다.
 */
export function SlideList({
  slides,
  theme,
  selectedSlideId,
  pending,
  error,
  onSelect,
  onCreate,
  onDelete,
  onMove,
  onDismissError,
}: SlideListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<Slide | null>(null);

  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex !== null && dragIndex !== toIndex) onMove(dragIndex, toIndex);
    resetDrag();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle p-3">
        <p className="text-xs text-foreground-muted">슬라이드 {slides.length}장</p>
        <Menu
          label="슬라이드 추가"
          triggerSize="sm"
          items={[
            { id: "cover", label: "표지 슬라이드", onSelect: () => onCreate("cover") },
            { id: "content", label: "본문 슬라이드", onSelect: () => onCreate("content") },
            { id: "image", label: "이미지 슬라이드", onSelect: () => onCreate("image") },
            { id: "html", label: "HTML 슬라이드", onSelect: () => onCreate("html") },
          ]}
        />
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={onDismissError} retryLabel="닫기" className="m-3" />
      ) : null}

      {slides.length === 0 ? (
        <EmptyState
          title="슬라이드가 없습니다."
          description="표지로 시작해 본문, 이미지, HTML 슬라이드를 이어 붙이세요."
          className="m-3"
          action={
            <>
              <Button size="sm" disabled={pending} onClick={() => onCreate("cover")}>
                표지 만들기
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => onCreate("content")}
              >
                본문 만들기
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => onCreate("image")}
              >
                이미지 만들기
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => onCreate("html")}
              >
                HTML 만들기
              </Button>
            </>
          }
        />
      ) : (
        <ol aria-busy={pending} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {slides.map((slide, index) => (
            <SlideListItem
              key={slide.id}
              slide={slide}
              theme={theme}
              pageNumber={index + 1}
              selected={slide.id === selectedSlideId}
              isFirst={index === 0}
              isLast={index === slides.length - 1}
              dragging={dragIndex === index}
              dropTarget={overIndex === index}
              onSelect={() => onSelect(slide.id)}
              onMoveUp={() => onMove(index, index - 1)}
              onMoveDown={() => onMove(index, index + 1)}
              onDelete={() => setSlideToDelete(slide)}
              onDragStart={() => setDragIndex(index)}
              onDragEnter={() => setOverIndex(index)}
              onDragEnd={resetDrag}
              onDrop={() => handleDrop(index)}
            />
          ))}
        </ol>
      )}

      <DeleteSlideDialog
        open={slideToDelete !== null}
        slideName={slideToDelete ? slideDisplayTitle(slideToDelete) : ""}
        pending={pending}
        onClose={() => setSlideToDelete(null)}
        onConfirm={() => {
          if (slideToDelete) onDelete(slideToDelete.id);
          setSlideToDelete(null);
        }}
      />
    </div>
  );
}
