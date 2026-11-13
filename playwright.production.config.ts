import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e/production",
  testMatch: "**/*.spec.ts",
  outputDir: "./e2e/.production-results",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/.production-report", open: "never" }],
    ["json", { outputFile: "e2e/.production-results/results.json" }],
  ],
  use: {
    baseURL: "https://edugrade.45.77.168.110.sslip.io",
    channel: process.env.E2E_CHANNEL || "msedge",
    headless: process.env.E2E_HEADED !== "1",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
