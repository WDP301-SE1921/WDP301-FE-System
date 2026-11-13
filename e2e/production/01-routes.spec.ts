import fs from "node:fs";
import { test, expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import inventory from "./route-inventory.cjs";
import local from "./settings.cjs";
import api from "./api.cjs";
interface RouteEntry {
  route: string;
  role: string;
  dynamic: boolean;
  source: string;
}
const config = local.settings();

async function inspect(page: Page, route: string, info: TestInfo) {
  const errors: string[] = [];
  const badResponses: { url: string; status: number }[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 500 ||
      (response.status() === 404 && /\/api\//.test(response.url()))
    )
      badResponses.push({
        url: response.url().split("?")[0],
        status: response.status(),
      });
  });
  const response = await page.goto(route);
  await page
    .waitForLoadState("networkidle", { timeout: 12_000 })
    .catch(() => {});
  expect(response?.status(), route).toBe(route.startsWith("/dev/") ? 404 : 200);
  expect(page.url()).not.toContain("/login?next");
  expect(errors, "Uncaught browser errors").toEqual([]);
  expect(badResponses, "Server/API errors").toEqual([]);
  await expect(page.locator("h1").first()).toBeVisible();
  const links = await page
    .locator("a[href]")
    .evaluateAll((anchors) =>
      anchors
        .map((a) => a.getAttribute("href")!)
        .filter((h) => h.startsWith("/") && !h.startsWith("/api/")),
    );
  const evidence = { route, finalUrl: page.url(), links: [...new Set(links)] };
  await info.attach("route", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
  if (route.includes("dashboard") || route === "/manager/curriculum/overview")
    await info.attach("desktop", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
}

for (const [index, entry] of (inventory.routes as RouteEntry[])
  .filter((entry) => !entry.dynamic)
  .entries()) {
  test(`route ${String(index + 1).padStart(2, "0")} ${entry.role} ${entry.route}`, async ({
    page,
    context,
  }, info) => {
    if (entry.role !== "guest") {
      const auth = await api.ensure(entry.role);
      expect(auth, `Production ${entry.role} login is required`).toBeTruthy();
      await context.addCookies([
        {
          name: "edugrade_access",
          value: auth.tokens.accessToken,
          url: config.web,
          httpOnly: true,
          secure: true,
        },
        {
          name: "edugrade_refresh",
          value: auth.tokens.refreshToken,
          url: config.web,
          httpOnly: true,
          secure: true,
        },
      ]);
    }
    await inspect(page, entry.route, info);
  });
}

test("guest cannot open protected pages", async ({ page, request }) => {
  for (const route of [
    "/manager/dashboard",
    "/staff/dashboard",
    "/teacher/dashboard",
  ]) {
    const redirect = await request.get(config.web + route, { maxRedirects: 0 });
    expect(
      redirect.headers().location,
      "Redirect must use the public origin",
    ).toBe(config.web + "/login");
    await page.goto(route);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(
      page.getByRole("button", { name: "Đăng nhập", exact: true }),
    ).toBeVisible();
  }
});

test("wrong role receives HTTP 403", async ({ browser }) => {
  for (const [role, route] of [
    ["staff", "/manager/dashboard"],
    ["teacher", "/staff/payments"],
    ["designer", "/manager/system/staff"],
  ]) {
    const context = await browser.newContext();
    try {
      const auth = await api.ensure(role);
      await context.addCookies([
        {
          name: "edugrade_access",
          value: auth.tokens.accessToken,
          url: config.web,
          secure: true,
          httpOnly: true,
        },
      ]);
      const page = await context.newPage();
      const response = await page.goto(config.web + route);
      expect(response?.status(), `${role} ${route}`).toBe(403);
      await expect(
        page.getByRole("heading", { name: "Không có quyền truy cập" }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  }
});

test("public route constants resolve", async ({ request }) => {
  const source = fs.readFileSync(
    `${local.root}/src/constants/routes.ts`,
    "utf8",
  );
  const section = source.slice(
    source.indexOf("PUBLIC:"),
    source.indexOf("AUTH:"),
  );
  const routes = [...section.matchAll(/"(\/[^"\n]*)"/g)].map(
    (match) => match[1],
  );
  for (const route of routes)
    expect((await request.get(config.web + route)).status(), route).toBe(200);
});
