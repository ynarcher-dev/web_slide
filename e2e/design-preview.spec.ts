import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("디자인 기준 미리보기", () => {
  test("접근성 위반 없이 렌더링된다", async ({ page }) => {
    await page.goto("/design-preview");
    await expect(page.getByRole("heading", { name: "디자인 기준 미리보기" })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("키보드로 모달을 열고 Esc로 닫으면 포커스가 되돌아온다", async ({ page }) => {
    await page.goto("/design-preview");

    const trigger = page.getByRole("button", { name: "모달 열기" });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("좁은 화면에서는 편집기 패널을 하나씩 전환한다", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto("/design-preview");

    const preview = page.getByRole("region", { name: "슬라이드 미리보기" });
    const properties = page.getByRole("region", { name: "슬라이드 속성" });

    await expect(preview).toBeVisible();
    await expect(properties).toBeHidden();

    await page.getByRole("button", { name: "속성", exact: true }).click();

    await expect(properties).toBeVisible();
    await expect(preview).toBeHidden();
  });
});
