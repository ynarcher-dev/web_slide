import { describe, expect, it } from "vitest";
import { toHtmlSlideDocument } from "./html-document";

describe("toHtmlSlideDocument", () => {
  it("조각을 붙여 넣으면 기본 문서로 감싼다", () => {
    const document = toHtmlSlideDocument("<p>차트</p>");

    expect(document).toContain("<!doctype html>");
    // 조각이 슬라이드 영역을 꽉 채우도록 기본 여백과 높이를 정해 준다.
    expect(document).toContain("html, body { height: 100%; margin: 0; }");
    expect(document).toContain("<p>차트</p>");
  });

  it("완성된 문서는 그대로 둔다", () => {
    const source = "<html><body><p>차트</p></body></html>";

    expect(toHtmlSlideDocument(source)).toBe(source);
  });

  it("doctype이 앞에 붙은 문서도 그대로 둔다", () => {
    const source = '<!doctype html>\n<html lang="en"><body>차트</body></html>';

    expect(toHtmlSlideDocument(source)).toBe(source);
  });
});
