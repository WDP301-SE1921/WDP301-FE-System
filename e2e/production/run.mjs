import { spawn } from "node:child_process";
import local from "./settings.cjs";
const args = process.argv.slice(2);
const write = args.includes("--write"),
  providers = args.includes("--providers");
async function command(script, extra = []) {
  const status = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...extra], {
      cwd: local.root,
      env: {
        ...process.env,
        E2E_HEADED: args.includes("--headed") ? "1" : "0",
        E2E_RECHECK_AI: args.includes("--recheck-ai") ? "1" : "0",
      },
      windowsHide: true,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", resolve);
  });
  return typeof status === "number" ? status : 1;
}
if (await command("e2e/production/prepare.mjs")) process.exit(1);
if (write && (await command("e2e/production/fixture.mjs"))) process.exit(1);
const files = [
  "01-routes",
  "02-api",
  ...(providers ? ["03-providers"] : []),
  ...(write
    ? ["04-business", "05-dynamic-routes", "06-curriculum", "07-attachments"]
    : []),
];
process.exitCode = await command("node_modules/@playwright/test/cli.js", [
  "test",
  "-c",
  "playwright.production.config.ts",
  ...files,
  ...args.filter(
    (arg) =>
      !["--write", "--providers", "--headed", "--recheck-ai"].includes(arg),
  ),
]);
