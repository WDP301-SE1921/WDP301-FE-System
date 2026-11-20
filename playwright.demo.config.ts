import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/demo",
  testMatch: "**/*.spec.ts",
  outputDir: "./e2e/.demo-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/.demo-report", open: "never" }],
    ["json", { outputFile: "e2e/.demo-results/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3001",
    channel: process.env.E2E_CHANNEL ?? "msedge",
    headless: process.env.E2E_HEADED !== "1",
    launchOptions: { slowMo: Number(process.env.E2E_SLOW_MO ?? 100) },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 900 },
    trace: "on",
    screenshot: "on",
    video: "on",
  },
});
