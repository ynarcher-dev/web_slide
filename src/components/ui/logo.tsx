import Image from "next/image";
import { cn } from "@/lib/cn";

/** 원본 SVG viewBox 기준 가로세로 비율. */
export const LOGO_ASPECT_RATIO = 359 / 71;

const LOGO_SRC = "/brand/ynarcher-logo-horizontal.svg";

type LogoProps = {
  /** 표시 높이(px). 너비는 원본 비율로 계산한다. */
  height?: number;
  /** 주변에 이미 브랜드명이 있어 로고가 장식일 때 true로 둔다. */
  decorative?: boolean;
  className?: string;
};

/**
 * Y&ARCHER 고정 로고. 사용자가 업로드하거나 교체하지 않는다.
 *
 * 벡터라 재압축할 이유가 없고, 서버 PDF 생성에서도 원본 그대로 필요하므로
 * 이미지 최적화를 거치지 않고 정적 자산을 그대로 사용한다.
 */
export function Logo({ height = 24, decorative = false, className }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt={decorative ? "" : "Y&ARCHER"}
      width={Math.round(height * LOGO_ASPECT_RATIO)}
      height={height}
      unoptimized
      priority
      className={cn("select-none", className)}
    />
  );
}
