import { test, expect, day, unique } from "../demo/world";
import { activeFixture } from "./business-fixtures";

const DAY = 86400000;

test("@updates Gia hạn qua web khi lớp đầy, giữ hóa đơn và kiểm tra phân quyền/giới hạn", async ({
  world,
  actors,
}) => {
  const f = await activeFixture(world, "manual extension full class", 1);
  const billRoute = `registrations/${f.enrollment.registrationOrderId}/bill`;
  const before = await world.call("parent", billRoute);
  const staff = await actors.open("staff");
  await staff.goto(
    `/staff/students?studentId=${f.student.id}&enrollmentId=${f.enrollment.id}&action=extend`,
  );
  await staff.getByLabel("Số ngày cộng thêm", { exact: true }).fill("7");
  const saved = staff.waitForResponse(
    (response) =>
      response
        .url()
        .endsWith(`/academic/enrollments/${f.enrollment.id}/extensions`) &&
      response.request().method() === "POST",
  );
  await staff.getByRole("button", { name: "Gia hạn", exact: true }).click();
  expect((await saved).ok()).toBe(true);
  const current = await world.db.enrollment.findUniqueOrThrow({
    where: { id: f.enrollment.id },
  });
  expect(current.endDate?.getTime()).toBe(f.originalEnd.getTime() + 7 * DAY);
  expect(current.status).toBe("ACTIVE");
  expect(await world.call("parent", billRoute)).toEqual(before);
  const history = await world.call<{ days: number; source: string }[]>(
    "parent",
    `academic/enrollments/${f.enrollment.id}/extensions`,
  );
  expect(history.map((item) => [item.days, item.source])).toEqual([
    [7, "MANUAL"],
  ]);
  await expect(
    staff.getByRole("region", { name: "Lịch sử gia hạn" }),
  ).toContainText("+7");

  for (const payload of [
    { days: 0, reason: "Không có ngày" },
    { days: 91, reason: "Quá giới hạn" },
    { days: 1, reason: " \t " },
  ]) {
    expect(
      (
        await world.raw(
          "staff",
          `academic/enrollments/${f.enrollment.id}/extensions`,
          "POST",
          payload,
        )
      ).status,
    ).toBe(400);
  }
  for (const role of ["parent", "teacher", "manager"] as const) {
    expect(
      (
        await world.raw(
          role,
          `academic/enrollments/${f.enrollment.id}/extensions`,
          "POST",
          { days: 1, reason: "Sai quyền" },
        )
      ).status,
    ).toBe(403);
  }
  expect(
    await world.db.enrollmentExtension.count({
      where: { enrollmentId: f.enrollment.id },
    }),
  ).toBe(1);
  expect(
    await world.db.auditLog.count({
      where: { entityId: f.enrollment.id, action: "ENROLLMENT_EXTEND" },
    }),
  ).toBe(1);
  await staff.reload();
  await expect(
    staff.getByRole("region", { name: "Lịch sử gia hạn" }),
  ).toContainText("+7");
  await expect(
    staff.getByText(/tối đa 2 lần|tổng không quá 60 ngày/i),
  ).toHaveCount(0);
  await actors.shot(staff, "updates-manual-extension");
});

test("@updates Bảo lưu 14 ngày, kết thúc sớm/hủy đơn thu hồi đúng phần gia hạn", async ({
  world,
}) => {
  const f = await activeFixture(world, "pause extension");
  const sessions = [await world.session(f, 3), await world.session(f, 14)];
  for (const session of sessions)
    await world.call(
      "teacher",
      `academic/sessions/${session.id}/roster`,
      "POST",
    );
  const billRoute = `registrations/${f.enrollment.registrationOrderId}/bill`;
  const bill = await world.call("parent", billRoute);
  const pause = await world.call<{ id: string; status: string }>(
    "staff",
    "academic/leaves",
    "POST",
    {
      enrollmentId: f.enrollment.id,
      kind: "PERIOD_PAUSE",
      fromDate: day(2),
      toDate: day(15),
      reason: "Điều trị dài ngày",
      extendTerm: true,
    },
  );
  expect(pause.status).toBe("APPROVED");
  expect(
    (
      await world.db.enrollment.findUniqueOrThrow({
        where: { id: f.enrollment.id },
      })
    ).endDate?.getTime(),
  ).toBe(f.originalEnd.getTime() + 14 * DAY);
  expect(
    (
      await world.db.sessionParticipant.findMany({
        where: { enrollmentId: f.enrollment.id },
      })
    ).every((row) => row.attendance === "EXCUSED"),
  ).toBe(true);
  await world.call("staff", `academic/leaves/${pause.id}/end-early`, "POST", {
    effectiveDate: day(8),
    reason: "Trở lại học sớm",
  });
  expect(
    (
      await world.db.enrollment.findUniqueOrThrow({
        where: { id: f.enrollment.id },
      })
    ).endDate?.getTime(),
  ).toBe(f.originalEnd.getTime());
  expect(
    await world.db.enrollmentExtension.count({
      where: { leaveRequestId: pause.id },
    }),
  ).toBe(0);
  const remaining = await world.db.sessionParticipant.findMany({
    where: { enrollmentId: f.enrollment.id },
    orderBy: { session: { startsAt: "asc" } },
  });
  expect(remaining.map((row) => row.attendance)).toEqual([
    "EXCUSED",
    "UNMARKED",
  ]);
  await world.call("staff", `academic/leaves/${pause.id}/cancel`, "POST");

  const second = await world.call<{ id: string }>(
    "staff",
    "academic/leaves",
    "POST",
    {
      enrollmentId: f.enrollment.id,
      kind: "PERIOD_PAUSE",
      fromDate: day(20),
      toDate: day(39),
      reason: "Bảo lưu đợt khác",
      extendTerm: true,
    },
  );
  await world.call("staff", `academic/leaves/${second.id}/end-early`, "POST", {
    effectiveDate: day(34),
    reason: "Giữ lại đúng 14 ngày nghỉ",
  });
  expect(
    (
      await world.db.enrollmentExtension.findUniqueOrThrow({
        where: { leaveRequestId: second.id },
      })
    ).days,
  ).toBe(14);
  await world.call("staff", `academic/leaves/${second.id}/cancel`, "POST");
  expect(
    (
      await world.db.enrollment.findUniqueOrThrow({
        where: { id: f.enrollment.id },
      })
    ).endDate?.getTime(),
  ).toBe(f.originalEnd.getTime());
  expect(await world.call("parent", billRoute)).toEqual(bill);
  const tooShort = await world.raw("staff", "academic/leaves", "POST", {
    enrollmentId: f.enrollment.id,
    kind: "PERIOD_PAUSE",
    fromDate: day(45),
    toDate: day(57),
    reason: "Chưa đủ 14 ngày",
    extendTerm: true,
  });
  expect(tooShort.status).toBe(409);
  expect((await tooShort.json()).error.code).toBe("LEAVE_TOO_SHORT_TO_EXTEND");
  expect(
    await world.db.leaveRequest.count({
      where: { enrollmentId: f.enrollment.id },
    }),
  ).toBe(2);
});

test("@updates Hủy buổi có bù hạn: thêm một ngày học theo lịch lớp, gửi lại không cộng trùng", async ({
  world,
}) => {
  const f = await activeFixture(world, "cancel extension");
  const session = await world.session(f, 10);
  const bill = await world.call(
    "parent",
    `registrations/${f.enrollment.registrationOrderId}/bill`,
  );
  const key = unique("cancel extend idempotency");
  const body = {
    reason: "Trung tâm hủy không dạy bù được",
    expectedRevision: session.revision,
    extendTerm: true,
  };
  const first = await world.raw(
    "manager",
    `academic/sessions/${session.id}/cancel`,
    "POST",
    body,
    { "Idempotency-Key": key },
  );
  expect(first.ok).toBe(true);
  const repeat = await world.raw(
    "manager",
    `academic/sessions/${session.id}/cancel`,
    "POST",
    body,
    { "Idempotency-Key": key },
  );
  expect(repeat.ok).toBe(true);
  // The exclusive end must become the day after the next Monday/Wednesday it can cover.
  const last = new Date(f.originalEnd);
  while (![1, 3].includes(last.getUTCDay()))
    last.setUTCDate(last.getUTCDate() + 1);
  last.setUTCDate(last.getUTCDate() + 1);
  expect(
    (
      await world.db.enrollment.findUniqueOrThrow({
        where: { id: f.enrollment.id },
      })
    ).endDate?.toISOString(),
  ).toBe(last.toISOString());
  expect(
    await world.db.enrollmentExtension.count({
      where: { sessionId: session.id, enrollmentId: f.enrollment.id },
    }),
  ).toBe(1);
  expect(
    await world.call(
      "parent",
      `registrations/${f.enrollment.registrationOrderId}/bill`,
    ),
  ).toEqual(bill);
});
