import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PdfDocument } from "@/features/pdf-export/components/pdf-document";
import { getPresentationById } from "@/features/presentations/data/presentation-repository";
import { presentationIdSchema } from "@/features/presentations/schema";
import { listSlides } from "@/features/slide-editor/data/slide-repository";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PDF 내보내기 | Web Slide",
  description: "PDF로 인쇄하기 위한 슬라이드 화면",
  robots: { index: false, follow: false },
};

/**
 * PDF 전용 렌더링 화면.
 *
 * 서버의 Playwright가 사용자의 세션 쿠키를 그대로 들고 이 주소를 연다.
 * 그래서 다른 화면과 똑같이 로그인과 소유자 확인을 다시 한다.
 */
export default async function PresentationPdfPage({
  params,
}: PageProps<"/presentations/[presentationId]/pdf">) {
  const { presentationId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  if (!presentationIdSchema.safeParse(presentationId).success) notFound();

  const supabase = await createSupabaseServerClient();
  const presentation = await getPresentationById(supabase, presentationId, user.id);
  if (!presentation) notFound();

  const slides = await listSlides(supabase, presentation.id);
  // 빈 PDF를 만들 이유가 없다. 내보내기 요청 단계에서도 같은 조건을 확인한다.
  if (slides.length === 0) notFound();

  return (
    <main id="main-content">
      <PdfDocument presentation={presentation} slides={slides} />
    </main>
  );
}
