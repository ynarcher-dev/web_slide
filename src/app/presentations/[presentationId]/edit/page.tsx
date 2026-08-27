import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/require-user";
import { getPresentationById } from "@/features/presentations/data/presentation-repository";
import { presentationIdSchema } from "@/features/presentations/schema";
import { listSlides } from "@/features/slide-editor/data/slide-repository";
import { SlideEditorWorkspace } from "@/features/slide-editor/components/slide-editor-workspace";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "프레젠테이션 편집 | Web Slide",
  description: "슬라이드를 만들고 수정하는 편집 화면",
};

export default async function PresentationEditPage({
  params,
}: PageProps<"/presentations/[presentationId]/edit">) {
  const { presentationId } = await params;

  const user = await requireUser(ROUTES.presentationEdit(presentationId));

  // 잘못된 형식의 주소로 DB를 조회하지 않는다.
  if (!presentationIdSchema.safeParse(presentationId).success) notFound();

  const supabase = await createSupabaseServerClient();
  const presentation = await getPresentationById(supabase, presentationId, user.id);
  if (!presentation) notFound();

  const slides = await listSlides(supabase, presentation.id);

  return (
    <main id="main-content" className="flex min-h-0 flex-1 flex-col">
      <SlideEditorWorkspace presentation={presentation} initialSlides={slides} />
    </main>
  );
}
