import fs from "node:fs";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";
test("production curriculum teacher review and manager approval", async ({
  page,
  context,
}, info) => {
  const file = `${api.runtime}/fixture.json`,
    f = JSON.parse(fs.readFileSync(file, "utf8"));
  const save = () => fs.writeFileSync(file, JSON.stringify(f, null, 2));
  let unit = await api.call(
    "designer",
    `academic/curriculum-units/${f.unit.id}`,
  );
  if (unit.status === "DRAFT") {
    if (!unit.lessons.length)
      await api.call(
        "designer",
        `academic/curriculum-units/${f.unit.id}/lessons`,
        "POST",
        {
          title: `${f.prefix} reviewed lesson`,
          content: "Phương trình 2x + 3 = 7. Lời giải x = 2.",
          sequence: 1,
        },
      );
    await api.call(
      "designer",
      `academic/curriculum-units/${f.unit.id}/submit`,
      "POST",
      { reviewerTeacherId: api.session("teacher").user.id },
    );
    unit = await api.call("teacher", `academic/curriculum-units/${f.unit.id}`);
  }
  if (!unit.technicalReviewedAt) {
    await api.call(
      "teacher",
      `academic/curriculum-units/${f.unit.id}/technical-review`,
      "POST",
      {
        approved: true,
        note: `${f.prefix} teacher checked the content.`,
        expectedRevision: unit.revision,
      },
    );
  }
  unit = await api.call("manager", `academic/curriculum-units/${f.unit.id}`);
  if (unit.status !== "APPROVED")
    await api.call(
      "manager",
      `academic/curriculum-units/${f.unit.id}/approve`,
      "POST",
    );
  unit = await api.call("manager", `academic/curriculum-units/${f.unit.id}`);
  expect(unit.status).toBe("APPROVED");
  f.unit = unit;
  save();
  const auth = await api.ensure("manager");
  await context.addCookies([
    {
      name: "edugrade_access",
      value: auth.tokens.accessToken,
      url: api.config.web,
      secure: true,
      httpOnly: true,
    },
  ]);
  await page.goto(`/manager/curriculum/${unit.id}`);
  await expect(page.locator("h1").first()).toBeVisible();
  await info.attach("reviewed production curriculum", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
