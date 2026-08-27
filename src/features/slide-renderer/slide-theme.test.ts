import { describe, expect, it } from "vitest";
import {
  blendWithWhite,
  coverBackgroundColor,
  parseHexColor,
  slideThemeStyle,
} from "./slide-theme";

describe("parseHexColor", () => {
  it("#RRGGBB만 인식한다", () => {
    expect(parseHexColor("#E42317")).toEqual({ r: 228, g: 35, b: 23 });
    expect(parseHexColor("E42317")).toBeNull();
    expect(parseHexColor("#fff")).toBeNull();
  });
});

describe("blendWithWhite", () => {
  it("alpha 0은 흰색, 1은 원래 색이다", () => {
    expect(blendWithWhite("#e42317", 0)).toBe("#ffffff");
    expect(blendWithWhite("#e42317", 1)).toBe("#e42317");
  });

  it("잘못된 색은 흰색으로 처리한다", () => {
    expect(blendWithWhite("red", 0.5)).toBe("#ffffff");
  });
});

describe("coverBackgroundColor", () => {
  it("tint 0은 흰색이다", () => {
    expect(coverBackgroundColor("#e42317", 0)).toBe("#ffffff");
  });

  it("tint가 커질수록 브랜드 색에 가까워진다", () => {
    const light = coverBackgroundColor("#e42317", 20);
    const strong = coverBackgroundColor("#e42317", 100);

    expect(light).not.toBe("#ffffff");
    expect(strong).not.toBe(light);
  });

  it("범위를 벗어난 값은 0과 100으로 맞춘다", () => {
    expect(coverBackgroundColor("#e42317", -50)).toBe(coverBackgroundColor("#e42317", 0));
    expect(coverBackgroundColor("#e42317", 500)).toBe(coverBackgroundColor("#e42317", 100));
  });
});

describe("slideThemeStyle", () => {
  it("브랜드 색과 표지 배경을 CSS 변수로 준다", () => {
    const style = slideThemeStyle({
      brandColor: "#e42317",
      coverTint: 100,
      footerText: "",
      showPageNumber: true,
    }) as Record<string, string>;

    expect(style["--slide-accent"]).toBe("#e42317");
    expect(style["--slide-cover-background"]).toBe(coverBackgroundColor("#e42317", 100));
  });
});
