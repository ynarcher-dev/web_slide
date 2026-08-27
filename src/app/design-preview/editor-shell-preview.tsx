import { Button, EmptyState, Logo, TextField } from "@/components/ui";
import { SlideEditorShell } from "@/features/slide-editor/components/slide-editor-shell";

/**
 * 데이터 없이 편집기 골격만 확인하기 위한 미리보기다.
 * 실제 목록, 미리보기, 속성 구현은 이후 단계에서 이 자리에 들어간다.
 */
export function EditorShellPreview() {
  return (
    <div className="h-[32rem] overflow-hidden rounded-panel border border-border-subtle">
      <SlideEditorShell
        header={
          <>
            <Logo height={18} />
            <span className="text-sm font-semibold text-foreground">서비스 소개</span>
            <span className="text-xs text-foreground-muted">저장됨</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm">발표 시작</Button>
            </div>
          </>
        }
        slideList={
          <div className="flex flex-col gap-2 p-3">
            <Button size="sm" variant="secondary">
              슬라이드 추가
            </Button>
            <EmptyState
              title="슬라이드 없음"
              description="아직 만들어진 슬라이드가 없습니다."
              className="p-4"
            />
          </div>
        }
        preview={
          <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-panel border border-border-subtle bg-surface">
            <p className="text-sm text-foreground-muted">16:9 슬라이드 미리보기 영역</p>
          </div>
        }
        properties={
          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm font-semibold text-foreground">속성</p>
            <TextField label="페이지명" placeholder="예: PRODUCT DEMO" />
            <TextField label="대제목" placeholder="예: 사용자 대시보드" />
            <TextField label="소제목" placeholder="예: 주요 기능을 확인합니다." />
          </div>
        }
      />
    </div>
  );
}
