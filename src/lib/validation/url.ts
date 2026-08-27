/**
 * 슬라이드 웹페이지 URL 검증.
 *
 * 제품 전제상 iframe 삽입이 허용된 웹페이지만 사용한다.
 * 브라우저가 https 문서 안에서 http 콘텐츠를 막으므로 https만 허용한다.
 */

/** 사용자가 붙여 넣은 값을 다듬는다. 스킴이 없으면 https를 붙여 준다. */
export function normalizeUrlInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  return url.protocol === "https:" && url.hostname.length > 0;
}
