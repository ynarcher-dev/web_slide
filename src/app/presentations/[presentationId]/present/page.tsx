import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { getPresentationById } from "@/features/presentations/data/presentation-repository";
import { presentationIdSchema } from "@/features/presentations/schema";
import { listSlides } from "@/features/slide-editor/data/slide-repository";
import { SlidePlayer } from "@/features/slide-player/components/slide-player";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "발표 | Web Slide",
  description: "전체화면으로 슬라이드를 발표하는 화면",
};

export default async function PresentationPresentPage({
  params,
}: PageProps<"/presentations/[presentationId]/present">) {
  const { presentationId } = await params;

  // proxy가 먼저 막지만, 서버에서도 다시 확인해 두 겹으로 보호한다.
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  // 잘못된 형식의 주소로 DB를 조회하지 않는다.
  if (!presentationIdSchema.safeParse(presentationId).success) notFound();

  const supabase = await createSupabaseServerClient();
  const presentation = await getPresentationById(supabase, presentationId, user.id);
  if (!presentation) notFound();

  const slides = await listSlides(supabase, presentation.id);
  const editHref = ROUTES.presentationEdit(presentation.id);

  if (slides.length === 0) {
    return (
      <main id="main-content" className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          title="발표할 슬라이드가 없습니다."
          description="편집 화면에서 표지나 본문 슬라이드를 먼저 만드세요."
          action={
            <Link
              href={editHref}
              className="rounded-control bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              편집 화면으로 이동
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="flex min-h-0 flex-1 flex-col">
      <SlidePlayer presentation={presentation} slides={slides} exitHref={editHref} />
    </main>
  );
}
