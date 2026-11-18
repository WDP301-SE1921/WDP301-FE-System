import local from "./settings.cjs";
import profiles from "./selection.cjs";
import runner from "./command.cjs";
import fs from "node:fs";
import path from "node:path";
import afterRun from "./after-run.cjs";
import publishing from "./publish-report.cjs";
const args = process.argv.slice(2);
const plan = profiles.selection(args);
console.log(`Playwright Production — ${plan.mode}: ${local.settings().web}`);
if (plan.write)
  console.log(
    "Live E2E fixture: 0 VND. Real AI/email may be used. " +
      (plan.keepFixture
        ? "Fixture retained for inspection; run the cleanup command afterwards."
        : "Owned fixture is cleaned automatically after the run."),
  );
const startedAt = Date.now();
process.exitCode = await runner.command(
  "node_modules/@playwright/test/cli.js",
  ["test", "-c", "playwright.production.config.ts", ...plan.playwrightArgs],
  {
    ...process.env,
    ...plan.environment,
    PLAYWRIGHT_HTML_OPEN: "never",
    PW_TEST_HTML_REPORT_OPEN: "never",
  },
);
const finish = afterRun.afterRunPlan(args, process.env, local.settings());
const resultFile =
  process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ||
  path.join(local.root, "e2e/.production-results/results.json");
if (
  finish.publish &&
  fs.existsSync(resultFile) &&
  fs.statSync(resultFile).mtimeMs >= startedAt
) {
  const record = JSON.parse(fs.readFileSync(resultFile, "utf8"));
  const archive = path.join(local.runtime, "recorded");
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(
    path.join(archive, `${publishing.publicationProfile(record)}-latest.json`),
    JSON.stringify(record),
    { mode: 0o600 },
  );
  console.log("Đang cập nhật báo cáo production online...");
  try {
    const publication = await publishing.publishReport(record);
    console.log(`Báo cáo cho team: ${publication.url}`);
  } catch (error) {
    console.error(error.message);
    console.error(
      "Kết quả test vẫn được giữ trên máy; báo cáo online chưa được xác nhận cập nhật.",
    );
  }
}
