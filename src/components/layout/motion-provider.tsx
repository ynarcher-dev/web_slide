"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * 사용자의 `prefers-reduced-motion` 설정을 Motion 애니메이션 전체에 반영한다.
 * CSS 전환은 `src/styles/base.css`의 미디어 쿼리에서 함께 처리한다.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
