/** 애플리케이션 경로를 한곳에서 관리한다. */
export const ROUTES = {
  home: "/",
  login: "/login",
  presentations: "/presentations",
  presentationEdit: (presentationId: string) => `/presentations/${presentationId}/edit`,
  presentationPresent: (presentationId: string) => `/presentations/${presentationId}/present`,
  /** PDF 생성용 화면. 사람이 직접 열지는 않고 서버 브라우저가 연다. */
  presentationPdf: (presentationId: string) => `/presentations/${presentationId}/pdf`,
  /** PDF 파일을 내려주는 엔드포인트. */
  presentationPdfDownload: (presentationId: string) =>
    `/presentations/${presentationId}/pdf/download`,
  share: (shareId: string) => `/share/${shareId}`,
} as const;

/** 로그인해야 접근할 수 있는 경로 접두사. */
export const PROTECTED_PATH_PREFIXES = ["/presentations"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 로그인 후 되돌아갈 경로. 외부 도메인으로 나가지 않도록 내부 경로만 허용한다.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
