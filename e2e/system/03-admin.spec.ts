import fs from "node:fs";
import path from "node:path";
import { test, expect } from "../demo/world";
import environment from "../demo/environment.cjs";
const admin = path.resolve(environment.root, "../WDP301-ADMIN-System");
const navigation = fs.readFileSync(
  path.join(admin, "src/app/navigation.js"),
  "utf8",
);
const routes = [...navigation.matchAll(/path: '([^']+)'/g)].map(
  (match) => match[1],
);

test("admin all routes and live API", async ({ page, world }, info) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500)
      problems.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.goto("http://localhost:5173/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@edugrade.local");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(environment.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/overview$/);
  const f = await world.fixture("admin route");
  const all = [
    ...routes,
    `/accounts/${f.users.staff.id}`,
    `/parents/${f.users.parent.id}`,
    `/students/${f.student.id}`,
    `/academic/classes/${f.classroom.id}`,
  ];
  for (const route of all)
    await test.step(route, async () => {
      await page.goto(`http://localhost:5173${route}`);
      await page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => {});
      await expect(page.locator("h1").first()).toBeVisible();
      expect(page.url()).not.toContain("/login");
      await expect(page.getByText("Dữ liệu mẫu", { exact: true })).toHaveCount(
        0,
      );
      await page.setViewportSize({ width: 390, height: 844 });
      const width = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const settledWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      if (width > 391)
        await info.attach(`overflow ${route}`, {
          body: JSON.stringify(
            await page.locator("body *").evaluateAll((elements) =>
              elements
                .filter(
                  (element) =>
                    element.getBoundingClientRect().right > 391 &&
                    element.getBoundingClientRect().width > 390,
                )
                .slice(0, 12)
                .map((element) => ({
                  tag: element.tagName,
                  class: element.className,
                  width: element.getBoundingClientRect().width,
                  display: getComputedStyle(element).display,
                  columns: getComputedStyle(element).gridTemplateColumns,
                })),
            ),
            null,
            2,
          ),
          contentType: "application/json",
        });
      expect.soft(settledWidth, route).toBeLessThanOrEqual(391);
      if (route === "/overview" || route === "/accounts")
        await info.attach(`admin ${route.slice(1)}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      await page.setViewportSize({ width: 1440, height: 900 });
    });
  expect(problems).toEqual([]);
});
