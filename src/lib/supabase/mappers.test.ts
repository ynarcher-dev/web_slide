import { describe, expect, it } from "vitest";
import type { Tables } from "@/types/database.types";
import { toPresentation, toSlide, toUserProfile } from "./mappers";

const PRESENTATION_ROW: Tables<"presentations"> = {
  id: "p-1",
  owner_id: "u-1",
  title: "서비스 소개",
  brand_color: "#E42317",
  cover_tint: 20,
  footer_text: "Copyright © 2026 Y&ARCHER",
  show_page_number: true,
  is_public: false,
  share_id: "s-1",
  created_at: "2026-08-26T00:00:00.000Z",
  updated_at: "2026-08-26T01:00:00.000Z",
};

const SLIDE_ROW: Tables<"slides"> = {
  id: "s-1",
  presentation_id: "p-1",
  template: "content",
  sort_order: 2,
  title: "사용자 대시보드",
  subtitle: "주요 기능을 확인합니다.",
  author: "",
  page_name: "PRODUCT DEMO",
  content_url: "https://demo.example.com",
  image_path: null,
  html_content: null,
  reload_on_enter: true,
  viewport_width: 1920,
  viewport_height: 1080,
  created_at: "2026-08-26T00:00:00.000Z",
  updated_at: "2026-08-26T00:00:00.000Z",
};

describe("toPresentation", () => {
  it("테마 설정을 중첩 객체로 모은다", () => {
    const presentation = toPresentation(PRESENTATION_ROW);

    expect(presentation.ownerId).toBe("u-1");
    expect(presentation.theme).toEqual({
      brandColor: "#E42317",
      coverTint: 20,
      footerText: "Copyright © 2026 Y&ARCHER",
      showPageNumber: true,
    });
  });
});

describe("toSlide", () => {
  it("URL이 있으면 웹페이지 콘텐츠로 변환한다", () => {
    const slide = toSlide(SLIDE_ROW);

    expect(slide.sortOrder).toBe(2);
    expect(slide.pageName).toBe("PRODUCT DEMO");
    expect(slide.content).toEqual({
      type: "website",
      url: "https://demo.example.com",
      reloadOnEnter: true,
      viewport: { width: 1920, height: 1080 },
    });
  });

  it("URL이 없으면 콘텐츠를 null로 둔다", () => {
    const slide = toSlide({ ...SLIDE_ROW, template: "cover", content_url: null });
    expect(slide.content).toBeNull();
  });
});

describe("toUserProfile", () => {
  it("표시 이름을 그대로 옮긴다", () => {
    const profile = toUserProfile({
      id: "u-1",
      display_name: "archer",
      created_at: "2026-08-26T00:00:00.000Z",
      updated_at: "2026-08-26T00:00:00.000Z",
    });

    expect(profile).toEqual({ id: "u-1", displayName: "archer" });
  });
});
