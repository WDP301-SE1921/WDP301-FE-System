import fs from "node:fs";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";
import inventory from "./route-inventory.cjs";
interface Entry {
  route: string;
  role: string;
  dynamic: boolean;
}
for (const [index, entry] of (inventory.routes as Entry[])
  .filter((entry) => entry.dynamic)
  .entries()) {
  test(`detail ${index + 1} ${entry.route}`, async ({
    page,
    context,
  }, info) => {
    const f = JSON.parse(
      fs.readFileSync(`${api.runtime}/fixture.json`, "utf8"),
    );
    const id = entry.route.includes("/catalog/programs/")
      ? f.program.id
      : entry.route.includes("/classes/")
        ? f.classroom.id
        : entry.route.includes("/students/")
          ? f.student.id
          : entry.route.includes("/parents/")
            ? api.session("parent").user.id
            : entry.route.includes("/teachers/")
              ? api.session("teacher").user.id
              : entry.route.includes("/system/staff/")
                ? api.session("staff").user.id
                : entry.route.includes("/curriculum/")
                  ? f.unit.id
                  : entry.route.includes("/attendance/")
                    ? f.session.id
                    : entry.route.includes("/grading/")
                      ? f.submission.id
                      : f.assignment.id;
    const auth = await api.ensure(entry.role);
    await context.addCookies([
      {
        name: "edugrade_access",
        value: auth.tokens.accessToken,
        url: api.config.web,
        secure: true,
        httpOnly: true,
      },
    ]);
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500)
        problems.push(
          `${response.status()} ${new URL(response.url()).pathname}`,
        );
    });
    const response = await page.goto(entry.route.replace(/\[[^\]]+\]/g, id));
    await page
      .waitForLoadState("networkidle", { timeout: 12000 })
      .catch(() => {});
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(problems).toEqual([]);
    await info.attach("production detail", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}
