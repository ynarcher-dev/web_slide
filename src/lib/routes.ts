/** 애플리케이션 경로를 한곳에서 관리한다. */
export const ROUTES = {
  home: "/",
  login: "/login",
  presentations: "/presentations",
  presentationEdit: (presentationId: string) => `/presentations/${presentationId}/edit`,
  presentationPresent: (presentationId: string) => `/presentations/${presentationId}/present`,
  share: (shareId: string) => `/share/${shareId}`,
} as const;

/**
 * 로그인 화면 주소. `returnTo`를 주면 로그인 후 그 화면으로 되돌아온다.
 *
 * 미들웨어를 두지 않으므로 이 주소는 보호 화면이 직접 만든다.
 */
export function loginUrlFor(returnTo?: string): string {
  if (!returnTo) return ROUTES.login;
  return `${ROUTES.login}?redirectTo=${encodeURIComponent(returnTo)}`;
}

/**
 * 로그인 후 되돌아갈 경로. 외부 도메인으로 나가지 않도록 내부 경로만 허용한다.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
