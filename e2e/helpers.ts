import { expect, type Locator, type Page } from "@playwright/test";

/**
 * E2E가 함께 쓰는 로그인과 프레젠테이션 준비 절차.
 *
 * 모든 테스트가 `pnpm db:seed`로 만든 같은 데모 계정을 사용한다.
 * Supabase 로그아웃은 그 사용자의 모든 세션을 끊으므로 테스트는 순차로 실행한다.
 */
export const DEMO_EMAIL = "demo@webslide.test";
export const DEMO_PASSWORD = "WebSlide!2026";

/** 업로드 테스트에 쓰는 1x1 PNG. 경로만 확인하면 되므로 가장 작은 파일을 쓴다. */
export const TEST_IMAGE_FILE = {
  name: "sample.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

/**
 * 편집 화면의 자동 저장이 서버까지 다녀오기를 기다린다.
 *
 * 저장은 debounce로 미뤄지므로, 저장 전에 새로고침하면 방금 바꾼 값이 사라진다.
 * 호출은 값을 바꾸기 "전"에 하고 반환된 약속을 바꾼 뒤에 기다린다.
 */
export function waitForSlideSave(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/edit"),
  );
}

/** iframe 삽입이 허용된 실제 주소. 외부 네트워크에 의존하는 유일한 값이다. */
export const TEST_PAGE_URL = "https://example.com";

export async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(DEMO_EMAIL);
  await page.getByLabel("비밀번호").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/presentations$/);
}

/**
 * 발표 화면의 상단 컨트롤을 내린다.
 *
 * 컨트롤은 접혀 있다가 포인터가 화면 위쪽에 올 때만 내려온다.
 * 접힌 동안에는 화면 밖에 있어 클릭할 수 없으므로 컨트롤을 쓰기 전에 항상 먼저 호출한다.
 */
export async function revealPlayerControls(page: Page) {
  const viewport = page.viewportSize();
  await page.mouse.move(Math.round((viewport?.width ?? 1280) / 2), 16);
  await expect(page.locator("[data-visible]")).toHaveAttribute("data-visible", "true");
}

/** 편집 화면이 열린 새 프레젠테이션을 만든다. */
export async function createPresentation(page: Page, title: string) {
  await page.getByRole("button", { name: "새 프레젠테이션" }).click();
  const dialog = page.getByRole("dialog", { name: "새 프레젠테이션 만들기" });
  await dialog.getByLabel(/제목/).fill(title);
  await dialog.getByRole("button", { name: "만들기" }).click();
  await expect(page).toHaveURL(/\/presentations\/[0-9a-f-]{36}\/edit$/);
}

/** 목록에서 특정 제목의 카드를 찾는다. 제목이 서로 포함 관계가 되지 않도록 정확히 비교한다. */
export function presentationCard(page: Page, title: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: title, exact: true }) });
}

/**
 * Tab만 눌러 원하는 컨트롤까지 이동한다.
 * 마우스 없이 화면을 쓸 수 있는지 확인할 때 사용한다.
 */
export async function tabTo(page: Page, target: Locator, maxPresses = 40) {
  await expect(target).toBeVisible();

  for (let pressed = 0; pressed <= maxPresses; pressed += 1) {
    const focused = await target.evaluate((element) => element === document.activeElement);
    if (focused) return;
    await page.keyboard.press("Tab");
  }

  throw new Error(`Tab을 ${maxPresses}번 눌러도 대상에 도달하지 못했습니다.`);
}

/** 테스트가 만든 자료를 DB에 남기지 않는다. */
export async function deletePresentation(page: Page, title: string) {
  await page.goto("/presentations");
  const card = presentationCard(page, title);

  await card.getByRole("button", { name: /관리/ }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await page
    .getByRole("dialog", { name: "프레젠테이션 삭제" })
    .getByRole("button", { name: "삭제" })
    .click();
  await expect(card).toHaveCount(0);
}
