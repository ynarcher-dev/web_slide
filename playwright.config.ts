import { defineConfig, devices } from "@playwright/test";

/**
 * 지원 브라우저 범위 확인용 스모크. chromium 전체 실행에서는 제외한다.
 * 자세한 기준은 docs/technical/deployment.md 5장에 있다.
 */
const CROSS_BROWSER_SPEC = /cross-browser\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  // 모든 테스트가 같은 데모 계정을 쓴다. Supabase 로그아웃은 기본적으로 그 사용자의
  // 모든 세션을 끊으므로, 파일을 병렬로 돌리면 다른 테스트가 도중에 로그아웃된다.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: CROSS_BROWSER_SPEC,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: CROSS_BROWSER_SPEC,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: CROSS_BROWSER_SPEC,
    },
    {
      // Edge는 시스템에 설치된 실행 파일을 채널로 사용한다. 별도 내려받기가 없다.
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
      testMatch: CROSS_BROWSER_SPEC,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
