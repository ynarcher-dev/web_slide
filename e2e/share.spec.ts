import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createPresentation, DEMO_EMAIL, deletePresentation, signIn } from "./helpers";

/**
 * 읽기 전용 공유 링크의 접근 권한을 확인한다.
 *
 * 로그인한 소유자와 로그인하지 않은 방문자를 서로 다른 브라우저 컨텍스트로 나눠서,
 * 공개 여부를 바꿀 때마다 접근 결과가 실제로 달라지는지 본다.
 *
 * `pnpm db:seed`로 만든 데모 계정을 사용한다.
 * 테스트가 만든 자료는 마지막 단계에서 삭제해 DB에 남기지 않는다.
 */
test.describe.configure({ mode: "serial" });

/** 편집 화면 상단의 공통 설정에서 공개 여부만 바꾼다. */
async function setPublic(page: Page, isPublic: boolean) {
  await page.getByRole("button", { name: "프레젠테이션 설정" }).click();
  await page.getByRole("menuitem", { name: "공통 설정" }).click();
  const dialog = page.getByRole("dialog", { name: "공통 설정" });
  const checkbox = dialog.getByLabel("공개 공유 허용");

  if (isPublic) await checkbox.check();
  else await checkbox.uncheck();

  await dialog.getByRole("button", { name: "저장" }).click();
  await expect(dialog).toBeHidden();
}

test("공개 상태에 따라 공유 링크 접근이 달라진다", async ({ page, browser }) => {
  const title = `E2E 공유 ${Date.now()}`;
  const coverTitle = `공유 표지 ${Date.now()}`;

  await signIn(page);
  await createPresentation(page, title);
  const presentationId = new URL(page.url()).pathname.split("/")[2];

  // 공유 화면에 보여줄 표지 한 장을 만든다.
  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  await slideList.getByRole("button", { name: "표지 만들기" }).click();
  await properties.getByLabel("제목", { exact: true }).fill(coverTitle);
  await expect(page.getByText("저장됨")).toBeVisible();

  // 공유 링크는 편집 주소가 아니라 별도의 공개 식별자를 사용한다.
  await page.context().grantPermissions(["clipboard-write"]);
  await page.getByRole("button", { name: "프레젠테이션 설정" }).click();
  await page.getByRole("menuitem", { name: "공유 링크" }).click();
  const shareDialog = page.getByRole("dialog", { name: "공유 링크" });
  await expect(shareDialog.getByText(/공개 공유 허용/)).toBeVisible();
  const shareUrl = await shareDialog.getByLabel("공유 주소").inputValue();
  expect(shareUrl).toMatch(/\/share\/[0-9a-f-]{36}$/);
  expect(shareUrl).not.toContain(presentationId);

  await shareDialog.getByRole("button", { name: "링크 복사" }).click();
  await expect(shareDialog.getByText("링크를 복사했습니다.")).toBeVisible();
  await shareDialog.getByRole("button", { name: "닫기" }).click();

  // 로그인하지 않은 방문자를 흉내 낸다.
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();

  // 비공개 상태에서는 링크를 알아도 열리지 않는다.
  const blocked = await guest.goto(shareUrl);
  expect(blocked?.status()).toBe(404);

  // 공개로 바꾸면 곧바로 열린다.
  await setPublic(page, true);
  const allowed = await guest.reload();
  expect(allowed?.status()).toBe(200);
  await expect(guest.getByText(coverTitle)).toBeVisible();
  await expect(guest.getByRole("group", { name: "발표 컨트롤" })).toBeVisible();

  // 공유 화면에는 편집으로 이어지는 UI가 없다.
  await expect(guest.getByRole("link", { name: "발표 종료" })).toHaveCount(0);
  await expect(guest.getByRole("button", { name: "프레젠테이션 설정" })).toHaveCount(0);
  await expect(guest.getByRole("link", { name: "← 목록" })).toHaveCount(0);

  // 컨트롤이 자동으로 숨은 뒤에도 접근성 검사 대상이 남아 있어야 한다.
  // 마우스를 움직여 컨트롤을 다시 띄운 상태에서 검사한다.
  await guest.mouse.move(10, 10);
  await expect(guest.getByRole("group", { name: "발표 컨트롤" })).toBeVisible();
  const shareAxe = await new AxeBuilder({ page: guest })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(shareAxe.violations).toEqual([]);

  // 공개 화면에 편집용 데이터나 서버 비밀 값이 실려 나가지 않는다.
  const html = await guest.content();
  expect(html).not.toContain(DEMO_EMAIL);
  expect(html).not.toMatch(/postgresql:\/\/|service_role|sb_secret|SUPABASE_DB_URL/);
  expect(html).not.toContain("/edit");

  // 다시 비공개로 바꾸면 접근이 즉시 막힌다.
  await setPublic(page, false);
  const blockedAgain = await guest.reload();
  expect(blockedAgain?.status()).toBe(404);

  await guestContext.close();
  await deletePresentation(page, title);
});
