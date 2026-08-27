import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  revealPlayerControls,
  signIn,
  TEST_PAGE_URL,
} from "./helpers";

/**
 * 본문 슬라이드의 웹페이지 프레임과 발표 컨트롤을 실제 브라우저에서 확인한다.
 *
 * iframe 삽입이 허용된 실제 주소가 필요하므로 `https://example.com`을 사용한다.
 * 외부 네트워크에 의존하는 유일한 테스트다.
 */
test.describe.configure({ mode: "serial" });

/** 본문 슬라이드 한 장과 웹페이지 주소가 준비된 프레젠테이션을 만든다. */
async function createSlideWithWebPage(page: Page, title: string) {
  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });

  await slideList.getByRole("button", { name: "본문 만들기" }).click();
  await properties.getByLabel("대제목").fill("실시간 시연");
  await properties.getByLabel("웹페이지 주소").fill(TEST_PAGE_URL);
  await properties.getByLabel("웹페이지 주소").blur();
  await expect(page.getByText("저장됨")).toBeVisible();
}

test("편집 미리보기에서 웹페이지를 기준 뷰포트로 띄우고 조작 잠금을 풀 수 있다", async ({
  page,
}) => {
  const title = `E2E 프레임 ${Date.now()}`;
  await createSlideWithWebPage(page, title);

  const preview = page.getByRole("region", { name: "슬라이드 미리보기" });
  const frame = preview.locator("iframe");

  // 웹페이지는 1920×1080으로 그린 뒤 표시 크기에 맞춰 축소한다.
  await expect(frame).toHaveAttribute("src", TEST_PAGE_URL);
  const box = await frame.evaluate((element) => ({
    width: (element as HTMLIFrameElement).offsetWidth,
    height: (element as HTMLIFrameElement).offsetHeight,
    transform: getComputedStyle(element).transform,
  }));
  expect(box).toMatchObject({ width: 1920, height: 1080 });
  expect(box.transform).toMatch(/^matrix\(0\.\d+/);

  // 실제 웹페이지가 로드되면 로딩 표시가 사라진다.
  await expect(preview.getByText("웹페이지를 불러오는 중입니다.")).toBeHidden({ timeout: 30_000 });

  // 편집 중에는 덮개가 클릭을 막고, 조작을 켜면 사라진다.
  await expect(preview.getByTestId("web-frame-lock")).toBeAttached();
  await page.getByRole("button", { name: "웹페이지 조작 켜기", exact: true }).click();
  await expect(preview.getByTestId("web-frame-lock")).toHaveCount(0);

  // 웹페이지 바깥(대제목 영역)을 누르면 다시 잠기고, 웹페이지 영역을 누르면 다시 켜진다.
  await preview.getByRole("heading", { name: "실시간 시연" }).click();
  await expect(preview.getByTestId("web-frame-lock")).toBeAttached();
  await preview.getByTestId("web-frame-lock").click();
  await expect(preview.getByTestId("web-frame-lock")).toHaveCount(0);

  // 조작을 켜면 iframe이 포커스를 가져가고, 입력창을 누르면 편집기로 돌아온다.
  await frame.click();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");

  const titleField = page.getByRole("region", { name: "슬라이드 속성" }).getByLabel("대제목");
  await titleField.click();
  await expect(titleField).toBeFocused();

  await deletePresentation(page, title);
});

test("발표 화면에서 컨트롤이 잠시 숨었다가 다시 나타난다", async ({ page }) => {
  const title = `E2E 발표 ${Date.now()}`;
  await createSlideWithWebPage(page, title);

  await page.getByRole("button", { name: "발표 시작" }).click();
  await expect(page).toHaveURL(/\/present$/);

  const controls = page.getByRole("group", { name: "발표 컨트롤" });
  const controlsLayer = page.locator("[data-visible]");

  await expect(controls).toBeVisible();
  // 아무 동작이 없으면 위로 접힌다.
  await expect(controlsLayer).toHaveAttribute("data-visible", "false");

  // 화면 아래쪽에서는 접힌 채로 둔다.
  await page.mouse.move(400, 400);
  await expect(controlsLayer).toHaveAttribute("data-visible", "false");

  // 마우스를 화면 위로 올리면 내려온다.
  await revealPlayerControls(page);

  // 발표 화면 접근성 검사. 컨트롤이 자동으로 숨으면 검사 대상이 사라지므로
  // 방금 다시 띄운 상태에서 검사한다. iframe 안쪽은 우리 코드가 아니라 제외한다.
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("iframe")
    .analyze();
  expect(results.violations).toEqual([]);

  const webFrame = page.locator('[data-active="true"] [data-interactive]');
  await expect(webFrame).toHaveAttribute("data-interactive", "false");

  await page.getByRole("button", { name: "웹페이지 조작" }).click();
  await expect(page.getByText(/웹페이지를 조작하는 중입니다/)).toBeVisible();
  // 조작 중에는 웹페이지 테두리가 초록색 활성 상태가 된다.
  await expect(webFrame).toHaveAttribute("data-interactive", "true");

  // 조작 중에도 컨트롤 규칙은 같다. 웹페이지 바깥 아래쪽으로 내려가면 접히고 위로 올리면 다시 내려온다.
  // 포인터가 iframe 안에 있는 동안에는 이벤트가 오지 않으므로 슬라이드 여백으로 옮긴다.
  await page.mouse.move(20, 690);
  await expect(controlsLayer).toHaveAttribute("data-visible", "false");
  await revealPlayerControls(page);

  await page.getByRole("button", { name: "슬라이드 이동으로 돌아가기" }).click();
  await expect(page.getByText(/웹페이지를 조작하는 중입니다/)).toBeHidden();
  await expect(webFrame).toHaveAttribute("data-interactive", "false");

  // 버튼 없이 화면을 눌러서도 전환한다. 웹페이지 영역은 켜고, 그 바깥은 끈다.
  const activeSlide = page.locator('[data-active="true"]');
  await activeSlide.getByTestId("web-frame-lock").click();
  await expect(webFrame).toHaveAttribute("data-interactive", "true");

  await activeSlide.getByRole("heading", { name: "실시간 시연" }).click();
  await expect(webFrame).toHaveAttribute("data-interactive", "false");

  // 전체화면에 들어갔다가 나온다.
  await revealPlayerControls(page);
  await page.getByRole("button", { name: "전체화면", exact: true }).click();
  await expect(page.getByRole("button", { name: "전체화면 끝내기" })).toBeVisible();

  // 전체화면에서는 슬라이드가 화면을 가로세로 모두 채운다.
  const stage = page.locator('[data-active="true"] [role="img"]').first();
  await expect
    .poll(async () =>
      stage.evaluate((element) => ({
        width: element.clientWidth - window.innerWidth,
        height: element.clientHeight - window.innerHeight,
      })),
    )
    .toEqual({ width: 0, height: 0 });

  await page.getByRole("button", { name: "전체화면 끝내기" }).click();
  await expect(page.getByRole("button", { name: "전체화면", exact: true })).toBeVisible();

  // 모션 감소 설정에서도 슬라이드 이동은 그대로 동작한다.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByText("1 / 1")).toBeVisible();

  await revealPlayerControls(page);
  await page.getByRole("link", { name: "발표 종료" }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await deletePresentation(page, title);
});
