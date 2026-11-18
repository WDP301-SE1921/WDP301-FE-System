import { test, expect, API, WEB, day, select, unique } from "../demo/world";

test("@updates Danh mục môn học và liên hệ công khai dùng dữ liệu thật, không cần đăng nhập", async ({
  world,
  browser,
}, info) => {
  const subjectResponse = await fetch(`${API}/center/subjects`);
  expect(subjectResponse.status).toBe(200);
  const subjects = (await subjectResponse.json()).data as {
    id: string;
    code: string;
    name: string;
  }[];
  const expected = await world.db.subject.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, code: true, name: true },
  });
  expect(subjects).toEqual(expected);
  expect(subjects.length).toBeGreaterThan(0);
  const centerResponse = await fetch(`${API}/center`);
  expect(centerResponse.status).toBe(200);
  const center = (await centerResponse.json()).data as Record<
    "phone" | "email" | "address" | "openingHours",
    string | null
  >;
  const context = await browser.newContext({
    baseURL: WEB,
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await context.newPage();
    // The standard runner builds Next before starting the API. The landing must still read
    // the real catalog on the first served request, rather than freeze the build-time fallback.
    expect((await page.goto("/"))?.ok()).toBe(true);
    const subjectSection = page.locator("#subjects");
    for (const subject of subjects)
      await expect(
        subjectSection.getByText(subject.name, { exact: true }),
      ).toBeVisible();
    for (const field of [
      "phone",
      "email",
      "address",
      "openingHours",
    ] as const) {
      const value = center[field]?.trim();
      if (value)
        await expect(
          page.locator("#contact").getByText(value, { exact: true }),
        ).toBeVisible();
    }
    for (const label of ["Chính sách quyền riêng tư", "Xoá tài khoản"]) {
      const link = page.getByRole("link", { name: label, exact: true });
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
      expect((await page.request.get(href!)).status()).toBe(200);
    }
    await info.attach("public-center", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  } finally {
    await context.close();
  }
});

test("@updates Giáo trình kỳ mới: nhãn kỳ học rõ ràng, form vừa màn hình và lưu đúng ngày", async ({
  world,
  actors,
}) => {
  const f = await world.fixture("curriculum term UI", { enroll: false });
  const designer = await actors.open("designer");
  await designer.setViewportSize({ width: 1280, height: 900 });
  await designer.goto(
    `/manager/curriculum?tab=curriculum&programId=${f.program.id}`,
  );
  await designer
    .getByRole("button", { name: "Tạo giáo trình", exact: true })
    .click();
  await expect(
    designer.getByRole("group", { name: "Kỳ học áp dụng", exact: true }),
  ).toBeVisible();
  await expect(
    designer.getByLabel("Ngày bắt đầu kỳ", { exact: true }),
  ).toBeVisible();
  await expect(
    designer.getByLabel("Ngày kết thúc kỳ", { exact: true }),
  ).toBeVisible();
  await select(designer, "Khóa học", new RegExp(f.program.name));
  await select(designer, "Nguồn bài học", "Soạn từ đầu");
  const title = unique("Giáo trình kỳ mới");
  await designer.locator("#unit-title").fill(title);
  await designer.getByLabel("Ngày bắt đầu kỳ", { exact: true }).fill(day(45));
  await designer.getByLabel("Ngày kết thúc kỳ", { exact: true }).fill(day(75));
  const form = designer
    .locator("form")
    .filter({ has: designer.locator("#unit-title") });
  const bounds = await form.boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(674);
  expect(
    await designer.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  const created = designer.waitForResponse(
    (response) =>
      response.url().endsWith("/academic/curriculum-units") &&
      response.request().method() === "POST",
  );
  await designer
    .getByRole("button", { name: "Tạo giáo trình nháp", exact: true })
    .click();
  const response = await created;
  expect(response.ok()).toBe(true);
  const unitId = (await response.json()).data.id as string;
  const unit = await world.db.curriculumUnit.findUniqueOrThrow({
    where: { id: unitId },
  });
  expect(unit.fromDate.toISOString().slice(0, 10)).toBe(day(45));
  expect(unit.toDate.toISOString().slice(0, 10)).toBe(day(75));
  expect(unit.programId).toBe(f.program.id);
  expect(unit.status).toBe("DRAFT");
  await designer.goto(
    `/manager/curriculum?tab=curriculum&programId=${f.program.id}`,
  );
  await expect(
    designer.getByRole("columnheader", { name: "Kỳ học áp dụng", exact: true }),
  ).toBeVisible();
  await expect(
    designer.getByRole("row").filter({ hasText: title }),
  ).toContainText("Bản nháp");
  await actors.shot(designer, "updates-curriculum-term");
});
