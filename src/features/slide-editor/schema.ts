import { z } from "zod";
import { isHttpsUrl, normalizeUrlInput } from "@/lib/validation/url";
import { isSlideImagePath } from "@/lib/supabase/storage";
import {
  SLIDE_AUTHOR_MAX_LENGTH,
  SLIDE_CONTENT_URL_MAX_LENGTH,
  SLIDE_HTML_MAX_LENGTH,
  SLIDE_IMAGE_PATH_MAX_LENGTH,
  SLIDE_PAGE_NAME_MAX_LENGTH,
  SLIDE_SUBTITLE_MAX_LENGTH,
  SLIDE_TITLE_MAX_LENGTH,
} from "./constants";

export const slideIdSchema = z.uuid("슬라이드를 찾을 수 없습니다.");
export const slideTemplateSchema = z.enum(
  ["cover", "content", "image", "html"],
  "슬라이드 유형이 올바르지 않습니다.",
);

function textField(max: number, message: string) {
  return z.string(message).trim().max(max, message);
}

/** 빈 문자열은 "URL 없음"을 뜻한다. 값이 있으면 https 주소여야 한다. */
export const slideContentUrlSchema = z
  .string("웹페이지 주소를 확인하세요.")
  .max(SLIDE_CONTENT_URL_MAX_LENGTH, "주소가 너무 깁니다.")
  .transform(normalizeUrlInput)
  .refine(
    (value) => value === "" || isHttpsUrl(value),
    "https로 시작하는 주소만 사용할 수 있습니다.",
  );

/** 슬라이드 편집 폼이 저장하는 값 전체. 자동 저장은 항상 이 모양을 통째로 보낸다. */
export const slideFieldsSchema = z.object({
  title: textField(SLIDE_TITLE_MAX_LENGTH, `제목은 ${SLIDE_TITLE_MAX_LENGTH}자 이하로 입력하세요.`),
  subtitle: textField(
    SLIDE_SUBTITLE_MAX_LENGTH,
    `소제목은 ${SLIDE_SUBTITLE_MAX_LENGTH}자 이하로 입력하세요.`,
  ),
  author: textField(
    SLIDE_AUTHOR_MAX_LENGTH,
    `발표자 이름은 ${SLIDE_AUTHOR_MAX_LENGTH}자 이하로 입력하세요.`,
  ),
  pageName: textField(
    SLIDE_PAGE_NAME_MAX_LENGTH,
    `페이지명은 ${SLIDE_PAGE_NAME_MAX_LENGTH}자 이하로 입력하세요.`,
  ),
  contentUrl: slideContentUrlSchema,
  reloadOnEnter: z.boolean(),
  /** 빈 문자열은 "이미지 없음"을 뜻한다. 값이 있으면 Storage 객체 경로다. */
  imagePath: z
    .string("이미지 경로를 확인하세요.")
    .trim()
    .max(SLIDE_IMAGE_PATH_MAX_LENGTH, "이미지 경로가 너무 깁니다."),
  /** 빈 문자열은 "HTML 없음"을 뜻한다. 내용은 샌드박스 iframe 안에서만 실행된다. */
  htmlSource: z
    .string("HTML을 확인하세요.")
    .max(
      SLIDE_HTML_MAX_LENGTH,
      `HTML은 ${SLIDE_HTML_MAX_LENGTH.toLocaleString()}자 이하로 넣으세요.`,
    ),
});

export const createSlideInputSchema = z.object({
  presentationId: z.uuid("프레젠테이션을 찾을 수 없습니다."),
  template: slideTemplateSchema,
  /** 이 슬라이드 바로 다음에 만든다. 없으면 맨 뒤에 붙인다. */
  afterSlideId: slideIdSchema.nullish(),
});

export const updateSlideInputSchema = z
  .object({
    presentationId: z.uuid("프레젠테이션을 찾을 수 없습니다."),
    slideId: slideIdSchema,
    fields: slideFieldsSchema,
  })
  // 다른 프레젠테이션의 이미지를 가리키지 못하게 한다. Storage RLS와 같은 규칙이다.
  .refine(
    (input) =>
      input.fields.imagePath === "" ||
      isSlideImagePath(input.fields.imagePath, input.presentationId),
    { path: ["fields", "imagePath"], error: "이 프레젠테이션의 이미지가 아닙니다." },
  );

export const deleteSlideInputSchema = z.object({
  presentationId: z.uuid("프레젠테이션을 찾을 수 없습니다."),
  slideId: slideIdSchema,
});

export const reorderSlidesInputSchema = z.object({
  presentationId: z.uuid("프레젠테이션을 찾을 수 없습니다."),
  orderedSlideIds: z.array(slideIdSchema).min(1, "순서를 바꿀 슬라이드가 없습니다."),
});

export type SlideFieldsInput = z.infer<typeof slideFieldsSchema>;
export type CreateSlideInput = z.input<typeof createSlideInputSchema>;
export type UpdateSlideInput = z.input<typeof updateSlideInputSchema>;
export type DeleteSlideInput = z.infer<typeof deleteSlideInputSchema>;
export type ReorderSlidesInput = z.infer<typeof reorderSlidesInputSchema>;
