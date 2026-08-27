import { expect, test } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  revealPlayerControls,
  signIn,
  waitForSlideSave,
} from "./helpers";

/**
 * HTML 본문 슬라이드.
 *
 * 붙여 넣은 HTML은 격리된 iframe 안에서 그려진다. 외부 네트워크에 의존하지 않는다.
 */

const HTML_SOURCE = `<main style="padding:60px;font-size:64px;font-family:sans-serif">붙여 넣은 화면</main>`;

test("HTML 슬라이드에 붙여 넣은 화면을 편집기와 발표 화면에서 본다", async ({ page }) => {
  const title = `E2E HTML ${Date.now()}`;
  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  const preview = page.getByRole("region", { name: "슬라이드 미리보기" });

  await slideList.getByRole("button", { name: "HTML 만들기" }).click();
  await expect(properties.getByRole("heading", { name: "HTML 슬라이드" })).toBeVisible();

  await properties.getByLabel("대제목").fill("HTML 뷰어");
  await expect(preview.getByText("HTML이 아직 없습니다.")).toBeVisible();

  // 입력은 화면 안에만 두고, 포커스를 옮길 때 저장한다.
  const htmlSaved = waitForSlideSave(page);
  await properties.getByLabel("HTML").fill(HTML_SOURCE);
  await properties.getByLabel("HTML").blur();
  await htmlSaved;

  // 붙여 넣은 내용이 격리된 화면 안에 그려진다.
  const frame = preview.frameLocator('[data-testid="html-frame"]');
  await expect(frame.getByText("붙여 넣은 화면")).toBeVisible();

  // 새로고침해도 남는다.
  await page.reload();
  await expect(
    preview.frameLocator('[data-testid="html-frame"]').getByText("붙여 넣은 화면"),
  ).toBeVisible();

  // 발표 화면에서도 같은 화면이 보이고, 조작을 켜고 끌 수 있다.
  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);
  const activeSlide = page.locator('[data-active="true"]');
  await expect(
    activeSlide.frameLocator('[data-testid="html-frame"]').getByText("붙여 넣은 화면"),
  ).toBeVisible();

  const htmlFrame = activeSlide.locator("[data-interactive]");
  await expect(htmlFrame).toHaveAttribute("data-interactive", "false");
  await activeSlide.getByTestId("html-frame-lock").click();
  await expect(htmlFrame).toHaveAttribute("data-interactive", "true");

  await revealPlayerControls(page);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await deletePresentation(page, title);
});
