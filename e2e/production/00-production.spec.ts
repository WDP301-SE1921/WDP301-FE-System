import { test, expect } from "@playwright/test";
import local from "./settings.cjs";

const links = local.productionLinks();

test("Production web — live entry page and team links", async ({
  page,
}, info) => {
  const response = await page.goto(links.web);
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await info.attach("Production links", {
    body: `<!doctype html><html lang="vi"><meta charset="utf-8"><title>EduGrade Production</title><h1>EduGrade Production</h1><ul>${Object.entries(
      links,
    )
      .map(
        ([name, url]) =>
          `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name}: ${url}</a></li>`,
      )
      .join("")}</ul></html>`,
    contentType: "text/html",
  });
});

test("Production API — database readiness", async ({ request }) => {
  const response = await request.get(links.health);
  expect(response.status()).toBe(200);
  expect((await response.json()).data).toMatchObject({
    status: "ok",
    dependencies: { database: "up" },
  });
});

test("Production Admin — live sign-in page", async ({ page }) => {
  const response = await page.goto(`${links.admin}/login`);
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
});
