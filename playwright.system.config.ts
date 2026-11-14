import { defineConfig } from "@playwright/test";
import demo from "./playwright.demo.config";
export default defineConfig({
  ...demo,
  testDir: "./e2e",
  testMatch: ["demo/*.spec.ts", "system/*.spec.ts"],
  outputDir: "./e2e/.system-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/.system-report", open: "never" }],
    ["json", { outputFile: "e2e/.system-results/results.json" }],
  ],
});
