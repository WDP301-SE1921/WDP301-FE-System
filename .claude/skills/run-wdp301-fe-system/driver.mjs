#!/usr/bin/env node
// Headless Chrome driver for the EduGrade web app. Reads one command per line from stdin
// (pipe a heredoc). Each role gets its own browser context, logged in once per run.
//
//   node .claude/skills/run-wdp301-fe-system/driver.mjs <<'EOF'
//   as manager
//   nav /manager/curriculum
//   wait-for Khóa học & giáo trình
//   ss courses
//   errors
//   EOF
//
// Env: WEB_URL (default http://localhost:3001), SHOTS (default <os tmp>/wdp-run-shots),
// PLAYWRIGHT_DIR (folder holding node_modules/playwright-core, default ~/.cache/wdp-run-tools),
// SEED_PASSWORD (default: SEED_DEFAULT_PASSWORD from ../WDP301-BE-System/.env).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";

const WEB = (process.env.WEB_URL || "http://localhost:3001").replace(/\/$/, "");
const SHOTS = path.resolve(process.env.SHOTS || path.join(os.tmpdir(), "wdp-run-shots"));
const TOOLS = process.env.PLAYWRIGHT_DIR || path.join(os.homedir(), ".cache", "wdp-run-tools");
const { chromium } = createRequire(path.join(TOOLS, "package.json"))("playwright-core");

const ACCOUNTS = {
  manager: ["manager@edugrade.local", "/manager/dashboard"],
  staff: ["staff@edugrade.local", "/staff/dashboard"],
  teacher: ["teacher@edugrade.local", "/teacher/dashboard"],
  designer: ["designer@edugrade.local", "/manager/curriculum"],
};

function seedPassword() {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  const envFile = path.resolve("..", "WDP301-BE-System", ".env");
  const value = fs.existsSync(envFile) && parseEnv(fs.readFileSync(envFile, "utf8")).SEED_DEFAULT_PASSWORD;
  if (!value) throw new Error("Set SEED_PASSWORD (no SEED_DEFAULT_PASSWORD in " + envFile + ")");
  return value;
}

fs.mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const pages = {};
let page = null;
let shot = 0;

async function settle(ms = 400) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function as(role) {
  if (!ACCOUNTS[role]) throw new Error("Unknown role " + role + " (" + Object.keys(ACCOUNTS).join("|") + ")");
  if (pages[role]) return (page = pages[role]);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page._log = [];
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().includes("/api/")) page._log.push(`${r.request().method()} ${new URL(r.url()).pathname} -> ${r.status()}`);
  });
  page.on("pageerror", (e) => page._log.push("pageerror: " + String(e.message).slice(0, 200)));
  const [email, home] = ACCOUNTS[role];
  await page.goto(WEB + "/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(seedPassword());
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  // Wait for the role home before navigating, or the redirect races the next `nav`.
  await page.waitForURL((u) => u.pathname.startsWith(home), { timeout: 90000 });
  await settle(800);
  pages[role] = page;
  return `${role} at ${new URL(page.url()).pathname}`;
}

const flat = (s) => s.replace(/\s+/g, " ").trim();
const split = (rest) => {
  const i = rest.indexOf(" | ");
  if (i < 0) throw new Error("Use: <selector> | <value>");
  return [rest.slice(0, i), rest.slice(i + 3)];
};

const commands = {
  as,
  nav: async (route) => { await page.goto(WEB + route); await settle(); return new URL(page.url()).pathname; },
  "wait-for": async (text) => { await page.getByText(text).first().waitFor(); return "found"; },
  click: async (selector) => { await page.locator(selector).first().click(); await settle(); return "clicked"; },
  button: async (name) => { await page.getByRole("button", { name, exact: true }).first().click(); await settle(); return "clicked"; },
  fill: async (rest) => { const [sel, value] = split(rest); await page.locator(sel).first().fill(value); return "filled"; },
  // Base UI selects are not <select>: open the trigger, then click the option.
  pick: async (rest) => {
    const [sel, option] = split(rest);
    await page.locator(sel).first().click();
    await page.getByRole("option", { name: option }).first().click();
    return "picked";
  },
  text: async (sel) => flat(await page.locator(sel || "main").first().innerText()).slice(0, 600),
  value: async (sel) => page.locator(sel).first().inputValue(),
  ss: async (name) => {
    const file = path.join(SHOTS, String(++shot).padStart(2, "0") + "-" + (name || "shot") + ".png");
    await page.screenshot({ path: file });
    return file;
  },
  errors: async () => { const out = page._log.splice(0); return out.length ? out.join(" ; ") : "none"; },
  sleep: async (ms) => { await page.waitForTimeout(Number(ms)); return "ok"; },
};

const input = readline.createInterface({ input: process.stdin });
let failed = 0;
for await (const raw of input) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  if (line === "quit") break;
  const [name, ...args] = line.split(" ");
  const rest = args.join(" ");
  try {
    if (!commands[name]) throw new Error("Unknown command");
    if (name !== "as" && !page) throw new Error("Run `as <role>` first");
    console.log(`> ${line}\n  ${await commands[name](rest)}`);
  } catch (error) {
    failed++;
    console.log(`> ${line}\n  ERROR ${String(error.message || error).split("\n")[0]}`);
    if (page) await commands.ss("error").then((f) => console.log("  screenshot " + f)).catch(() => {});
  }
}
await browser.close();
process.exitCode = failed ? 1 : 0;
