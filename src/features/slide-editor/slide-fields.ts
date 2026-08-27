import { WEB_VIEWPORT_HEIGHT, WEB_VIEWPORT_WIDTH } from "@/features/slide-renderer";
import { slideImagePublicUrl } from "@/lib/supabase/storage";
import type { Slide, SlideFields } from "@/types/domain";

/** 저장된 슬라이드에서 편집 폼 값을 뽑는다. */
export function toSlideFields(slide: Slide): SlideFields {
  return {
    title: slide.title,
    subtitle: slide.subtitle,
    author: slide.author,
    pageName: slide.pageName,
    contentUrl: slide.content?.url ?? "",
    reloadOnEnter: slide.content?.reloadOnEnter ?? false,
    imagePath: slide.image?.path ?? "",
    htmlSource: slide.html?.source ?? "",
  };
}

/**
 * 편집 폼 값을 슬라이드에 적용한다.
 *
 * 화면은 저장 응답을 기다리지 않고 이 결과로 먼저 그린다.
 * 서버 저장은 같은 값을 그대로 보내므로 결과가 어긋나지 않는다.
 */
export function applySlideFields(slide: Slide, fields: SlideFields): Slide {
  return {
    ...slide,
    title: fields.title,
    subtitle: fields.subtitle,
    author: fields.author,
    pageName: fields.pageName,
    content: fields.contentUrl
      ? {
          type: "website",
          url: fields.contentUrl,
          reloadOnEnter: fields.reloadOnEnter,
          viewport: slide.content?.viewport ?? {
            width: WEB_VIEWPORT_WIDTH,
            height: WEB_VIEWPORT_HEIGHT,
          },
        }
      : null,
    image: fields.imagePath
      ? { path: fields.imagePath, url: slideImagePublicUrl(fields.imagePath) }
      : null,
    html: fields.htmlSource ? { source: fields.htmlSource } : null,
  };
}
