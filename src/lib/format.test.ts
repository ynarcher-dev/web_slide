import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format";

describe("formatDateTime", () => {
  it("ISO 시각을 한국 시간대 기준 문자열로 바꾼다", () => {
    // 2026-08-26T00:04:00Z는 한국 시간으로 같은 날 09:04다.
    expect(formatDateTime("2026-08-26T00:04:00Z")).toBe("2026. 08. 26. 09:04");
  });

  it("자정을 24시가 아닌 00시로 표시한다", () => {
    expect(formatDateTime("2026-08-25T15:00:00Z")).toBe("2026. 08. 26. 00:00");
  });

  it("잘못된 값은 빈 문자열이다", () => {
    expect(formatDateTime("올바르지 않은 값")).toBe("");
  });
});
