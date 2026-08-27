import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath, ROUTES } from "@/lib/routes";
import { updateSupabaseSession } from "@/lib/supabase/proxy-session";

/**
 * 리다이렉트 응답에는 갱신된 세션 쿠키가 자동으로 따라가지 않는다.
 * 갱신 결과를 잃지 않도록 쿠키를 그대로 옮겨 담는다.
 */
function redirectKeepingCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return redirectKeepingCookies(loginUrl, response);
  }

  if (user && pathname === ROUTES.login) {
    return redirectKeepingCookies(new URL(ROUTES.presentations, request.url), response);
  }

  return response;
}

export const config = {
  // 정적 자산과 이미지 요청에서는 세션을 갱신할 필요가 없다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
