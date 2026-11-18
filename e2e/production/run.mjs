import local from "./settings.cjs";
import profiles from "./selection.cjs";
import runner from "./command.cjs";
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
process.exitCode = await runner.command(
  "node_modules/@playwright/test/cli.js",
  ["test", "-c", "playwright.production.config.ts", ...plan.playwrightArgs],
  { ...process.env, ...plan.environment },
);
