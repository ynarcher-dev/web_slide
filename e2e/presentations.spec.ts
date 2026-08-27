import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { presentationCard, signIn } from "./helpers";

/**
 * 프레젠테이션 관리(만들기, 목록, 제목 수정, 공통 설정, 삭제) 흐름을 확인한다.
 *
 * `pnpm db:seed`로 만든 데모 계정을 사용한다.
 * 테스트가 만든 자료는 마지막 단계에서 삭제해 DB에 남기지 않는다.
 */

// 로그인 요청이 몰리면 Supabase 인증 요청 제한에 걸릴 수 있어 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

const card = presentationCard;

test("프레젠테이션을 만들고 수정하고 삭제한다", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E 자료 ${stamp}`;
  const renamed = `E2E 자료 수정 ${stamp}`;

  await signIn(page);

  // 만들기: 제목을 입력하면 편집 화면이 열린다.
  await page.getByRole("button", { name: "새 프레젠테이션" }).click();
  const createDialog = page.getByRole("dialog", { name: "새 프레젠테이션 만들기" });
  await createDialog.getByLabel(/제목/).fill(title);
  await createDialog.getByRole("button", { name: "만들기" }).click();

  await expect(page).toHaveURL(/\/presentations\/[0-9a-f-]{36}\/edit$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("region", { name: "슬라이드 목록" })).toBeVisible();

  // 목록으로 돌아오면 방금 만든 자료가 보인다.
  await page.getByRole("link", { name: "← 목록" }).click();
  await expect(page).toHaveURL(/\/presentations$/);
  await expect(card(page, title)).toBeVisible();

  // 제목 수정
  await card(page, title).getByRole("button", { name: /관리/ }).click();
  await page.getByRole("menuitem", { name: "제목 수정" }).click();
  const renameDialog = page.getByRole("dialog", { name: "제목 수정" });
  await renameDialog.getByLabel(/제목/).fill(renamed);
  await renameDialog.getByRole("button", { name: "저장" }).click();

  await expect(card(page, renamed)).toBeVisible();
  await expect(card(page, title)).toHaveCount(0);

  // 공통 설정 저장
  await card(page, renamed).getByRole("button", { name: /관리/ }).click();
  await page.getByRole("menuitem", { name: "공통 설정" }).click();
  const settingsDialog = page.getByRole("dialog", { name: "공통 설정" });
  await settingsDialog.getByLabel(/브랜드 색상/).fill("#123456");
  await settingsDialog.getByLabel(/표지 배경 tint/).fill("40");
  await settingsDialog.getByLabel(/푸터 텍스트/).fill("E2E 푸터");
  await settingsDialog.getByLabel("공개 공유 허용").check();
  await settingsDialog.getByRole("button", { name: "저장" }).click();

  await expect(card(page, renamed).getByText("#123456")).toBeVisible();
  await expect(card(page, renamed).getByText("tint 40")).toBeVisible();
  await expect(card(page, renamed).getByText("공개")).toBeVisible();

  // 새로고침해도 저장된 값이 유지된다.
  await page.reload();
  await expect(card(page, renamed).getByText("tint 40")).toBeVisible();

  // 삭제는 확인 절차를 거친다.
  await card(page, renamed).getByRole("button", { name: /관리/ }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "프레젠테이션 삭제" });
  await expect(deleteDialog).toContainText("되돌릴 수 없습니다.");
  await deleteDialog.getByRole("button", { name: "삭제" }).click();

  await expect(card(page, renamed)).toHaveCount(0);
});

test("목록 화면에 접근성 위반이 없다", async ({ page }) => {
  await signIn(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
