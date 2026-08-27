import { EmptyState } from "@/components/ui";
import type { Presentation } from "@/types/domain";
import { CreatePresentationButton } from "./create-presentation-button";
import { PresentationCard } from "./presentation-card";

/**
 * 목록과 빈 상태만 담당한다. 데이터 조회는 화면(page)에서 하고 결과를 넘겨받는다.
 */
export function PresentationList({ presentations }: { presentations: Presentation[] }) {
  if (presentations.length === 0) {
    return (
      <EmptyState
        title="아직 프레젠테이션이 없습니다."
        description="새 프레젠테이션을 만들면 바로 편집 화면이 열립니다."
        action={<CreatePresentationButton label="첫 프레젠테이션 만들기" />}
      />
    );
  }

  return (
    <section aria-label="프레젠테이션 목록" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">{presentations.length}개</p>
        <CreatePresentationButton />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {presentations.map((presentation) => (
          <PresentationCard key={presentation.id} presentation={presentation} />
        ))}
      </ul>
    </section>
  );
}
