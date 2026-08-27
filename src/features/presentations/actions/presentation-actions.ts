"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  deletePresentation,
  getPresentationById,
  insertPresentation,
  updatePresentationSettings,
  updatePresentationTitle,
} from "../data/presentation-repository";
import {
  presentationIdSchema,
  presentationSettingsSchema,
  presentationThemeSchema,
  presentationTitleSchema,
} from "../schema";
import { removePresentationImages } from "@/features/slide-editor/data/slide-image-cleanup";
import type { PresentationActionState, PresentationField } from "../types";

/**
 * Server Action은 UI를 거치지 않고 직접 호출될 수 있다.
 * 그래서 모든 액션이 로그인 여부를 먼저 확인하고, 데이터 접근도 소유자로 좁힌다.
 */

const NOT_FOUND_STATE: PresentationActionState = {
  status: "error",
  message: "프레젠테이션을 찾을 수 없거나 권한이 없습니다.",
};

async function requireSession() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

function fieldError(field: PresentationField, message: string): PresentationActionState {
  return { status: "error", fieldErrors: { [field]: message } };
}

function toFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): PresentationActionState {
  const fieldErrors: PresentationActionState["fieldErrors"] = {};
  let message: string | undefined;

  for (const issue of issues) {
    const field = issue.path[0];
    if (field === "brandColor" || field === "coverTint" || field === "footerText") {
      fieldErrors[field] ??= issue.message;
    } else {
      message ??= issue.message;
    }
  }

  return { status: "error", fieldErrors, message };
}

function failure(error: unknown): PresentationActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
  };
}

function readPresentationId(formData: FormData) {
  return presentationIdSchema.safeParse(formData.get("presentationId"));
}

export async function createPresentationAction(
  _previous: PresentationActionState,
  formData: FormData,
): Promise<PresentationActionState> {
  const parsedTitle = presentationTitleSchema.safeParse(formData.get("title"));
  if (!parsedTitle.success) return fieldError("title", parsedTitle.error.issues[0].message);

  const { user, supabase } = await requireSession();

  let created;
  try {
    created = await insertPresentation(supabase, user.id, parsedTitle.data);
  } catch (error) {
    return failure(error);
  }

  revalidatePath(ROUTES.presentations);
  // 만들자마자 편집을 이어갈 수 있도록 편집 화면으로 보낸다.
  redirect(ROUTES.presentationEdit(created.id));
}

export async function renamePresentationAction(
  _previous: PresentationActionState,
  formData: FormData,
): Promise<PresentationActionState> {
  const parsedId = readPresentationId(formData);
  if (!parsedId.success) return NOT_FOUND_STATE;

  const parsedTitle = presentationTitleSchema.safeParse(formData.get("title"));
  if (!parsedTitle.success) return fieldError("title", parsedTitle.error.issues[0].message);

  const { user, supabase } = await requireSession();

  try {
    const updated = await updatePresentationTitle(
      supabase,
      parsedId.data,
      user.id,
      parsedTitle.data,
    );
    if (!updated) return NOT_FOUND_STATE;
  } catch (error) {
    return failure(error);
  }

  revalidatePath(ROUTES.presentations);
  revalidatePath(ROUTES.presentationEdit(parsedId.data));
  return { status: "success", message: "제목을 저장했습니다." };
}

export async function updatePresentationSettingsAction(
  _previous: PresentationActionState,
  formData: FormData,
): Promise<PresentationActionState> {
  const parsedId = readPresentationId(formData);
  if (!parsedId.success) return NOT_FOUND_STATE;

  const parsedSettings = presentationSettingsSchema.safeParse({
    brandColor: formData.get("brandColor"),
    coverTint: formData.get("coverTint"),
    footerText: formData.get("footerText") ?? "",
    // 체크되지 않은 체크박스는 FormData에 담기지 않는다.
    showPageNumber: formData.get("showPageNumber") !== null,
    isPublic: formData.get("isPublic") !== null,
  });
  if (!parsedSettings.success) return toFieldErrors(parsedSettings.error.issues);

  const { user, supabase } = await requireSession();

  try {
    const updated = await updatePresentationSettings(
      supabase,
      parsedId.data,
      user.id,
      parsedSettings.data,
    );
    if (!updated) return NOT_FOUND_STATE;
  } catch (error) {
    return failure(error);
  }

  revalidatePath(ROUTES.presentations);
  revalidatePath(ROUTES.presentationEdit(parsedId.data));
  return { status: "success", message: "설정을 저장했습니다." };
}

export async function deletePresentationAction(
  _previous: PresentationActionState,
  formData: FormData,
): Promise<PresentationActionState> {
  const parsedId = readPresentationId(formData);
  if (!parsedId.success) return NOT_FOUND_STATE;

  const { user, supabase } = await requireSession();

  try {
    // 슬라이드 이미지는 DB에 딸려 사라지지 않는다. 소유권을 확인할 수 있는 지금 함께 지운다.
    await removePresentationImages(supabase, parsedId.data);

    const deleted = await deletePresentation(supabase, parsedId.data, user.id);
    if (!deleted) return NOT_FOUND_STATE;
  } catch (error) {
    return failure(error);
  }

  revalidatePath(ROUTES.presentations);
  return { status: "success", message: "프레젠테이션을 삭제했습니다." };
}

/**
 * 표지 배경 tint만 저장한다.
 *
 * 편집 화면의 표지 속성 패널에서 슬라이더를 움직이는 동안 자동 저장으로 호출된다.
 * 나머지 공통 설정 값은 서버에서 읽어 그대로 유지한다.
 */
export async function updateCoverTintAction(input: {
  presentationId: string;
  coverTint: number;
}): Promise<PresentationActionState> {
  const parsedId = presentationIdSchema.safeParse(input.presentationId);
  if (!parsedId.success) return NOT_FOUND_STATE;

  const parsedTint = presentationThemeSchema.shape.coverTint.safeParse(input.coverTint);
  if (!parsedTint.success) return fieldError("coverTint", parsedTint.error.issues[0].message);

  const { user, supabase } = await requireSession();

  try {
    const presentation = await getPresentationById(supabase, parsedId.data, user.id);
    if (!presentation) return NOT_FOUND_STATE;

    const updated = await updatePresentationSettings(supabase, parsedId.data, user.id, {
      ...presentation.theme,
      coverTint: parsedTint.data,
      isPublic: presentation.isPublic,
    });
    if (!updated) return NOT_FOUND_STATE;
  } catch (error) {
    return failure(error);
  }

  revalidatePath(ROUTES.presentations);
  return { status: "success", message: "표지 tint를 저장했습니다." };
}
