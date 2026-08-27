"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPresentationById } from "@/features/presentations/data/presentation-repository";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  deleteSlide,
  insertSlide,
  listSlides,
  reorderSlides,
  updateSlideFields,
} from "../data/slide-repository";
import { removeSlideImageByPath } from "../data/slide-image-cleanup";
import { hasSameMembers, insertAfter } from "../ordering";
import {
  createSlideInputSchema,
  deleteSlideInputSchema,
  reorderSlidesInputSchema,
  updateSlideInputSchema,
  type CreateSlideInput,
  type DeleteSlideInput,
  type ReorderSlidesInput,
  type UpdateSlideInput,
} from "../schema";
import type { SlideListResult, SlideSaveResult } from "../types";

/**
 * Server Action은 화면을 거치지 않고 직접 호출될 수 있다.
 * 그래서 모든 액션이 로그인 여부를 확인하고, 프레젠테이션 소유권을 다시 확인한 뒤에만 슬라이드를 건드린다.
 */

const NOT_FOUND_MESSAGE = "프레젠테이션을 찾을 수 없거나 권한이 없습니다.";

async function requireSession() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

function failure(error: unknown): { status: "error"; message: string } {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
  };
}

function invalid(message: string): { status: "error"; message: string } {
  return { status: "error", message };
}

export async function createSlideAction(input: CreateSlideInput): Promise<SlideListResult> {
  const parsed = createSlideInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);

  const { presentationId, template, afterSlideId } = parsed.data;
  const { user, supabase } = await requireSession();

  try {
    const presentation = await getPresentationById(supabase, presentationId, user.id);
    if (!presentation) return invalid(NOT_FOUND_MESSAGE);

    const existing = await listSlides(supabase, presentationId);
    // 일단 맨 뒤에 만든 뒤, 원하는 위치로 순서를 다시 매긴다.
    const created = await insertSlide(supabase, presentationId, template, existing.length);
    const orderedIds = insertAfter(
      existing.map((slide) => slide.id),
      created.id,
      afterSlideId ?? null,
    );
    await reorderSlides(supabase, presentationId, orderedIds);

    const slides = await listSlides(supabase, presentationId);
    revalidatePath(ROUTES.presentationEdit(presentationId));
    return { status: "success", slides, createdSlideId: created.id };
  } catch (error) {
    return failure(error);
  }
}

export async function updateSlideAction(input: UpdateSlideInput): Promise<SlideSaveResult> {
  const parsed = updateSlideInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);

  const { presentationId, slideId, fields } = parsed.data;
  const { user, supabase } = await requireSession();

  try {
    const presentation = await getPresentationById(supabase, presentationId, user.id);
    if (!presentation) return invalid(NOT_FOUND_MESSAGE);

    const updated = await updateSlideFields(supabase, presentationId, slideId, fields);
    if (!updated) return invalid("슬라이드를 찾을 수 없습니다.");

    return { status: "success" };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteSlideAction(input: DeleteSlideInput): Promise<SlideListResult> {
  const parsed = deleteSlideInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);

  const { presentationId, slideId } = parsed.data;
  const { user, supabase } = await requireSession();

  try {
    const presentation = await getPresentationById(supabase, presentationId, user.id);
    if (!presentation) return invalid(NOT_FOUND_MESSAGE);

    // 지우기 전에 이미지 경로를 확인해 둔다. 행이 사라지면 어떤 파일이었는지 알 수 없다.
    const removedImagePath =
      (await listSlides(supabase, presentationId)).find((slide) => slide.id === slideId)?.image
        ?.path ?? null;

    const deleted = await deleteSlide(supabase, presentationId, slideId);
    if (!deleted) return invalid("슬라이드를 찾을 수 없습니다.");

    await removeSlideImageByPath(supabase, removedImagePath);

    // 남은 슬라이드의 페이지 번호가 이어지도록 순서를 다시 매긴다.
    const remaining = await listSlides(supabase, presentationId);
    if (remaining.length > 0) {
      await reorderSlides(
        supabase,
        presentationId,
        remaining.map((slide) => slide.id),
      );
    }

    revalidatePath(ROUTES.presentationEdit(presentationId));
    return {
      status: "success",
      slides: remaining.map((slide, index) => ({ ...slide, sortOrder: index })),
    };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderSlidesAction(input: ReorderSlidesInput): Promise<SlideListResult> {
  const parsed = reorderSlidesInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);

  const { presentationId, orderedSlideIds } = parsed.data;
  const { user, supabase } = await requireSession();

  try {
    const presentation = await getPresentationById(supabase, presentationId, user.id);
    if (!presentation) return invalid(NOT_FOUND_MESSAGE);

    const current = await listSlides(supabase, presentationId);
    // 목록 일부만 담긴 요청으로 다른 슬라이드의 순서가 뒤섞이지 않게 한다.
    if (
      !hasSameMembers(
        current.map((slide) => slide.id),
        orderedSlideIds,
      )
    ) {
      return invalid("슬라이드 목록이 바뀌었습니다. 화면을 새로고침한 뒤 다시 시도하세요.");
    }

    await reorderSlides(supabase, presentationId, orderedSlideIds);

    const slides = await listSlides(supabase, presentationId);
    revalidatePath(ROUTES.presentationEdit(presentationId));
    return { status: "success", slides };
  } catch (error) {
    return failure(error);
  }
}
