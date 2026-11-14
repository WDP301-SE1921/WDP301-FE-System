import { test, expect, day, unique, select, confirm } from "./world";

test("01 - Giáo trình và lịch học", async ({ world, actors }) => {
  const fixture = await world.fixture("curriculum", { enroll: false });
  const count = await world.db.program.count({
    where: { name: { startsWith: "E2E curriculum" } },
  });
  const from = day(3 + count * 7),
    to = day(9 + count * 7);
  const title = unique("Giáo trình demo");
  const unit = await world.call<{ id: string }>(
    "designer",
    "academic/curriculum-units",
    "POST",
    { programId: fixture.program.id, title, fromDate: from, toDate: to },
  );
  const designer = await actors.open("designer");
  const lessons = [unique("Bài 1"), unique("Bài 2")];
  await test.step("Nhập CSV vào giáo trình thật và kiểm tra dữ liệu lưu", async () => {
    await designer.goto(`/manager/curriculum/${unit.id}`);
    await designer
      .getByRole("button", { name: "Thêm thao tác với giáo trình" })
      .click();
    await designer.getByRole("menuitem", { name: "Nhập bài từ file" }).click();
    const dialog = designer.getByRole("dialog", { name: /Nhập bài từ file/ });
    await dialog.locator("#curriculum-csv").setInputFiles({
      name: "giao-trinh-demo.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        [
          "kind,sequence,title,content,monthKey,csvVersion",
          ...lessons.map(
            (name, i) => `LESSON,${i + 1},${name},Nội dung bài học ${i + 1},,`,
          ),
        ].join("\n"),
      ),
    });
    await dialog.getByRole("button", { name: "Kiểm tra file" }).click();
    await expect(dialog.getByText("2 dòng hợp lệ")).toBeVisible();
    await dialog.getByRole("button", { name: "Nhập vào bản nháp" }).click();
    await expect(dialog.getByText("Đã nhập 2 bài học.")).toBeVisible();
    await designer.keyboard.press("Escape");
    await expect(
      designer.getByRole("heading", { name: "Bài học (2)" }),
    ).toBeVisible();
    expect(
      (
        await world.db.lesson.findMany({
          where: { unitId: unit.id },
          orderBy: { sequence: "asc" },
        })
      ).map((row) => row.title),
    ).toEqual(lessons);
    await actors.shot(designer, "01-imported");
  });
  await test.step("Gửi duyệt; cả giao diện và API đều khóa sửa nháp", async () => {
    await designer.getByRole("button", { name: "Gửi duyệt" }).first().click();
    const dialog = designer.getByRole("dialog").last();
    await select(
      designer,
      "Giáo viên duyệt nội dung",
      /teacher@edugrade\.local/,
    );
    await dialog.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(
      designer.getByText(/Chờ giáo viên duyệt/).first(),
    ).toBeVisible();
    await expect(
      designer.getByRole("button", { name: "Thêm bài học", exact: true }),
    ).toHaveCount(0);
    const response = await world.raw(
      "designer",
      `academic/curriculum-units/${unit.id}`,
      "PATCH",
      { title: "Không được sửa khi chờ duyệt" },
    );
    expect(response.status).toBe(409);
    expect(
      (
        await world.db.curriculumUnit.findUniqueOrThrow({
          where: { id: unit.id },
        })
      ).title,
    ).toBe(title);
  });
  const comment = unique("Nội dung đủ rõ; đề nghị áp dụng");
  await test.step("Giáo viên duyệt nội dung kèm nhận xét", async () => {
    const teacher = await actors.open("teacher");
    await teacher.goto(`/teacher/curriculum/${unit.id}`);
    await teacher
      .getByRole("button", { name: "Duyệt nội dung" })
      .first()
      .click();
    const decision = teacher.locator("#curriculum-decision");
    await decision.getByLabel("Nhận xét nội dung (tùy chọn)").fill(comment);
    await decision.getByRole("button", { name: "Duyệt nội dung" }).click();
    await expect(teacher.getByText(/Chờ Quản lý duyệt/).first()).toBeVisible();
    await actors.shot(teacher, "01-teacher-reviewed");
  });
  await test.step("Quản lý thấy nhận xét trước khi duyệt và tạo đúng hai buổi", async () => {
    const manager = await actors.open("manager");
    await manager.goto(`/manager/curriculum/${unit.id}`);
    await expect(manager.getByText(comment, { exact: true })).toBeVisible();
    await manager
      .getByRole("button", { name: "Duyệt áp dụng", exact: true })
      .click();
    await confirm(manager, "Duyệt áp dụng");
    await manager.waitForURL(/\/manager\/sessions/);
    await manager.goto(
      `/manager/sessions?programId=${fixture.program.id}&classIds=${fixture.classroom.id}&unitId=${unit.id}`,
    );
    const table = manager
      .getByRole("region", { name: "Xem trước theo lớp" })
      .getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(3);
    await manager
      .getByRole("button", { name: "Tạo lịch học cho 1 lớp", exact: true })
      .click();
    await expect(
      manager.getByText("Đã tạo 2 buổi", { exact: false }),
    ).toBeVisible();
    const saved = await world.db.classSession.findMany({
      where: { classId: fixture.classroom.id },
      include: { lesson: true },
      orderBy: { startsAt: "asc" },
    });
    expect(saved.map((row) => row.lesson.title)).toEqual(lessons);
    expect(saved.every((row) => row.status === "SCHEDULED")).toBe(true);
    await actors.shot(manager, "01-schedule-generated");
  });
});
