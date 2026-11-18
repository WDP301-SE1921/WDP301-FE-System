import { defineConfig } from "@playwright/test";
import local from "./e2e/production/settings.cjs";
import profiles from "./e2e/production/selection.cjs";
const config = local.settings();
const plan = profiles.selection();
export default defineConfig({
  name: "EduGrade Production",
  testDir: "./e2e/production",
  globalSetup: "./e2e/production/global-setup.cjs",
  projects: [{ name: "production", testMatch: plan.files }],
  metadata: {
    environment: "production",
    mode: plan.mode,
    ...local.productionLinks(config),
  },
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
    baseURL: config.web,
    channel: config.channel,
    browserName: "chromium",
    headless: !plan.headed,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
