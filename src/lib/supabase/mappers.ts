import { slideImagePublicUrl } from "@/lib/supabase/storage";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import type {
  Presentation,
  PresentationSettings,
  Slide,
  SlideFields,
  SlideTemplate,
  UserProfile,
} from "@/types/domain";

/**
 * DB 행(snake_case)과 도메인 타입(camelCase) 사이의 유일한 변환 지점이다.
 * 다른 곳에서 DB 행 모양을 그대로 들고 다니지 않는다.
 */

export function toUserProfile(row: Tables<"profiles">): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
  };
}

export function toPresentation(row: Tables<"presentations">): Presentation {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    theme: {
      brandColor: row.brand_color,
      coverTint: row.cover_tint,
      footerText: row.footer_text,
      showPageNumber: row.show_page_number,
    },
    isPublic: row.is_public,
    shareId: row.share_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSlide(row: Tables<"slides">): Slide {
  return {
    id: row.id,
    presentationId: row.presentation_id,
    template: row.template,
    sortOrder: row.sort_order,
    title: row.title,
    subtitle: row.subtitle,
    author: row.author,
    pageName: row.page_name,
    content: row.content_url
      ? {
          type: "website",
          url: row.content_url,
          reloadOnEnter: row.reload_on_enter,
          viewport: {
            width: row.viewport_width,
            height: row.viewport_height,
          },
        }
      : null,
    image: row.image_path
      ? { path: row.image_path, url: slideImagePublicUrl(row.image_path) }
      : null,
    html: row.html_content ? { source: row.html_content } : null,
  };
}

/** 공통 설정 저장 요청을 DB 컬럼 모양으로 바꾼다. */
export function toPresentationSettingsUpdate(
  settings: PresentationSettings,
): TablesUpdate<"presentations"> {
  return {
    brand_color: settings.brandColor,
    cover_tint: settings.coverTint,
    footer_text: settings.footerText,
    show_page_number: settings.showPageNumber,
    is_public: settings.isPublic,
  };
}

/** 새 슬라이드의 기본 행. 텍스트와 URL은 비운 상태로 만든다. */
export function toNewSlideInsert(
  presentationId: string,
  template: SlideTemplate,
  sortOrder: number,
): TablesInsert<"slides"> {
  return {
    presentation_id: presentationId,
    template,
    sort_order: sortOrder,
  };
}

/** 슬라이드 편집 폼의 값을 DB 컬럼 모양으로 바꾼다. */
export function toSlideFieldsUpdate(fields: SlideFields): TablesUpdate<"slides"> {
  return {
    title: fields.title,
    subtitle: fields.subtitle,
    author: fields.author,
    page_name: fields.pageName,
    content_url: fields.contentUrl === "" ? null : fields.contentUrl,
    reload_on_enter: fields.reloadOnEnter,
    image_path: fields.imagePath === "" ? null : fields.imagePath,
    html_content: fields.htmlSource === "" ? null : fields.htmlSource,
  };
}
