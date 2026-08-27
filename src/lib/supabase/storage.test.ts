import { describe, expect, it } from "vitest";
import { isSlideImagePath, slideImagePublicUrl } from "./storage";

const PRESENTATION_ID = "11111111-1111-4111-8111-111111111111";

describe("isSlideImagePath", () => {
  it("자기 프레젠테이션 폴더 안의 경로만 허용한다", () => {
    expect(isSlideImagePath(`${PRESENTATION_ID}/photo.png`, PRESENTATION_ID)).toBe(true);
  });

  it("다른 프레젠테이션 폴더는 거부한다", () => {
    expect(
      isSlideImagePath("22222222-2222-4222-8222-222222222222/photo.png", PRESENTATION_ID),
    ).toBe(false);
  });

  it("폴더만 있고 파일명이 없으면 거부한다", () => {
    expect(isSlideImagePath(`${PRESENTATION_ID}/`, PRESENTATION_ID)).toBe(false);
  });
});

describe("slideImagePublicUrl", () => {
  it("공개 버킷 주소를 만든다", () => {
    const url = slideImagePublicUrl(`${PRESENTATION_ID}/photo.png`);

    expect(url).toContain(`/storage/v1/object/public/slide-images/${PRESENTATION_ID}/photo.png`);
  });

  it("파일명에 든 특수문자를 인코딩한다", () => {
    const url = slideImagePublicUrl(`${PRESENTATION_ID}/사진 1.png`);

    expect(url).toContain(`${PRESENTATION_ID}/${encodeURIComponent("사진 1.png")}`);
    expect(url).not.toContain(" ");
  });
});
