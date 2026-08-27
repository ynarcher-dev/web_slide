"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES, safeRedirectPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { credentialsSchema } from "../schema";
import type { AuthFormState } from "../types";

/** Supabase가 돌려주는 영문 메시지를 사용자에게 보여줄 한국어 문구로 바꾼다. */
function toKoreanAuthMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (/email not confirmed/i.test(message)) {
    return "이메일 확인이 아직 끝나지 않았습니다. 받은 메일의 링크를 먼저 열어 주세요.";
  }
  if (/user already registered/i.test(message)) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (/rate limit|too many requests/i.test(message)) {
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  }
  return `인증에 실패했습니다. (${message})`;
}

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): AuthFormState {
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field === "email" || field === "password") {
      fieldErrors[field] ??= issue.message;
    }
  }
  return { status: "error", fieldErrors };
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return toFieldErrors(parsed.error.issues);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: toKoreanAuthMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirectTo")?.toString(), ROUTES.presentations));
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return toFieldErrors(parsed.error.issues);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { status: "error", message: toKoreanAuthMessage(error.message) };
  }

  // 이메일 확인이 켜져 있으면 세션이 바로 생기지 않는다.
  if (!data.session) {
    return {
      status: "success",
      message: "확인 메일을 보냈습니다. 메일의 링크를 연 뒤 로그인해 주세요.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("redirectTo")?.toString(), ROUTES.presentations));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect(ROUTES.login);
}
