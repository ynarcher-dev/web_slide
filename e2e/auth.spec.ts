import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * 이 테스트는 `pnpm db:seed`로 만든 데모 계정을 사용한다.
 * 계정: demo@webslide.test / WebSlide!2026
 */
const DEMO_EMAIL = "demo@webslide.test";
const DEMO_PASSWORD = "WebSlide!2026";

async function signIn(page: import("@playwright/test").Page) {
  await page.getByLabel("이메일").fill(DEMO_EMAIL);
  await page.getByLabel("비밀번호").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
}

// 로그인 요청이 동시에 몰리면 Supabase 인증 요청 제한에 걸릴 수 있어 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

test.describe("인증", () => {
  test("비로그인 사용자는 프레젠테이션 화면에 접근할 수 없다", async ({ page }) => {
    await page.goto("/presentations");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fpresentations/);
    await expect(page.getByRole("heading", { name: "Web Slide 로그인" })).toBeVisible();
  });

  test("비로그인 사용자는 편집 화면 주소로도 들어갈 수 없다", async ({ page }) => {
    await page.goto("/presentations/00000000-0000-4000-8000-000000000010/edit");

    await expect(page).toHaveURL(/\/login\?redirectTo=/);
  });

  test("로그인 화면에 접근성 위반이 없다", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("잘못된 비밀번호는 오류 메시지를 보여준다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("이메일").fill(DEMO_EMAIL);
    await page.getByLabel("비밀번호").fill("wrong-password-1234");
    await page.getByRole("button", { name: "로그인", exact: true }).click();

    // Next.js의 라우트 안내 영역도 role="alert"이므로 메시지 자체를 찾는다.
    await expect(page.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인하면 원래 가려던 화면으로 이동하고 로그아웃하면 다시 막힌다", async ({ page }) => {
    await page.goto("/presentations");
    await expect(page).toHaveURL(/\/login/);

    await signIn(page);

    await expect(page).toHaveURL(/\/presentations$/);
    await expect(page.getByRole("heading", { name: "내 프레젠테이션" })).toBeVisible();
    await expect(page.getByText(DEMO_EMAIL)).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/presentations");
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인한 사용자가 로그인 화면을 열면 목록으로 보낸다", async ({ page }) => {
    await page.goto("/login");
    await signIn(page);
    await expect(page).toHaveURL(/\/presentations$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/presentations$/);
  });
});
