import type { Slide, SlideTemplate } from "@/types/domain";

/** 목록과 접근성 이름에 쓸 슬라이드 표시 이름. 비어 있으면 안내 문구를 대신 쓴다. */
export function slideDisplayTitle(slide: Slide): string {
  const candidate = slide.title.trim() || slide.pageName.trim();
  return candidate || "제목 없는 슬라이드";
}

const TEMPLATE_LABELS: Record<SlideTemplate, string> = {
  cover: "표지",
  content: "본문",
  image: "이미지",
  html: "HTML",
};

export function slideTemplateLabel(template: SlideTemplate): string {
  return TEMPLATE_LABELS[template];
}

/** 발표 중 조작하는 대상의 이름. 버튼 문구에 쓴다. */
export function slideContentKindLabel(template: SlideTemplate): string {
  return template === "html" ? "HTML" : "웹페이지";
}

/** 화면 낭독기가 읽을 슬라이드 설명. */
export function slideAriaLabel(slide: Slide, pageNumber: number): string {
  return `${pageNumber}페이지 ${slideTemplateLabel(slide.template)} 슬라이드: ${slideDisplayTitle(slide)}`;
}
