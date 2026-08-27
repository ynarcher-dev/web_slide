import type { Slide } from "@/types/domain";

/** 목록이 바뀌는 동작(만들기, 삭제, 순서 변경)의 결과. 최신 목록을 함께 돌려준다. */
export type SlideListResult =
  | { status: "success"; slides: Slide[]; createdSlideId?: string }
  | { status: "error"; message: string };

/** 자동 저장 결과. 화면은 자기 입력값을 그대로 유지하므로 목록을 돌려주지 않는다. */
export type SlideSaveResult = { status: "success" } | { status: "error"; message: string };

/** 자동 저장 표시 상태. */
export type SaveStatus = "idle" | "saving" | "saved" | "error";
