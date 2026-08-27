/** 공통 설정 폼과 제목 폼에서 오류를 붙일 수 있는 필드. */
export type PresentationField = "title" | "brandColor" | "coverTint" | "footerText";

export type PresentationActionState = {
  status: "idle" | "error" | "success";
  /** 폼 전체에 대한 안내 또는 오류 메시지. */
  message?: string;
  fieldErrors?: Partial<Record<PresentationField, string>>;
};

export const IDLE_PRESENTATION_ACTION_STATE: PresentationActionState = { status: "idle" };
