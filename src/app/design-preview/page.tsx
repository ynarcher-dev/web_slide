import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewSection } from "./section";
import { TokenGallery } from "./token-gallery";
import { UiGallery } from "./ui-gallery";
import { EditorShellPreview } from "./editor-shell-preview";

export const metadata: Metadata = {
  title: "디자인 기준 미리보기 | Web Slide",
  description: "디자인 토큰과 공통 UI 컴포넌트를 데이터 없이 확인하는 내부 화면",
};

/**
 * 개발자 확인용 화면이라 프로덕션 빌드에서는 열지 않는다.
 * 화면을 지우지 않는 이유는 공통 UI를 데이터 없이 확인하고 접근성 검사를 돌릴 곳이 필요해서다.
 */
export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <DesignPreviewContent />;
}

function DesignPreviewContent() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">디자인 기준 미리보기</h1>
        <p className="text-sm text-foreground-muted">
          디자인 토큰, 공통 UI 컴포넌트와 편집기 골격을 데이터 없이 확인하는 내부 화면입니다.
        </p>
      </header>

      <TokenGallery />
      <UiGallery />

      <PreviewSection
        title="편집기 3단 레이아웃"
        description="넓은 화면에서는 3단, 좁은 화면에서는 상단 전환 버튼으로 한 패널씩 표시합니다."
      >
        <EditorShellPreview />
      </PreviewSection>
    </main>
  );
}
