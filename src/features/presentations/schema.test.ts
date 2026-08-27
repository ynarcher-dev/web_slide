import { describe, expect, it } from "vitest";
import { presentationSettingsSchema, presentationTitleSchema } from "./schema";

const VALID_SETTINGS = {
  brandColor: "#E42317",
  coverTint: 12,
  footerText: "Copyright © 2026 Y&ARCHER",
  showPageNumber: true,
  isPublic: false,
};

describe("presentationTitleSchema", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(presentationTitleSchema.parse("  서비스 소개  ")).toBe("서비스 소개");
  });

  it("공백만 있는 제목은 거부한다", () => {
    const result = presentationTitleSchema.safeParse("   ");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("제목을 입력하세요.");
  });

  it("120자를 넘는 제목은 거부한다", () => {
    expect(presentationTitleSchema.safeParse("가".repeat(121)).success).toBe(false);
  });
});

describe("presentationSettingsSchema", () => {
  it("올바른 설정을 통과시킨다", () => {
    expect(presentationSettingsSchema.parse(VALID_SETTINGS)).toEqual(VALID_SETTINGS);
  });

  it("폼에서 온 tint 문자열을 숫자로 바꾼다", () => {
    const parsed = presentationSettingsSchema.parse({ ...VALID_SETTINGS, coverTint: "40" });
    expect(parsed.coverTint).toBe(40);
  });

  it("범위를 벗어난 tint를 거부한다", () => {
    expect(
      presentationSettingsSchema.safeParse({ ...VALID_SETTINGS, coverTint: 101 }).success,
    ).toBe(false);
    expect(presentationSettingsSchema.safeParse({ ...VALID_SETTINGS, coverTint: -1 }).success).toBe(
      false,
    );
  });

  it("#RRGGBB 형식이 아닌 브랜드 색상을 거부한다", () => {
    const result = presentationSettingsSchema.safeParse({ ...VALID_SETTINGS, brandColor: "red" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("브랜드 색상은 #RRGGBB 형식이어야 합니다.");
  });
});
