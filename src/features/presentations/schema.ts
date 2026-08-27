import { z } from "zod";

/** 제목은 목록과 편집 화면 상단에 그대로 노출되므로 길이를 제한한다. */
export const presentationTitleSchema = z
  .string("제목을 입력하세요.")
  .trim()
  .min(1, "제목을 입력하세요.")
  .max(120, "제목은 120자 이하로 입력하세요.");

export const presentationIdSchema = z.uuid("프레젠테이션을 찾을 수 없습니다.");

export const presentationThemeSchema = z.object({
  brandColor: z
    .string("브랜드 색상을 선택하세요.")
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "브랜드 색상은 #RRGGBB 형식이어야 합니다."),
  coverTint: z.coerce
    .number("표지 tint는 숫자로 입력하세요.")
    .int("표지 tint는 정수로 입력하세요.")
    .min(0, "표지 tint는 0 이상이어야 합니다.")
    .max(100, "표지 tint는 100 이하여야 합니다."),
  footerText: z
    .string("푸터 텍스트를 확인하세요.")
    .trim()
    .max(120, "푸터 텍스트는 120자 이하로 입력하세요."),
  showPageNumber: z.boolean(),
});

/** 공통 설정 저장 요청. 테마 값과 공개 여부를 한 번에 저장한다. */
export const presentationSettingsSchema = presentationThemeSchema.extend({
  isPublic: z.boolean(),
});

export type PresentationTitleInput = z.infer<typeof presentationTitleSchema>;
export type PresentationSettingsInput = z.infer<typeof presentationSettingsSchema>;

/** 공유 링크의 공개 식별자. `presentations.share_id`와 같은 uuid 형식이다. */
export const shareIdSchema = z.uuid("공유 링크를 찾을 수 없습니다.");
