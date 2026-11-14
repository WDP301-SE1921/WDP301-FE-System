import { test, expect, day, unique, select, confirm } from "./world";
import files from "./files.cjs";

test("03 - Giao bài và chấm điểm", async ({ world, actors }, info) => {
  const fixture = await world.fixture("homework");
  const teacher = await actors.open("teacher");
  const title = unique("Bài tập phương trình");
  let assignmentId = "",
    submissionId = "";
  await test.step("Giáo viên soạn và giao hai câu tự luận bằng giao diện thật", async () => {
    await teacher.goto("/teacher/assignments/new");
    await select(teacher, "Lớp được giao", fixture.classroom.name);
    await teacher.locator("#assignment-title").fill(title);
    await teacher
      .locator("#assignment-instructions")
      .fill("Làm bài ra giấy rồi gửi ảnh hoặc PDF riêng cho từng câu.");
    await teacher.locator("#assignment-due").fill(day(7));
    for (let i = 0; i < 2; i++) {
      if (i)
        await teacher
          .getByRole("button", { name: "Thêm câu hỏi", exact: true })
          .click();
      await teacher
        .locator(`#question-${i}-prompt`)
        .fill(`Câu ${i + 1}: Giải phương trình 2x + 3 = 7.`);
      await teacher.locator(`#question-${i}-max`).fill("5");
      await teacher
        .locator(`#legacy-rubric-${i}`)
        .fill("Biến đổi 2x = 4: 3 điểm; kết luận x = 2: 2 điểm.");
    }
    const saved = teacher.waitForResponse(
      (response) =>
        response.url().endsWith("/academic/assignments") &&
        response.request().method() === "POST",
    );
    await teacher
      .getByRole("button", { name: "Lưu đề, tiếp: giao bài", exact: true })
      .click();
    const response = await saved;
    expect(response.ok()).toBe(true);
    assignmentId = (await response.json()).data.id;
    await teacher.waitForURL(/\/submissions/);
    await teacher
      .getByRole("button", { name: "Chọn tất cả", exact: true })
      .click();
    await teacher
      .getByRole("checkbox", {
        name: "Tôi đã kiểm tra đề bài và danh sách học sinh nhận bài.",
        exact: true,
      })
      .check();
    await teacher
      .getByRole("button", { name: "Giao bài", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await world.db.assignment.findUniqueOrThrow({
              where: { id: assignmentId },
            })
          ).status,
      )
      .toBe("PUBLISHED");
    await actors.shot(teacher, "03-assignment-published");
  });
  const parent = await actors.open("parent");
  await test.step("Phụ huynh thay mặt con nộp ảnh câu 1 và PDF câu 2, không mất liên kết câu", async () => {
    await parent.goto(
      `/assignments/${assignmentId}?studentId=${fixture.student.id}`,
    );
    await expect(parent.getByText(title, { exact: true })).toBeVisible();
    await expect(
      parent.getByRole("button", {
        name: "Chọn ảnh bài làm câu 1 có sẵn",
        exact: true,
      }),
    ).toBeVisible();
    const imagePage = await teacher.context().newPage();
    await imagePage.setContent(
      '<main style="padding:40px;font:28px Georgia;background:white;color:black"><h1>Câu 1</h1><p>2x + 3 = 7</p><p>2x = 4</p><p>x = 2</p></main>',
    );
    const png = await imagePage.screenshot();
    await imagePage.close();
    const imageUpload = parent.waitForResponse(
      (response) =>
        response.url().endsWith("/academic/files") &&
        response.request().method() === "POST",
    );
    const chooseImage = parent.waitForEvent("filechooser");
    await parent
      .getByRole("button", {
        name: "Chọn ảnh bài làm câu 1 có sẵn",
        exact: true,
      })
      .click();
    await (
      await chooseImage
    ).setFiles({ name: "cau-1.png", mimeType: "image/png", buffer: png });
    expect((await imageUpload).ok()).toBe(true);
    const pdfUpload = parent.waitForResponse(
      (response) =>
        response.url().endsWith("/academic/files") &&
        response.request().method() === "POST",
    );
    const choosePdf = parent.waitForEvent("filechooser");
    await parent
      .getByRole("button", { name: "Chọn file PDF bài làm câu 2", exact: true })
      .click();
    await (
      await choosePdf
    ).setFiles({
      name: "cau-2.pdf",
      mimeType: "application/pdf",
      buffer: await files.answerPdf(),
    });
    expect((await pdfUpload).ok()).toBe(true);
    await expect(
      parent.getByRole("button", { name: "Nộp bài", exact: true }),
    ).toBeEnabled();
    await actors.shot(parent, "03-files-per-question");
    await parent.getByRole("button", { name: "Nộp bài", exact: true }).click();
    const submitted = parent.waitForResponse(
      (response) =>
        response.url().endsWith("/academic/submissions") &&
        response.request().method() === "POST",
    );
    await parent
      .getByRole("button", { name: "Xác nhận nộp", exact: true })
      .click();
    const response = await submitted;
    expect(response.ok()).toBe(true);
    submissionId = (await response.json()).data.id;
    const stored = await world.db.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { files: true },
    });
    const answers = stored.answers as {
      questionId: string;
      fileIds?: string[];
    }[];
    expect(answers).toHaveLength(2);
    expect(answers.every((answer) => answer.fileIds?.length === 1)).toBe(true);
    expect(answers[0].fileIds?.[0]).not.toBe(answers[1].fileIds?.[0]);
    expect(stored.files).toHaveLength(2);
  });
  await test.step("AI chỉ gợi ý, chưa lưu điểm và phụ huynh chưa thấy điểm", async () => {
    await teacher.goto(
      `/teacher/grading/${submissionId}?assignmentId=${assignmentId}`,
    );
    await teacher
      .getByRole("button", { name: "Gợi ý AI", exact: true })
      .click();
    await expect(
      teacher.getByRole("button", {
        name: "Dùng gợi ý AI cho các câu đã đọc",
        exact: true,
      }),
    ).toBeVisible({ timeout: 60_000 });
    expect(await world.db.gradeReview.count({ where: { submissionId } })).toBe(
      0,
    );
    const visible = await world.call<{ publishedGrades?: unknown[] }>(
      "parent",
      `academic/me/students/${fixture.student.id}/grades`,
    );
    expect(JSON.stringify(visible)).not.toContain(title);
    await actors.shot(teacher, "03-ai-suggestion-only");
    await teacher
      .getByRole("button", {
        name: "Dùng gợi ý AI cho các câu đã đọc",
        exact: true,
      })
      .click();
    await teacher
      .locator("#grade-feedback")
      .fill("Đã kiểm tra bài làm và xác nhận lời giải đúng.");
    const draftSaved = teacher.waitForResponse(
      (response) =>
        response.url().endsWith(`/submissions/${submissionId}/grades`) &&
        response.request().method() === "POST",
    );
    await teacher
      .getByRole("button", { name: "Lưu nháp", exact: true })
      .click();
    expect((await draftSaved).ok()).toBe(true);
    expect(
      (
        await world.db.gradeReview.findFirstOrThrow({
          where: { submissionId },
          orderBy: { revision: "desc" },
        })
      ).status,
    ).toBe("DRAFT");
    await parent.reload();
    await expect(
      parent.getByText("Đã kiểm tra bài làm và xác nhận lời giải đúng.", {
        exact: false,
      }),
    ).toHaveCount(0);
  });
  await test.step("Giáo viên xác nhận gửi điểm, phụ huynh mới đọc được điểm và nhận xét đã công bố", async () => {
    await teacher
      .getByRole("button", { name: "Gửi điểm", exact: true })
      .click();
    await confirm(teacher, "Xác nhận gửi điểm");
    await expect
      .poll(
        async () =>
          (
            await world.db.gradeReview.findFirstOrThrow({
              where: { submissionId },
              orderBy: { revision: "desc" },
            })
          ).status,
      )
      .toBe("PUBLISHED");
    await parent.reload();
    await expect(
      parent.getByText("Đã kiểm tra bài làm và xác nhận lời giải đúng.", {
        exact: false,
      }),
    ).toBeVisible();
    await actors.shot(parent, "03-parent-published-grade");
    const providers = await (await fetch("http://127.0.0.1:3900")).json();
    expect(
      providers.calls.some((call: { kind: string }) => call.kind === "grading"),
    ).toBe(true);
    await info.attach("External provider boundary", {
      body: Buffer.from(
        "AI reading/grading uses a deterministic local provider. Real model accuracy is not verified. All application APIs, files and grade publication are real.",
      ),
      contentType: "text/plain",
    });
  });
});
