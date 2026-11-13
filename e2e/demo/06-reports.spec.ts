import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test, expect, day } from "./world";
import environment from "./environment.cjs";

test("06 - Báo cáo học tập và xuất file", async ({ world, actors }, info) => {
  const f = await world.fixture("report");
  const locked = await world.session(f, -2, "08:00", { status: "COMPLETED" });
  await world.db.sessionParticipant.create({
    data: {
      sessionId: locked.id,
      enrollmentId: f.enrollment!.id,
      attendance: "PRESENT",
    },
  });
  const unlocked = await world.session(f, -1, "08:00");
  await world.db.sessionParticipant.create({
    data: {
      sessionId: unlocked.id,
      enrollmentId: f.enrollment!.id,
      attendance: "ABSENT",
    },
  });
  // Arrange one published result and one draft result for the same student.
  const created = await world.call<{ id: string; questions: { id: string }[] }>(
    "teacher",
    "academic/assignments",
    "POST",
    {
      classId: f.classroom.id,
      title: "E2E report source",
      instructions: "Trả lời",
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxAttempts: 2,
      questions: [
        { kind: "ESSAY", prompt: "2x + 3 = 7", rubric: "x = 2", maxScore: 10 },
      ],
    },
  );
  await world.call(
    "teacher",
    `academic/assignments/${created.id}/publish`,
    "POST",
    { enrollmentIds: [f.enrollment!.id] },
  );
  const recipient = await world.db.assignmentRecipient.findFirstOrThrow({
    where: { assignmentId: created.id },
  });
  const submission = await world.call<{ id: string }>(
    "parent",
    "academic/submissions",
    "POST",
    {
      recipientId: recipient.id,
      answers: [{ questionId: created.questions[0].id, answer: "x = 2" }],
    },
  );
  const grade = await world.call<{ id: string }>(
    "teacher",
    `academic/submissions/${submission.id}/grades`,
    "POST",
    {
      feedback: "Kết quả đã công bố",
      scores: [
        { questionId: created.questions[0].id, score: 8, feedback: "Đúng" },
      ],
    },
  );
  await world.call("teacher", `academic/grades/${grade.id}/approve`, "POST");
  await world.call("teacher", `academic/grades/${grade.id}/publish`, "POST");
  const draftSubmission = await world.call<{ id: string }>(
    "parent",
    "academic/submissions",
    "POST",
    {
      recipientId: recipient.id,
      answers: [{ questionId: created.questions[0].id, answer: "x = 20" }],
    },
  );
  await world.call(
    "teacher",
    `academic/submissions/${draftSubmission.id}/grades`,
    "POST",
    {
      feedback: "Điểm nháp không được đưa vào báo cáo",
      scores: [
        {
          questionId: created.questions[0].id,
          score: 1,
          feedback: "Chưa công bố",
        },
      ],
    },
  );
  const teacher = await actors.open("teacher");
  let reportId = "";
  await test.step("Giáo viên chọn lớp và khoảng ngày, yêu cầu AI tóm tắt", async () => {
    await teacher.goto(`/teacher/reports?classId=${f.classroom.id}`);
    await expect(
      teacher.getByRole("heading", { name: "Báo cáo học tập", exact: true }),
    ).toBeVisible();
    await teacher.getByLabel("Từ ngày", { exact: true }).fill(day(-10));
    await teacher.getByLabel("Đến ngày", { exact: true }).fill(day());
    await teacher
      .getByRole("checkbox", {
        name: "Yêu cầu AI viết nhận xét từ số liệu",
        exact: true,
      })
      .check();
    const responsePromise = teacher.waitForResponse(
      (response) =>
        response.url().endsWith("/academic/reports") &&
        response.request().method() === "POST",
    );
    await teacher
      .getByRole("button", { name: "Tạo báo cáo", exact: true })
      .click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    const report = (await response.json()).data;
    reportId = report.id;
    expect(report.aiSummary).toContain("Tóm tắt kiểm thử:");
    expect(report.snapshot.rows).toHaveLength(1);
    expect(report.snapshot.rows[0]).toMatchObject({
      studentId: f.student.id,
      required: 1,
      attended: 1,
      attendancePercent: 100,
      publishedGrades: 1,
      averageScore: 80,
    });
    await actors.shot(teacher, "06-report-created");
  });
  await test.step("Tải PDF và Excel, kiểm tra nội dung file thay vì chỉ bấm nút", async () => {
    const row = teacher.getByRole("row").filter({ hasText: f.classroom.name });
    for (const [button, extension, magic] of [
      ["Tải PDF", "pdf", "%PDF"],
      ["Tải Excel", "xlsx", "PK"],
    ]) {
      const downloadPromise = teacher.waitForEvent("download");
      await row.getByRole("button", { name: button, exact: true }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(
        new RegExp(`\\.${extension}$`),
      );
      const saved = info.outputPath(`bao-cao.${extension}`);
      await download.saveAs(saved);
      const bytes = fs.readFileSync(saved);
      expect(bytes.length).toBeGreaterThan(500);
      expect(bytes.subarray(0, magic.length).toString()).toBe(magic);
      await info.attach(`Báo cáo ${extension}`, {
        path: saved,
        contentType:
          extension === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      if (extension === "xlsx") {
        const require = createRequire(
          path.join(environment.backend, "package.json"),
        );
        const { Workbook } = require("exceljs");
        const workbook = new Workbook();
        await workbook.xlsx.load(bytes);
        expect(
          JSON.stringify(
            workbook.worksheets.map((sheet: { getSheetValues(): unknown }) =>
              sheet.getSheetValues(),
            ),
          ),
        ).toContain(f.student.fullName);
      }
    }
  });
  await test.step("Báo cáo là snapshot: thay đổi dữ liệu nguồn không làm đổi bản đã lưu", async () => {
    const before = await world.db.learningReport.findUniqueOrThrow({
      where: { id: reportId },
    });
    await world.db.sessionParticipant.updateMany({
      where: { sessionId: locked.id },
      data: { attendance: "ABSENT" },
    });
    const after = await world.db.learningReport.findUniqueOrThrow({
      where: { id: reportId },
    });
    expect(after.snapshot).toEqual(before.snapshot);
    expect(after.aiSummary).toBe(before.aiSummary);
    const denied = await world.raw(
      "staff",
      `academic/reports/${reportId}/download?format=pdf`,
    );
    expect(denied.status).toBe(403);
  });
});
