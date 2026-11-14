import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";
import local from "./settings.cjs";

const origin = "https://admin.edugrade.45.77.168.110.sslip.io";
const navigation = fs.readFileSync(
  path.resolve(local.root, "../WDP301-ADMIN-System/src/app/navigation.js"),
  "utf8",
);
const routes = [...navigation.matchAll(/path: '([^']+)'/g)].map(
  (match) => match[1],
);

test("production Admin all routes use the real API without mobile overflow", async ({
  page,
}, info) => {
  const f = JSON.parse(fs.readFileSync(`${api.runtime}/fixture.json`, "utf8"));
  await api.ensure("staff");
  await api.ensure("parent");
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500)
      problems.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.goto(`${origin}/login`);
  await page
    .getByLabel("Email", { exact: true })
    .fill(api.config.accounts.admin);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(api.config.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(`${origin}/overview`);
  const all = [
    ...routes,
    `/accounts/${api.session("staff").user.id}`,
    `/parents/${api.session("parent").user.id}`,
    `/students/${f.student.id}`,
    `/academic/classes/${f.classroom.id}`,
  ];
  for (const route of all) {
    await test.step(route, async () => {
      const response = await page.goto(`${origin}${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(route);
      await expect(page.getByText("Dữ liệu mẫu", { exact: true })).toHaveCount(
        0,
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(391);
      if (route === "/overview" || route === "/permissions")
        await info.attach(`production Admin ${route.slice(1)}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      await page.setViewportSize({ width: 1440, height: 900 });
    });
  }
  expect(problems).toEqual([]);
});
