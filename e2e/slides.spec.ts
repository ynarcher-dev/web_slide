import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  revealPlayerControls,
  signIn,
  tabTo,
} from "./helpers";

/**
 * 슬라이드 만들기, 목록, 편집, 순서 변경, 삭제와 발표 모드 흐름을 확인한다.
 *
 * `pnpm db:seed`로 만든 데모 계정을 사용한다.
 * 테스트가 만든 자료는 마지막 단계에서 삭제해 DB에 남기지 않는다.
 */
// 로그인 요청이 몰리면 Supabase 인증 요청 제한에 걸릴 수 있어 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

/** Server Action 요청이 끝날 때까지 기다린다. 저장 전에 새로고침해 결과를 잃지 않도록 한다. */
function waitForServerAction(page: Page) {
  return page.waitForResponse((response) => response.request().method() === "POST");
}

test("슬라이드를 만들고 편집하고 순서를 바꾸고 발표한다", async ({ page }) => {
  const title = `E2E 슬라이드 ${Date.now()}`;

  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });
  const preview = page.getByRole("region", { name: "슬라이드 미리보기" });

  // 슬라이드가 없으면 표지와 본문 만들기를 함께 제안한다.
  await expect(slideList.getByText("슬라이드가 없습니다.")).toBeVisible();
  await slideList.getByRole("button", { name: "표지 만들기" }).click();

  // 표지 입력값이 미리보기와 목록에 곧바로 반영된다.
  await properties.getByLabel("제목", { exact: true }).fill("Web Slide 발표");
  await properties.getByLabel("발표자 이름").fill("Y&ARCHER");
  await expect(preview.getByText("Web Slide 발표")).toBeVisible();
  await expect(page.getByText("저장됨")).toBeVisible();

  // 표지 tint는 공통 설정이라 프레젠테이션에 저장된다.
  const tintSaved = waitForServerAction(page);
  await properties.getByLabel("표지 배경 tint").fill("40");
  await tintSaved;

  // 본문 슬라이드를 현재 슬라이드 다음에 만든다.
  await slideList.getByRole("button", { name: /슬라이드 추가/ }).click();
  await page.getByRole("menuitem", { name: "본문 슬라이드" }).click();

  await properties.getByLabel("페이지명").fill("PRODUCT");
  await properties.getByLabel("대제목").fill("실시간 시연");
  await properties.getByLabel("웹페이지 주소").fill("https://example.com");
  await properties.getByLabel("웹페이지 주소").blur();
  await expect(page.getByText("저장됨")).toBeVisible();

  // 목록에 페이지 번호, 템플릿 유형, 제목이 함께 보인다.
  const items = slideList.getByRole("listitem");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("표지");
  await expect(items.first()).toContainText("Web Slide 발표");
  await expect(items.last()).toContainText("본문");
  await expect(items.last()).toContainText("실시간 시연");

  // 순서를 바꾸면 페이지 번호도 다시 매겨진다.
  await slideList.getByRole("button", { name: "2페이지 슬라이드 메뉴" }).click();
  const reordered = waitForServerAction(page);
  await page.getByRole("menuitem", { name: "위로 이동" }).click();
  await expect(items.first()).toContainText("실시간 시연");
  await reordered;

  // 드래그로도 순서를 바꿀 수 있다.
  const dragged = waitForServerAction(page);
  await items.nth(1).dragTo(items.nth(0));
  await expect(items.first()).toContainText("Web Slide 발표");
  await dragged;

  // 다시 본문이 앞에 오도록 되돌린다.
  await slideList.getByRole("button", { name: "2페이지 슬라이드 메뉴" }).click();
  const reorderedAgain = waitForServerAction(page);
  await page.getByRole("menuitem", { name: "위로 이동" }).click();
  await reorderedAgain;

  // 새로고침해도 순서와 입력값이 그대로 남는다.
  await page.reload();
  await expect(slideList.getByRole("listitem").first()).toContainText("실시간 시연");
  await expect(slideList.getByRole("listitem").last()).toContainText("Web Slide 발표");
  await slideList.getByRole("button", { name: /표지 슬라이드/ }).click();
  await expect(properties.getByLabel("표지 배경 tint")).toHaveValue("40");

  // 발표 모드로 이동해 슬라이드를 넘긴다.
  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);
  await expect(page.getByText("1 / 2")).toBeVisible();

  await revealPlayerControls(page);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("2 / 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "다음", exact: true })).toBeDisabled();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("1 / 2")).toBeVisible();

  await revealPlayerControls(page);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  // 슬라이드 삭제는 확인 절차를 거치고, 마지막 슬라이드를 지우면 빈 상태가 된다.
  await slideList.getByRole("button", { name: "1페이지 슬라이드 메뉴" }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await page
    .getByRole("dialog", { name: "슬라이드 삭제" })
    .getByRole("button", { name: "삭제" })
    .click();
  await expect(slideList.getByRole("listitem")).toHaveCount(1);
  // 삭제 후에는 남은 슬라이드가 자동으로 선택된다.
  await expect(slideList.getByRole("button", { name: /표지 슬라이드/ })).toHaveAttribute(
    "aria-current",
    "true",
  );

  await slideList.getByRole("button", { name: "1페이지 슬라이드 메뉴" }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await page
    .getByRole("dialog", { name: "슬라이드 삭제" })
    .getByRole("button", { name: "삭제" })
    .click();
  await expect(slideList.getByText("슬라이드가 없습니다.")).toBeVisible();

  await deletePresentation(page, title);
});

test("주요 편집 동작을 키보드만으로 수행한다", async ({ page }) => {
  const title = `E2E 키보드 ${Date.now()}`;

  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });

  // 만들기: Tab으로 버튼까지 이동해 Enter로 실행한다.
  await tabTo(page, slideList.getByRole("button", { name: "표지 만들기" }));
  await page.keyboard.press("Enter");
  await expect(slideList.getByRole("listitem")).toHaveCount(1);

  // 편집: 속성 패널의 입력창까지 Tab으로 이동해 값을 넣는다.
  await tabTo(page, properties.getByLabel("제목", { exact: true }));
  await page.keyboard.type("키보드 표지");
  await expect(page.getByText("저장됨")).toBeVisible();

  // 메뉴: 트리거에서 Enter로 열고 방향키로 항목을 고른다.
  await tabTo(page, slideList.getByRole("button", { name: "1페이지 슬라이드 메뉴" }));
  await page.keyboard.press("Enter");
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "삭제" })).toBeFocused();

  // 확인 창: Esc로 취소하면 슬라이드가 남는다.
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "슬라이드 삭제" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(slideList.getByRole("listitem")).toHaveCount(1);

  // 삭제: 같은 흐름을 끝까지 진행하면 빈 상태가 된다.
  await tabTo(page, slideList.getByRole("button", { name: "1페이지 슬라이드 메뉴" }));
  await page.keyboard.press("Enter");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await tabTo(page, dialog.getByRole("button", { name: "삭제" }));
  await page.keyboard.press("Enter");
  await expect(slideList.getByText("슬라이드가 없습니다.")).toBeVisible();

  await deletePresentation(page, title);
});

test("편집 화면에 접근성 위반이 없다", async ({ page }) => {
  const title = `E2E 접근성 ${Date.now()}`;

  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  await slideList.getByRole("button", { name: "표지 만들기" }).click();
  await expect(slideList.getByRole("listitem")).toHaveCount(1);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);

  await deletePresentation(page, title);
});
