import fs from "node:fs";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";
test("production HTTPS image preview displays uploaded work", async ({
  page,
  context,
}, info) => {
  const f = JSON.parse(fs.readFileSync(`${api.runtime}/fixture.json`, "utf8"));
  const auth = await api.ensure("teacher");
  await context.addCookies([
    {
      name: "edugrade_access",
      value: auth.tokens.accessToken,
      url: api.config.web,
      secure: true,
      httpOnly: true,
    },
  ]);
  await page.goto(`/teacher/grading/${f.submission.id}`);
  const file = page.getByRole("region", { name: "Tệp bài làm 1", exact: true });
  await file.getByRole("button", { name: "Xem tệp", exact: true }).click();
  const image = file.getByRole("img", {
    name: "Bài làm của học sinh, tệp 1",
    exact: true,
  });
  await expect(image).toBeVisible();
  await expect
    .poll(
      () =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      { timeout: 15000 },
    )
    .toBe(true);
  await info.attach("HTTPS image preview", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
