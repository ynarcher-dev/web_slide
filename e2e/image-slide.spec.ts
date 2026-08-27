import { expect, test } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  revealPlayerControls,
  signIn,
  TEST_IMAGE_FILE,
  waitForSlideSave,
} from "./helpers";

/**
 * 이미지 본문 슬라이드.
 *
 * 실제 Supabase Storage에 파일을 올리므로 마이그레이션이 적용된 프로젝트가 필요하다.
 * 테스트가 끝나기 전에 이미지를 지워 빈 파일이 남지 않게 한다.
 */

test("이미지 슬라이드를 만들고 그림을 올려 발표까지 확인한다", async ({ page }) => {
  const title = `E2E 이미지 ${Date.now()}`;
  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  const preview = page.getByRole("region", { name: "슬라이드 미리보기" });

  await slideList.getByRole("button", { name: "이미지 만들기" }).click();
  await expect(properties.getByRole("heading", { name: "이미지 슬라이드" })).toBeVisible();

  // 글 영역은 본문 슬라이드와 같다.
  await properties.getByLabel("페이지명").fill("PRODUCT");
  await properties.getByLabel("대제목").fill("제품 사진");
  await expect(page.getByText("저장됨")).toBeVisible();

  // 이미지를 올리기 전에는 안내 문구만 보인다.
  await expect(preview.getByText("이미지가 아직 없습니다.")).toBeVisible();

  // 업로드 뒤의 자동 저장까지 기다린다. 저장 전에 새로고침하면 경로가 사라진다.
  const imageSaved = waitForSlideSave(page);

  await properties.getByLabel("슬라이드 이미지 파일").setInputFiles(TEST_IMAGE_FILE);

  const slideImage = preview.getByRole("img", { name: "제품 사진 이미지" });
  await expect(slideImage).toBeVisible();
  await expect(slideImage).toHaveAttribute("src", /\/storage\/v1\/object\/public\/slide-images\//);

  await imageSaved;

  // 새로고침해도 남는다.
  await page.reload();
  await expect(preview.getByRole("img", { name: "제품 사진 이미지" })).toBeVisible();

  // 발표 화면에서도 같은 그림이 보인다.
  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);
  await expect(
    page.locator('[data-active="true"]').getByRole("img", { name: "제품 사진 이미지" }),
  ).toBeVisible();
  // 조작할 웹페이지가 없으므로 조작 버튼도 없다.
  await revealPlayerControls(page);
  await expect(page.getByRole("button", { name: "웹페이지 조작" })).toHaveCount(0);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  // 올린 파일을 지우고 프레젠테이션도 지운다.
  const imageRemoved = waitForSlideSave(page);
  await properties.getByRole("button", { name: "이미지 제거" }).click();
  await expect(properties.getByText("아직 올린 이미지가 없습니다.")).toBeVisible();
  await imageRemoved;
  await expect(preview.getByText("이미지가 아직 없습니다.")).toBeVisible();

  await deletePresentation(page, title);
});
