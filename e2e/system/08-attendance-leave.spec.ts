import { test, expect, instant, select, unique } from "../demo/world";
import { activeFixture } from "./business-fixtures";

test("@updates Phụ huynh gửi đơn nghỉ trên app, lỗi tải phải thử lại trước khi được gửi", async ({
  world,
  actors,
}) => {
  const f = await activeFixture(world, "parent single leave");
  const session = await world.session(f, 4);
  const parent = await actors.open("parent");
  let failLookup = true;
  await parent.route("**/api/v1/academic/leaves?**", async (route) => {
    if (failLookup && route.request().method() === "GET") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Temporary failure for recovery coverage",
          },
        }),
      });
    } else await route.continue();
  });
  await parent.goto(`/sessions/${session.id}?studentId=${f.student.id}`);
  const retry = parent.getByRole("button", {
    name: "Thử tải lại đơn nghỉ",
    exact: true,
  });
  await expect(retry).toBeVisible({ timeout: 30000 });
  await expect(
    parent.getByRole("button", { name: "Xin nghỉ buổi này", exact: true }),
  ).toHaveCount(0);
  failLookup = false;
  await retry.click();
  await parent
    .getByRole("button", { name: "Xin nghỉ buổi này", exact: true })
    .click();
  await parent
    .getByPlaceholder("Vd: Con bị ốm, gia đình về quê", { exact: true })
    .fill("Con bị ốm, xin nghỉ một buổi để điều trị.");
  const created = parent.waitForResponse(
    (response) =>
      response.url().endsWith("/academic/leaves") &&
      response.request().method() === "POST",
  );
  await parent
    .getByRole("button", { name: "Gửi đơn xin nghỉ", exact: true })
    .click();
  const response = await created;
  expect(response.ok()).toBe(true);
  const leave = (await response.json()).data as { id: string; status: string };
  expect(leave.status).toBe("PENDING");
  await expect(
    parent.getByText("Đã gửi đơn xin nghỉ", { exact: true }),
  ).toBeVisible();
  await parent.reload();
  await expect(
    parent.getByText("Đã gửi đơn xin nghỉ", { exact: true }),
  ).toBeVisible();
  await expect(
    parent.getByRole("button", { name: "Xin nghỉ buổi này", exact: true }),
  ).toHaveCount(0);
  expect(
    await world.db.leaveRequest.count({
      where: { enrollmentId: f.enrollment.id, sessionId: session.id },
    }),
  ).toBe(1);
  await world.call("staff", `academic/leaves/${leave.id}/decide`, "POST", {
    approve: true,
    reason: "Phụ huynh đã báo trung tâm",
  });
  await parent.reload();
  await expect(
    parent.getByText("Trung tâm đã duyệt nghỉ", { exact: true }),
  ).toBeVisible();
  await actors.shot(parent, "updates-parent-leave-approved");
});

test("@updates Sửa điểm danh trong ngày qua web, lưu lý do và không gửi lại khi không đổi", async ({
  world,
  actors,
}) => {
  const f = await activeFixture(world, "same-day correction");
  const session = await world.db.classSession.create({
    data: {
      classId: f.classroom.id,
      teacherId: f.users.teacher.id,
      lessonId: f.lesson.id,
      startsAt: instant(0, "00:00"),
      endsAt: new Date(instant(0, "00:00").getTime() + 1000),
      status: "COMPLETED",
    },
  });
  const participant = await world.db.sessionParticipant.create({
    data: {
      sessionId: session.id,
      enrollmentId: f.enrollment.id,
      attendance: "ABSENT",
    },
  });
  const teacher = await actors.open("teacher");
  await teacher.goto(`/teacher/attendance/${session.id}`);
  await teacher
    .getByRole("button", { name: "Sửa điểm danh", exact: true })
    .click();
  await teacher
    .getByRole("group", {
      name: `Sửa điểm danh ${f.student.fullName}`,
      exact: true,
    })
    .getByRole("button", { name: "Có mặt", exact: true })
    .click();
  await select(teacher, "Lý do sửa", "Đánh nhầm");
  const saved = teacher.waitForResponse(
    (response) =>
      response
        .url()
        .endsWith(
          `/academic/sessions/${session.id}/participants/${participant.id}/attendance`,
        ) && response.request().method() === "PATCH",
  );
  await teacher
    .getByRole("button", { name: "Lưu sửa đổi (1)", exact: true })
    .click();
  expect((await saved).ok()).toBe(true);
  const route = `academic/sessions/${session.id}/participants/${participant.id}/attendance`;
  expect(
    (
      await world.db.sessionParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      })
    ).attendance,
  ).toBe("PRESENT");
  const audit = await world.db.auditLog.findFirstOrThrow({
    where: { action: "ATTENDANCE_CORRECTED", entityId: participant.id },
  });
  expect(audit.afterData).toMatchObject({
    attendance: "PRESENT",
    reason: "Đánh nhầm",
  });
  const outboxBefore = await world.db.outboxEvent.count({
    where: { eventType: "ATTENDANCE_CORRECTED", aggregateId: f.enrollment.id },
  });
  await world.call("teacher", route, "PATCH", {
    status: "PRESENT",
    reason: "Gửi lại cùng trạng thái",
  });
  expect(
    await world.db.auditLog.count({
      where: { action: "ATTENDANCE_CORRECTED", entityId: participant.id },
    }),
  ).toBe(1);
  expect(
    await world.db.outboxEvent.count({
      where: {
        eventType: "ATTENDANCE_CORRECTED",
        aggregateId: f.enrollment.id,
      },
    }),
  ).toBe(outboxBefore);
  await world.call("manager", route, "PATCH", {
    status: "ABSENT",
    reason: "Quản lý sửa theo sổ gốc",
  });
  expect(
    (
      await world.db.sessionParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      })
    ).attendance,
  ).toBe("ABSENT");
  for (const role of ["parent", "staff"] as const)
    expect(
      (
        await world.raw(role, route, "PATCH", {
          status: "PRESENT",
          reason: "Sai quyền",
        })
      ).status,
    ).toBe(403);
  expect(
    (
      await world.raw("teacher", route, "PATCH", {
        status: "PRESENT",
        reason: "  ",
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await world.raw("teacher", route, "PATCH", {
        status: "EXCUSED",
        reason: "Không sửa phép tại đây",
      })
    ).status,
  ).toBe(400);
  await actors.shot(teacher, "updates-attendance-correction");
});

test("@updates Khóa sửa điểm danh qua ngày, đơn có phép và lớp không phụ trách", async ({
  world,
}) => {
  const f = await activeFixture(world, "correction constraints");
  for (const [offset, status, attendance, code] of [
    [-1, "COMPLETED", "ABSENT", "CORRECTION_WINDOW_CLOSED"],
    [0, "SCHEDULED", "ABSENT", "SESSION_NOT_FINALIZED"],
    [0, "COMPLETED", "EXCUSED", "EXCUSED_REQUIRES_LEAVE"],
  ] as const) {
    const session = await world.session(
      f,
      offset,
      status === "SCHEDULED" ? "01:00" : "02:00",
      { status },
    );
    const participant = await world.db.sessionParticipant.create({
      data: {
        sessionId: session.id,
        enrollmentId: f.enrollment.id,
        attendance,
      },
    });
    const denied = await world.raw(
      "teacher",
      `academic/sessions/${session.id}/participants/${participant.id}/attendance`,
      "PATCH",
      { status: "PRESENT", reason: "Kiểm tra khóa" },
    );
    expect(denied.status).toBe(409);
    expect((await denied.json()).error.code).toBe(code);
    expect(
      (
        await world.db.sessionParticipant.findUniqueOrThrow({
          where: { id: participant.id },
        })
      ).attendance,
    ).toBe(attendance);
  }
  const otherTeacher = await world.db.user.create({
    data: {
      email: `${unique("other-teacher").replaceAll(" ", "")}@example.test`,
      displayName: "Giáo viên khác",
      role: "TEACHER",
      status: "ACTIVE",
      passwordHash: f.users.teacher.passwordHash,
    },
  });
  const session = await world.session(f, 0, "03:00", { status: "COMPLETED" });
  await world.db.classSession.update({
    where: { id: session.id },
    data: { teacherId: otherTeacher.id },
  });
  const participant = await world.db.sessionParticipant.create({
    data: {
      sessionId: session.id,
      enrollmentId: f.enrollment.id,
      attendance: "ABSENT",
    },
  });
  expect(
    (
      await world.raw(
        "teacher",
        `academic/sessions/${session.id}/participants/${participant.id}/attendance`,
        "PATCH",
        { status: "PRESENT", reason: "Sai giáo viên" },
      )
    ).status,
  ).toBe(403);
  expect(
    await world.db.auditLog.count({
      where: { action: "ATTENDANCE_CORRECTED", entityId: participant.id },
    }),
  ).toBe(0);
});

test("@updates Sửa Có mặt đồng thời đặt học bù phải giữ nguyên tắc nguồn vắng", async ({
  world,
}) => {
  const f = await activeFixture(world, "correction makeup race");
  const source = await world.session(f, 0, "00:00", { status: "COMPLETED" });
  const participant = await world.db.sessionParticipant.create({
    data: {
      sessionId: source.id,
      enrollmentId: f.enrollment.id,
      attendance: "ABSENT",
    },
  });
  const targetClass = await world.db.class.create({
    data: {
      programId: f.program.id,
      teacherId: f.users.teacher.id,
      name: unique("Lớp học bù race"),
      monthlyFee: 500000,
      capacity: 5,
    },
  });
  const target = await world.session(f, 2, "20:00", {
    classId: targetClass.id,
  });
  await Promise.all([world.login("teacher"), world.login("staff")]);
  let releaseGate!: () => void;
  const gateReleased = new Promise<void>((resolve) => {
    releaseGate = resolve;
  });
  let markReady!: (id: number) => void;
  const gateReady = new Promise<number>((resolve) => {
    markReady = resolve;
  });
  const holding = world.db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM class_sessions WHERE id = ${source.id} FOR UPDATE`;
      const [connection] = await tx.$queryRaw<
        { id: bigint }[]
      >`SELECT CONNECTION_ID() AS id`;
      markReady(Number(connection.id));
      await gateReleased;
    },
    { timeout: 25000 },
  );
  const blockerId = await Promise.race([
    gateReady,
    holding.then(() => {
      throw new Error(
        "The attendance concurrency gate closed before requests started.",
      );
    }),
  ]);
  const responses = Promise.all([
    world.raw(
      "teacher",
      `academic/sessions/${source.id}/participants/${participant.id}/attendance`,
      "PATCH",
      { status: "PRESENT", reason: "Đối chiếu sổ điểm danh" },
    ),
    world.raw("staff", "academic/makeups", "POST", {
      originalParticipantId: participant.id,
      targetSessionId: target.id,
    }),
  ]);
  try {
    // MySQL 8.4 is part of the guarded local harness. Observe both real API transactions
    // queued behind this lock before releasing it, rather than rely on request timing.
    await Promise.race([
      expect
        .poll(
          async () => {
            const [state] = await world.db.$queryRaw<{ waiting: bigint }[]>`
          SELECT COUNT(*) AS waiting FROM performance_schema.data_lock_waits waits
          JOIN performance_schema.threads blocker ON blocker.THREAD_ID = waits.BLOCKING_THREAD_ID
          WHERE blocker.PROCESSLIST_ID = ${blockerId}`;
            return Number(state.waiting);
          },
          {
            timeout: 10000,
            intervals: [50, 100, 250],
            message:
              "Both correction and makeup booking must wait for the shared session lock",
          },
        )
        .toBeGreaterThanOrEqual(2),
      responses.then(() => {
        throw new Error(
          "Requests completed without waiting for the session gate.",
        );
      }),
    ]);
  } finally {
    releaseGate();
    await holding;
    await responses;
  }
  const [correction, booking] = await responses;
  expect([correction.ok, booking.ok].filter(Boolean)).toHaveLength(1);
  const loser = correction.ok ? booking : correction;
  expect(loser.status).toBe(409);
  expect(["MAKEUP_SOURCE_ABSENT", "INVALID_MAKEUP_SOURCE"]).toContain(
    (await loser.json()).error.code,
  );
  const row = await world.db.sessionParticipant.findUniqueOrThrow({
    where: { id: participant.id },
    include: { sourceBookings: { where: { status: "BOOKED" } } },
  });
  expect(row.attendance === "PRESENT" && row.sourceBookings.length > 0).toBe(
    false,
  );
  expect(row.sourceBookings.length).toBe(correction.ok ? 0 : 1);
});
