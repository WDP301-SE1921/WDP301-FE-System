import { randomUUID } from "node:crypto";
import { API, test, expect, day, unique } from "../demo/world";
import {
  approveCurriculum,
  draftCurriculum,
  type CurriculumVersion,
} from "./curriculum-fixtures";

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({ error: { code } });
}

test("@latest Tạo giáo trình cần CLO; bài chưa gắn CLO không được gửi duyệt", async ({
  world,
  actors,
}) => {
  const f = await world.fixture("CLO prerequisites", { enroll: false });
  const empty = await world.call<{ id: string }>(
    "manager",
    "programs",
    "POST",
    {
      name: unique("Khóa chưa có CLO"),
      subjectId: f.program.subjectId,
      grade: 8,
      sessionsPerWeek: 2,
    },
  );
  await expectError(
    await world.raw("designer", "academic/curriculum-units", "POST", {
      programId: empty.id,
      title: unique("Chưa đủ điều kiện"),
    }),
    409,
    "OUTCOMES_REQUIRED",
  );

  const unit = await draftCurriculum(world, f);
  expect(unit.fromDate.slice(0, 10)).toBe(day());
  expect(unit.toDate.slice(0, 10)).toBe("2099-12-31");
  const missing = unit.lessons[1];
  await world.call(
    "designer",
    `academic/lessons/${missing.id}/outcomes`,
    "PATCH",
    { outcomeIds: [] },
  );
  const denied = await world.raw(
    "designer",
    `academic/curriculum-units/${unit.id}/submit`,
    "POST",
    {
      reviewerTeacherId: f.users.teacher.id,
    },
  );
  expect(denied.status).toBe(409);
  expect(await denied.json()).toMatchObject({
    error: {
      code: "LESSON_OUTCOME_MISSING",
      details: { lessonIds: [missing.id] },
    },
  });
  const designer = await actors.open("designer");
  await designer.goto(`/manager/curriculum/${unit.id}?editor=submit`);
  await designer.waitForURL(/\/manager\/curriculum\/setup\?/);
  await expect(
    designer.getByRole("heading", { name: "Bước 3: Gắn mục tiêu vào bài" }),
  ).toBeVisible();
  await expect(
    designer.getByRole("button", { name: "Gửi duyệt", exact: true }),
  ).toHaveCount(0);
  await world.call(
    "designer",
    `academic/lessons/${missing.id}/outcomes`,
    "PATCH",
    { outcomeIds: [f.outcome.id] },
  );
  const submitted = await world.call<CurriculumVersion>(
    "designer",
    `academic/curriculum-units/${unit.id}/submit`,
    "POST",
    {
      reviewerTeacherId: f.users.teacher.id,
    },
  );
  expect(submitted.status).toBe("PENDING_REVIEW");
  await expectError(
    await world.raw(
      "manager",
      `academic/curriculum-units/${unit.id}/approve`,
      "POST",
    ),
    409,
    "TECHNICAL_REVIEW_REQUIRED",
  );
  await expectError(
    await world.raw(
      "designer",
      `academic/curriculum-units/${unit.id}`,
      "PATCH",
      { title: "Sửa khi chờ duyệt" },
    ),
    409,
    "UNIT_LOCKED",
  );
});

test("@latest Bản mới thay thế ngay; lớp đang học vẫn giữ bản cũ và phụ huynh xem đúng bản", async ({
  world,
}) => {
  const f = await world.fixture("curriculum versions");
  const draft = await draftCurriculum(world, f);
  const first = await approveCurriculum(
    world,
    draft.id,
    f.users.teacher.id,
    f.outcomeSet.id,
  );
  await world.session(f, 3, "02:00", { lessonId: first.lessons[0].id });
  const next = await world.call<CurriculumVersion>(
    "designer",
    `academic/curriculum-units/${first.id}/revise`,
    "POST",
    {
      title: unique("Giáo trình bản tiếp theo"),
    },
  );
  const second = await approveCurriculum(
    world,
    next.id,
    f.users.teacher.id,
    f.outcomeSet.id,
  );
  expect(second.status).toBe("APPROVED");
  expect(second.version).toBeGreaterThan(first.version);
  expect(second.fromDate.slice(0, 10)).toBe(day());
  expect(second.toDate.slice(0, 10)).toBe("2099-12-31");
  const old = await world.call<CurriculumVersion>(
    "manager",
    `academic/curriculum-units/${first.id}`,
  );
  expect(old).toMatchObject({
    status: "ARCHIVED",
    archiveReason: "SUPERSEDED",
    supersededById: second.id,
  });
  const original = await world.db.classSession.findMany({
    where: { classId: f.classroom.id },
  });
  expect(original.map((row) => row.lessonId)).toEqual([first.lessons[0].id]);
  const preview = await world.call<{ curriculumUnitId: string }>(
    "manager",
    `academic/classes/${f.classroom.id}/session-preview`,
    "POST",
    { fromDate: day(10) },
  );
  expect(preview.curriculumUnitId).toBe(first.id);
  const newClass = await world.call<{ id: string }>(
    "manager",
    "classes",
    "POST",
    {
      programId: f.program.id,
      name: unique("Lớp dùng bản mới"),
      roomId: f.room.id,
      teacherId: f.users.teacher.id,
      monthlyFee: 0,
    },
  );
  await world.db.classWeeklySchedule.createMany({
    data: [
      {
        classId: newClass.id,
        weekday: 2,
        startTime: "02:00",
        endTime: "03:00",
      },
      {
        classId: newClass.id,
        weekday: 4,
        startTime: "02:00",
        endTime: "03:00",
      },
    ],
  });
  const newPreview = await world.call<{ curriculumUnitId: string }>(
    "manager",
    `academic/classes/${newClass.id}/session-preview`,
    "POST",
    { fromDate: day(10) },
  );
  expect(newPreview.curriculumUnitId).toBe(second.id);
  const parent = await world.call<{ items: { id: string }[] }>(
    "parent",
    `academic/me/students/${f.student.id}/curriculum`,
  );
  expect(parent.items.map((row) => row.id)).toContain(first.id);
  expect(parent.items.map((row) => row.id)).not.toContain(second.id);
});

test("@latest Tạo lịch tới bài cuối, bỏ kỳ nghỉ Tết và không làm rơi thứ tự bài", async ({
  world,
}) => {
  const f = await world.fixture("Tet lesson schedule", { enroll: false });
  const draft = await draftCurriculum(world, f, 3);
  const unit = await approveCurriculum(
    world,
    draft.id,
    f.users.teacher.id,
    f.outcomeSet.id,
  );
  // Independent 2027 calendar oracle: M/W slots on Jan 27, Feb 15, Feb 17;
  // Jan 30 through Feb 12 is the center's Tết break. Do not import scheduler code.
  const request = {
    curriculumUnitId: unit.id,
    fromDate: "2027-01-27",
    toDate: "2027-01-28",
  };
  const preview = await world.call<{
    endDate: string;
    slots: { date: string; lessonId: string }[];
  }>(
    "manager",
    `academic/classes/${f.classroom.id}/session-preview`,
    "POST",
    request,
  );
  expect(preview.slots.map((slot) => slot.date)).toEqual([
    "2027-01-27",
    "2027-02-15",
    "2027-02-17",
  ]);
  expect(preview.endDate).toBe("2027-02-17");
  expect(preview.slots.map((slot) => slot.lessonId)).toEqual(
    unit.lessons.map((lesson) => lesson.id),
  );
  const generated = await world.raw(
    "manager",
    `academic/classes/${f.classroom.id}/session-generations`,
    "POST",
    request,
    { "Idempotency-Key": randomUUID() },
  );
  expect(generated.status).toBe(201);
  const sessions = await world.db.classSession.findMany({
    where: { classId: f.classroom.id },
    orderBy: { startsAt: "asc" },
  });
  expect(
    sessions.map((row) =>
      new Date(row.startsAt.getTime() + 7 * 3600000).toISOString().slice(0, 10),
    ),
  ).toEqual(preview.slots.map((slot) => slot.date));
  expect(sessions.every((row) => row.status === "SCHEDULED")).toBe(true);
});

test("@latest Nhập CLO qua HTTP: xem trước, commit đúng một lần và giữ candidate", async ({
  world,
}) => {
  const f = await world.fixture("CLO import", { enroll: false });
  const auth = await world.login("designer");
  const form = new FormData();
  form.set(
    "file",
    new Blob(
      [
        "code,title,statement,required\nE2E-IMPORT-01,Giải phương trình,Giải được phương trình bậc nhất,true\nE2E-IMPORT-02,Kiểm tra nghiệm,Thay nghiệm vào phương trình để kiểm tra,false",
      ],
      { type: "text/csv" },
    ),
    "clo.csv",
  );
  const response = await fetch(
    `${API}/academic/outcome-sets/${f.outcomeSet.id}/import-preview`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
      body: form,
    },
  );
  expect(response.status).toBe(201);
  const { data: preview } = (await response.json()) as {
    data: {
      previewId: string;
      summary: { rows: number; validRows: number; invalidRows: number };
    };
  };
  expect(preview.summary).toEqual({ rows: 2, validRows: 2, invalidRows: 0 });
  expect(
    await world.db.learningOutcome.count({
      where: { outcomeSetId: f.outcomeSet.id },
    }),
  ).toBe(1);
  const key = randomUUID();
  const commit = () =>
    world.raw(
      "designer",
      `academic/outcome-sets/${f.outcomeSet.id}/import-commit`,
      "POST",
      { previewId: preview.previewId },
      { "Idempotency-Key": key },
    );
  const first = await commit();
  expect(first.status).toBe(201);
  const result = await first.json();
  const repeated = await commit();
  expect(repeated.status).toBe(201);
  expect((await repeated.json()).data).toEqual(result.data);
  const rows = await world.db.learningOutcome.findMany({
    where: { outcomeSetId: f.outcomeSet.id },
    orderBy: { code: "asc" },
  });
  expect(rows).toHaveLength(3);
  expect(
    rows
      .filter((row) => row.code.startsWith("E2E-IMPORT"))
      .every(
        (row) => row.sourceStatus === "CANDIDATE" && row.verifiedById === null,
      ),
  ).toBe(true);
  await expectError(
    await world.raw(
      "staff",
      `academic/outcome-sets/${f.outcomeSet.id}/import-commit`,
      "POST",
      { previewId: preview.previewId },
    ),
    403,
    "FORBIDDEN",
  );
});
