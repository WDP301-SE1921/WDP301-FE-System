import { defineConfig } from "@playwright/test";
import path from "node:path";
const cwd = path.resolve(__dirname, "../..");
export default defineConfig({
  testDir: ".",
  testMatch: "rubric.spec.ts",
  outputDir: "../.results/rubric",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:3101",
    channel: "chrome",
    locale: "vi-VN",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      cwd,
      command: "node e2e/rubric/mock-backend.mjs",
      url: "http://127.0.0.1:3100/health",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      cwd,
      command: "node node_modules/next/dist/bin/next start -p 3101",
      url: "http://127.0.0.1:3101/login",
      env: { BACKEND_API_URL: "http://127.0.0.1:3100/api/v1" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
