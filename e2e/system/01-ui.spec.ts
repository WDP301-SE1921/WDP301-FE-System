import { test, expect } from "@playwright/test";

for (const route of [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
]) {
  test(`form header ${route}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await info.attach("mobile form", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}
