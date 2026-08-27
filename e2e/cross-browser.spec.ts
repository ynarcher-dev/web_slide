import { expect, test } from "@playwright/test";
import { createPresentation, deletePresentation, revealPlayerControls, signIn } from "./helpers";

/**
 * 지원 브라우저 범위 확인용 스모크.
 *
 * chromium 프로젝트는 전체 E2E를 돌리므로 이 파일을 실행하지 않는다.
 * firefox, webkit, msedge에서는 이 파일만 돌려 핵심 경로가 엔진과 무관하게 도는지 본다.
 * 외부 웹페이지는 넣지 않는다. 네트워크 상태가 엔진 차이로 오해되지 않게 한다.
 */
test.describe.configure({ mode: "serial" });

test("지원 브라우저에서 로그인, 편집, 발표 핵심 경로가 동작한다", async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  const title = `E2E ${testInfo.project.name} ${Date.now()}`;

  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  const preview = page.getByRole("region", { name: "슬라이드 미리보기" });

  // 표지를 만들고 입력값이 미리보기에 반영되는지 본다.
  await slideList.getByRole("button", { name: "표지 만들기" }).click();
  await properties.getByLabel("제목", { exact: true }).fill("지원 범위 확인");
  await expect(preview.getByText("지원 범위 확인")).toBeVisible();
  await expect(page.getByText("저장됨")).toBeVisible();

  // 본문 슬라이드를 한 장 더 만든다. 웹페이지 주소는 넣지 않는다.
  await slideList.getByRole("button", { name: /슬라이드 추가/ }).click();
  await page.getByRole("menuitem", { name: "본문 슬라이드" }).click();
  await properties.getByLabel("대제목").fill("두 번째 장");
  await expect(page.getByText("저장됨")).toBeVisible();
  await expect(slideList.getByRole("listitem")).toHaveCount(2);

  // 새로고침해도 저장된 결과가 그대로 남는다.
  await page.reload();
  await expect(slideList.getByRole("listitem")).toHaveCount(2);

  // 발표 화면에서 슬라이드를 넘긴다.
  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);
  await expect(page.getByText("1 / 2")).toBeVisible();

  await revealPlayerControls(page);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("2 / 2")).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("1 / 2")).toBeVisible();

  await revealPlayerControls(page);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await deletePresentation(page, title);
});
