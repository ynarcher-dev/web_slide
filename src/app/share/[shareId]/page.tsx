import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState, Logo } from "@/components/ui";
import { getPublicPresentationByShareId } from "@/features/presentations/data/presentation-repository";
import { shareIdSchema } from "@/features/presentations/schema";
import { listSlides } from "@/features/slide-editor/data/slide-repository";
import { SlidePlayer } from "@/features/slide-player/components/slide-player";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 읽기 전용 공유 화면.
 *
 * 로그인하지 않은 사람도 열 수 있어야 하므로 세션을 요구하지 않는다.
 * 대신 공개로 설정된 프레젠테이션만 조회하고, 편집으로 이어지는 UI는 전혀 노출하지 않는다.
 */

/**
 * 같은 요청 안에서 메타데이터와 본문이 각각 호출하므로 결과를 재사용한다.
 * 공개가 아니거나 주소 형식이 틀리면 null이며, 화면에서는 404로 처리한다.
 */
const loadSharedPresentation = cache(async (shareId: string) => {
  if (!shareIdSchema.safeParse(shareId).success) return null;

  const supabase = await createSupabaseServerClient();
  const presentation = await getPublicPresentationByShareId(supabase, shareId);
  if (!presentation) return null;

  const slides = await listSlides(supabase, presentation.id);
  return { presentation, slides };
});

export async function generateMetadata({
  params,
}: PageProps<"/share/[shareId]">): Promise<Metadata> {
  const { shareId } = await params;
  const shared = await loadSharedPresentation(shareId);

  return {
    title: shared ? `${shared.presentation.title} | Web Slide` : "공유 프레젠테이션 | Web Slide",
    description: "링크로 공유된 읽기 전용 프레젠테이션",
    // 공유 링크는 아는 사람만 열도록 검색엔진에 올리지 않는다.
    robots: { index: false, follow: false },
  };
}

export default async function SharedPresentationPage({ params }: PageProps<"/share/[shareId]">) {
  const { shareId } = await params;
  const shared = await loadSharedPresentation(shareId);

  // 비공개 자료와 없는 링크를 구분해 알려주면 존재 여부가 새어 나간다. 둘 다 404로 처리한다.
  if (!shared) notFound();

  const { presentation, slides } = shared;

  if (slides.length === 0) {
    return (
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-6 p-6"
      >
        <Logo height={20} />
        <EmptyState
          title="아직 슬라이드가 없습니다."
          description={`"${presentation.title}"에 표시할 슬라이드가 없습니다.`}
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="flex min-h-0 flex-1 flex-col">
      <SlidePlayer presentation={presentation} slides={slides} />
    </main>
  );
}
