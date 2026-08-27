import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  revealPlayerControls,
  signIn,
  TEST_PAGE_URL,
} from "./helpers";

/**
 * 핵심 화면에 콘솔 오류가 남지 않는지 확인한다.
 *
 * 하이드레이션 경고나 잘못된 prop처럼 눈에 보이지 않는 문제를 잡는 것이 목적이다.
 * iframe으로 띄우는 외부 웹페이지가 만드는 오류까지 우리 책임으로 볼 수는 없으므로,
 * 우리 출처(localhost)에서 나온 메시지만 센다.
 */
test.describe.configure({ mode: "serial" });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];

  const isOurs = (message: ConsoleMessage) => {
    const url = message.location().url;
    return url === "" || url.startsWith("http://localhost:3000");
  };

  page.on("console", (message) => {
    if (message.type() === "error" && isOurs(message)) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

test("핵심 화면에 콘솔 오류가 없다", async ({ page }) => {
  test.setTimeout(120_000);

  const errors = collectErrors(page);
  const title = `E2E 콘솔 ${Date.now()}`;

  await page.goto("/");
  await signIn(page);
  await createPresentation(page, title);

  // 표지와 본문을 한 장씩 만들어 편집 화면의 두 속성 패널을 모두 그린다.
  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  await slideList.getByRole("button", { name: "표지 만들기" }).click();
  await properties.getByLabel("제목", { exact: true }).fill("콘솔 점검");
  await expect(page.getByText("저장됨")).toBeVisible();

  await slideList.getByRole("button", { name: /슬라이드 추가/ }).click();
  await page.getByRole("menuitem", { name: "본문 슬라이드" }).click();
  await properties.getByLabel("대제목").fill("실시간 시연");
  await properties.getByLabel("웹페이지 주소").fill(TEST_PAGE_URL);
  await properties.getByLabel("웹페이지 주소").blur();
  await expect(page.getByText("저장됨")).toBeVisible();

  // 발표 화면까지 이동했다가 돌아온다.
  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);
  await revealPlayerControls(page);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("2 / 2")).toBeVisible();
  await revealPlayerControls(page);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await deletePresentation(page, title);

  expect(errors).toEqual([]);
});
