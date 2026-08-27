import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  createPresentation,
  deletePresentation,
  signIn,
  TEST_IMAGE_FILE,
  TEST_PAGE_URL,
  waitForSlideSave,
} from "./helpers";

/**
 * 여러 장짜리 프레젠테이션을 PDF로 내보내는 흐름을 확인한다.
 *
 * 서버가 Playwright로 직접 인쇄하므로 실행에 시간이 걸린다.
 * 본문 슬라이드에는 iframe 삽입이 허용된 실제 주소가 필요해 `https://example.com`을 사용한다.
 * 이미지 슬라이드는 실제 Storage에 파일을 올린 뒤, 인쇄가 끝나면 다시 지운다.
 *
 * `pnpm db:seed`로 만든 데모 계정을 사용한다.
 * 테스트가 만든 자료는 마지막 단계에서 삭제해 DB에 남기지 않는다.
 */
test.describe.configure({ mode: "serial" });

test("표지, 본문, 이미지 슬라이드를 16:9 PDF 세 페이지로 내려받는다", async ({ page }) => {
  // 서버가 브라우저를 띄워 인쇄하므로 넉넉하게 기다린다.
  test.setTimeout(180_000);

  const title = `E2E PDF ${Date.now()}`;
  await signIn(page);
  await createPresentation(page, title);

  const slideList = page.getByRole("region", { name: "슬라이드 목록" });
  const properties = page.getByRole("region", { name: "슬라이드 속성" });

  // 표지 한 장
  await slideList.getByRole("button", { name: "표지 만들기" }).click();
  await properties.getByLabel("제목", { exact: true }).fill("PDF 표지");
  await properties.getByLabel("발표자 이름").fill("Y&ARCHER");

  // 본문 한 장. 웹페이지 영역이 정적 화면으로 들어가는지 함께 확인한다.
  await slideList.getByRole("button", { name: /슬라이드 추가/ }).click();
  await page.getByRole("menuitem", { name: "본문 슬라이드" }).click();
  await properties.getByLabel("대제목").fill("실시간 시연");
  await properties.getByLabel("웹페이지 주소").fill(TEST_PAGE_URL);
  await properties.getByLabel("웹페이지 주소").blur();
  await expect(page.getByText("저장됨")).toBeVisible();

  // 이미지 한 장. 그림을 다 받은 뒤에 인쇄하는지 함께 확인한다.
  await slideList.getByRole("button", { name: /슬라이드 추가/ }).click();
  await page.getByRole("menuitem", { name: "이미지 슬라이드" }).click();
  // 새 슬라이드가 선택된 뒤에 입력해야 값이 이 슬라이드에 들어간다.
  await expect(properties.getByRole("heading", { name: "이미지 슬라이드" })).toBeVisible();
  await properties.getByLabel("대제목").fill("제품 사진");
  const imageSaved = waitForSlideSave(page);
  await properties.getByLabel("슬라이드 이미지 파일").setInputFiles(TEST_IMAGE_FILE);
  await expect(
    page.getByRole("region", { name: "슬라이드 미리보기" }).getByRole("img", {
      name: "제품 사진 이미지",
    }),
  ).toBeVisible();
  await imageSaved;

  // 공통 설정(표지 tint, 푸터, 페이지 번호)도 PDF에 그대로 나와야 한다.
  await page.getByRole("button", { name: "프레젠테이션 설정" }).click();
  await page.getByRole("menuitem", { name: "공통 설정" }).click();
  const settings = page.getByRole("dialog", { name: "공통 설정" });
  await settings.getByLabel(/표지 배경 tint/).fill("60");
  await settings.getByLabel(/푸터 텍스트/).fill("E2E 푸터");
  await settings.getByLabel("페이지 번호 표시").check();
  await settings.getByRole("button", { name: "저장" }).click();
  await expect(settings).toBeHidden();

  const downloadPromise = page.waitForEvent("download");
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/pdf/download"),
    { timeout: 150_000 },
  );

  await page.getByRole("button", { name: "PDF 내보내기" }).click();
  // 만드는 동안 진행 상태를 보여준다.
  await expect(page.getByRole("button", { name: "PDF 만드는 중" })).toBeVisible();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");

  // 파일 이름은 프레젠테이션 제목을 따른다. 내용은 저장된 파일에서 직접 확인한다.
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${title}.pdf`);
  const pdf = readFileSync(await download.path(), "latin1");
  expect(pdf.startsWith("%PDF")).toBe(true);

  // 슬라이드 세 장이 각각 한 페이지가 되고, 페이지 비율은 16:9다.
  const pageCount = Number(/\/Count\s+(\d+)/.exec(pdf)?.[1]);
  expect(pageCount).toBe(3);

  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/.exec(pdf);
  expect(box).not.toBeNull();
  expect(Number(box![1]) / Number(box![2])).toBeCloseTo(16 / 9, 2);

  // PDF에서는 웹페이지를 조작할 수 없으므로 그 영역에 원본 주소 링크를 남긴다.
  expect(pdf).toContain("/URI");
  expect(pdf).toContain(TEST_PAGE_URL);

  // 내보내기가 끝나면 버튼이 원래 상태로 돌아온다.
  await expect(page.getByRole("button", { name: "PDF 내보내기" })).toBeEnabled();

  // 올린 파일을 지운 뒤 프레젠테이션도 지운다.
  await slideList.getByRole("listitem").last().click();
  const imageRemoved = waitForSlideSave(page);
  await properties.getByRole("button", { name: "이미지 제거" }).click();
  await imageRemoved;

  await deletePresentation(page, title);
});
