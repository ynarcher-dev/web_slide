import type { CSSProperties } from "react";
import type { PresentationTheme } from "@/types/domain";
import { MAX_COVER_TINT_ALPHA } from "./constants";

/**
 * 프레젠테이션 공통 테마를 슬라이드 CSS 변수로 바꾼다.
 *
 * 표지 tint는 `color-mix` 대신 값을 직접 계산한다.
 * 편집 화면, 발표 화면, 서버 PDF에서 같은 색이 나와야 하기 때문이다.
 */

type Rgb = { r: number; g: number; b: number };

export function parseHexColor(value: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;

  const int = Number.parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** 흰 배경 위에 색을 alpha만큼 얹었을 때의 불투명한 결과 색. */
export function blendWithWhite(color: string, alpha: number): string {
  const rgb = parseHexColor(color);
  const ratio = Math.min(Math.max(alpha, 0), 1);
  if (!rgb) return "#ffffff";

  return toHex({
    r: Math.round(255 + (rgb.r - 255) * ratio),
    g: Math.round(255 + (rgb.g - 255) * ratio),
    b: Math.round(255 + (rgb.b - 255) * ratio),
  });
}

/** 표지 배경색. tint 0은 흰색, 100은 브랜드 색상을 가장 진하게 적용한 값이다. */
export function coverBackgroundColor(brandColor: string, coverTint: number): string {
  const tint = Math.min(Math.max(coverTint, 0), 100);
  return blendWithWhite(brandColor, (tint / 100) * MAX_COVER_TINT_ALPHA);
}

export function slideThemeStyle(theme: PresentationTheme): CSSProperties {
  return {
    "--slide-accent": theme.brandColor,
    "--slide-cover-background": coverBackgroundColor(theme.brandColor, theme.coverTint),
  } as CSSProperties;
}
