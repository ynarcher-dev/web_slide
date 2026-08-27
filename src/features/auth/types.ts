import type { CredentialField } from "./schema";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  /** 폼 전체에 대한 안내 또는 오류 메시지. */
  message?: string;
  fieldErrors?: Partial<Record<CredentialField, string>>;
};

export const IDLE_AUTH_FORM_STATE: AuthFormState = { status: "idle" };
