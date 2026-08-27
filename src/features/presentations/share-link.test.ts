import { describe, expect, it } from "vitest";
import { buildShareUrl } from "./share-link";

describe("buildShareUrl", () => {
  const shareId = "11111111-2222-3333-4444-555555555555";

  it("주어진 origin 뒤에 공유 경로를 붙인다", () => {
    expect(buildShareUrl(shareId, "https://slide.example.com")).toBe(
      `https://slide.example.com/share/${shareId}`,
    );
  });

  it("origin 끝의 슬래시를 정리한다", () => {
    expect(buildShareUrl(shareId, "https://slide.example.com///")).toBe(
      `https://slide.example.com/share/${shareId}`,
    );
  });

  it("origin을 주지 않으면 환경 변수의 사이트 주소를 사용한다", () => {
    expect(buildShareUrl(shareId)).toMatch(new RegExp(`^https?://.+/share/${shareId}$`));
  });
});
