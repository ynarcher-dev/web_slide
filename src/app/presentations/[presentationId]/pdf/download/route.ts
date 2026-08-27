import type { NextRequest } from "next/server";
import { pdfContentDisposition } from "@/features/pdf-export/file-name";
import { PdfExportError, renderPresentationPdf } from "@/features/pdf-export/pdf-generator";
import { getPresentationById } from "@/features/presentations/data/presentation-repository";
import { presentationIdSchema } from "@/features/presentations/schema";
import { listSlides } from "@/features/slide-editor/data/slide-repository";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * 프레젠테이션을 PDF로 내려준다.
 *
 * 생성 결과는 파일로 저장하지 않고 응답 본문으로만 보낸다.
 * Playwright 실행에 Node API가 필요하고 시간이 걸리므로 런타임과 제한 시간을 지정한다.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function errorResponse(status: number, message: string) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/presentations/[presentationId]/pdf/download">,
) {
  const { presentationId } = await context.params;

  // 라우트 핸들러는 화면을 거치지 않고 호출될 수 있으므로 여기서도 권한을 확인한다.
  const user = await getCurrentUser();
  if (!user) return errorResponse(401, "로그인이 필요합니다.");

  if (!presentationIdSchema.safeParse(presentationId).success) {
    return errorResponse(404, "프레젠테이션을 찾을 수 없거나 권한이 없습니다.");
  }

  const supabase = await createSupabaseServerClient();
  const presentation = await getPresentationById(supabase, presentationId, user.id);
  if (!presentation) return errorResponse(404, "프레젠테이션을 찾을 수 없거나 권한이 없습니다.");

  const slides = await listSlides(supabase, presentation.id);
  if (slides.length === 0) return errorResponse(400, "내보낼 슬라이드가 없습니다.");

  try {
    const pdf = await renderPresentationPdf({
      // 서버가 자기 자신을 열기 때문에 요청이 들어온 주소를 그대로 쓴다.
      url: `${request.nextUrl.origin}${ROUTES.presentationPdf(presentation.id)}`,
      cookies: request.cookies.getAll().map(({ name, value }) => ({ name, value })),
    });

    return new Response(new Blob([pdf], { type: "application/pdf" }), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfContentDisposition(presentation.title),
        // 임시 결과물이므로 어디에도 보관하지 않는다.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // 자세한 원인은 서버 로그로만 남기고, 사용자에게는 알아볼 수 있는 문구만 보여준다.
    console.error("PDF를 만들지 못했습니다.", error);
    return errorResponse(
      500,
      error instanceof PdfExportError
        ? error.message
        : "PDF를 만들지 못했습니다. 잠시 후 다시 시도하세요.",
    );
  }
}
