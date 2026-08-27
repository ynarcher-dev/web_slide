"use client";

import type { Presentation, Slide } from "@/types/domain";
import { useSlideEditor } from "../hooks/use-slide-editor";
import { usePresentationTheme } from "../hooks/use-presentation-theme";
import { EditorHeader } from "./editor-header";
import { SlideEditorShell } from "./slide-editor-shell";
import { SlideList } from "./slide-list";
import { SlidePreview } from "./slide-preview";
import { SlidePropertiesPanel } from "./slide-properties-panel";

export type SlideEditorWorkspaceProps = {
  presentation: Presentation;
  initialSlides: Slide[];
};

/**
 * 편집 화면의 데이터 흐름을 조립한다.
 *
 * 상태는 훅에 두고, 이 컴포넌트는 어떤 값을 어느 패널에 넘길지만 결정한다.
 */
export function SlideEditorWorkspace({ presentation, initialSlides }: SlideEditorWorkspaceProps) {
  const editor = useSlideEditor(presentation.id, initialSlides);
  const { theme, setCoverTint, themeSaveStatus } = usePresentationTheme(presentation);

  const selectedIndex = editor.slides.findIndex((slide) => slide.id === editor.selectedSlideId);
  // 슬라이드 저장과 테마 저장 중 하나라도 진행 중이거나 실패하면 그 상태를 우선 보여준다.
  const saveStatus = editor.saveStatus === "idle" ? themeSaveStatus : editor.saveStatus;

  return (
    <SlideEditorShell
      header={
        <EditorHeader
          presentation={presentation}
          saveStatus={saveStatus}
          saveMessage={editor.saveMessage}
          onRetrySave={editor.retrySave}
          canPresent={editor.slides.length > 0}
        />
      }
      slideList={
        <SlideList
          slides={editor.slides}
          theme={theme}
          selectedSlideId={editor.selectedSlideId}
          pending={editor.pending}
          error={editor.listError}
          onSelect={editor.selectSlide}
          onCreate={editor.createSlide}
          onDelete={editor.removeSlide}
          onMove={editor.moveSlide}
          onDismissError={editor.dismissListError}
        />
      }
      preview={
        <SlidePreview slide={editor.selectedSlide} theme={theme} pageNumber={selectedIndex + 1} />
      }
      properties={
        <SlidePropertiesPanel
          slide={editor.selectedSlide}
          coverTint={theme.coverTint}
          onFieldChange={editor.updateSelectedFields}
          onCoverTintChange={setCoverTint}
        />
      }
    />
  );
}
