import { defineConfig, devices } from "@playwright/test";

import { ROLE_ACCOUNTS, storageStateFor } from "./e2e/web/accounts";

/**
 * E2E web: chạy trên bản build production (`next build --webpack` + `next start -p 3001`) và BE thật
 * ở `:3000`. Không tự bật server (xem `e2e/README.md`): `next dev` lỗi EPERM trên Windows.
 */
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e/web",
  outputDir: "./e2e/.results",
  fullyParallel: true,
  // Chạy chung với BE, Metro và emulator thì 4 worker làm mỗi test chậm tới 1,5 phút.
  workers: Number(process.env.E2E_WORKERS ?? 2),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/.report", open: "never" }],
  ],
  use: {
    baseURL: WEB_URL,
    channel: "chrome",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Quay video cần ffmpeg của Playwright (`npx playwright install ffmpeg`); mặc định tắt, bật bằng E2E_VIDEO=1.
    video: process.env.E2E_VIDEO === "1" ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "guest",
      testMatch: /login\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    // Luồng nghiệp vụ nhiều vai trò: mỗi spec tự đổi vai bằng `inRole` (e2e/web/helpers.ts), chạy tuần tự.
    {
      name: "academic",
      testMatch:
        /(academic-setup|curriculum-csv|session-cancel-shift|center-closure)\.spec\.ts/,
      dependencies: ["setup"],
      fullyParallel: false,
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    ...ROLE_ACCOUNTS.map((account) => ({
      name: account.role,
      testMatch: /role-pages\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        storageState: storageStateFor(account.role),
      },
      metadata: { role: account.role },
    })),
  ],
});
