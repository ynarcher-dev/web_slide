/**
 * 붙여 넣은 HTML을 iframe에 넣을 문서로 만든다.
 *
 * 조각만 붙여 넣는 경우가 대부분이라 그대로 넣으면 기본 여백이 남고 `height: 100%`도 듣지 않는다.
 * 그래서 최소한의 기본 문서로 감싸 슬라이드 영역을 꽉 채우게 한다.
 * 이미 완성된 문서를 붙여 넣었다면 손대지 않는다. 안쪽 설정을 덮어쓰면 의도가 어긋나기 때문이다.
 */
export function toHtmlSlideDocument(source: string): string {
  if (/<html[\s>]/i.test(source)) return source;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
  html, body { height: 100%; margin: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
</style>
</head>
<body>${source}</body>
</html>`;
}
