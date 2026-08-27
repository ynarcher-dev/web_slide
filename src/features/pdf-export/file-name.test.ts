import { describe, expect, it } from "vitest";
import { pdfContentDisposition, pdfFileName } from "./file-name";

describe("pdfFileName", () => {
  it("제목을 그대로 파일 이름으로 쓴다", () => {
    expect(pdfFileName("서비스 소개")).toBe("서비스 소개.pdf");
  });

  it("파일 이름에 쓸 수 없는 문자를 정리한다", () => {
    expect(pdfFileName("2026/07 보고: 초안?")).toBe("2026 07 보고 초안.pdf");
  });

  it("정리 후 남는 글자가 없으면 기본 이름을 쓴다", () => {
    expect(pdfFileName("///")).toBe("presentation.pdf");
  });
});

describe("pdfContentDisposition", () => {
  it("한글 이름을 UTF-8로 인코딩해 함께 넣는다", () => {
    const header = pdfContentDisposition("서비스 소개");

    expect(header).toContain("attachment;");
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent("서비스 소개.pdf")}`);
  });

  it("옛 브라우저용 이름에는 ASCII만 남긴다", () => {
    const header = pdfContentDisposition("서비스 소개");
    const plain = /filename="([^"]+)"/.exec(header)?.[1] ?? "";

    expect(plain).toMatch(/^[\x20-\x7e]+$/);
    expect(plain.endsWith(".pdf")).toBe(true);
  });
});
