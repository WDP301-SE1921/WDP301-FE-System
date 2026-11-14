import { test, expect, unique, instant, day } from "./world";

test("10 - Dạy thay và đổi giáo viên", async ({ world, actors }) => {
  const f = await world.fixture("teachers");
  const standin = await world.db.user.create({
    data: {
      role: "TEACHER",
      status: "ACTIVE",
      email: `${unique("standin").replaceAll(" ", "")}@example.test`,
      displayName: unique("Giáo viên thay thế"),
      passwordHash: f.users.teacher.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const busy = await world.db.user.create({
    data: {
      role: "TEACHER",
      status: "ACTIVE",
      email: `${unique("busy").replaceAll(" ", "")}@example.test`,
      displayName: unique("Giáo viên đang bận"),
      passwordHash: f.users.teacher.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const early = await world.session(f, 2, "04:00");
  const before = await world.session(f, 3, "04:00");
  const after = await world.session(f, 5, "04:00");
  const later = await world.session(f, 7, "04:00");
  const busyClass = await world.db.class.create({
    data: {
      programId: f.program.id,
      name: unique("Lớp giáo viên bận"),
      teacherId: busy.id,
      capacity: 8,
      monthlyFee: 500000,
    },
  });
  await world.db.classSession.create({
    data: {
      classId: busyClass.id,
      teacherId: busy.id,
      lessonId: f.lesson.id,
      startsAt: early.startsAt,
      endsAt: early.endsAt,
    },
  });
  await test.step("Gợi ý dạy thay loại giáo viên trùng giờ và API chặn chọn người đang bận", async () => {
    const candidates = await world.call<{ id: string }[]>(
      "manager",
      `academic/sessions/${early.id}/substitute-candidates?limit=100`,
    );
    expect(candidates.some((row) => row.id === standin.id)).toBe(true);
    expect(candidates.some((row) => row.id === busy.id)).toBe(false);
    const rejected = await world.raw(
      "manager",
      `academic/sessions/${early.id}/substitutions`,
      "POST",
      {
        teacherId: busy.id,
        expectedRevision: early.revision,
        reason: "Kiểm tra trùng giờ",
      },
    );
    expect(rejected.status).toBe(409);
    expect(
      (
        await world.db.classSession.findUniqueOrThrow({
          where: { id: early.id },
        })
      ).teacherId,
    ).toBe(f.users.teacher.id);
  });
  await test.step("Dạy thay chỉ tác động một buổi", async () => {
    await world.call(
      "manager",
      `academic/sessions/${early.id}/substitutions`,
      "POST",
      {
        teacherId: standin.id,
        expectedRevision: early.revision,
        reason: "Giáo viên ốm",
      },
    );
    expect(
      (
        await world.db.classSession.findUniqueOrThrow({
          where: { id: early.id },
        })
      ).teacherId,
    ).toBe(standin.id);
    expect(
      (
        await world.db.classSession.findUniqueOrThrow({
          where: { id: before.id },
        })
      ).teacherId,
    ).toBe(f.users.teacher.id);
    const manager = await actors.open("manager");
    await manager.goto(
      `/manager/schedule?classId=${f.classroom.id}&view=list&date=${day(2)}&session=${early.id}`,
    );
    await expect(manager.locator("main")).toContainText(standin.displayName!);
    await actors.shot(manager, "10-substitute-session");
  });
  await test.step("Đổi dài hạn chỉ chuyển buổi từ ngày hiệu lực và lưu audit", async () => {
    const effectiveAt = instant(4, "00:00").toISOString();
    await world.call(
      "manager",
      `classes/${f.classroom.id}/teacher-assignments`,
      "POST",
      { teacherId: standin.id, effectiveAt, reason: "Giáo viên nghỉ dài hạn" },
    );
    const rows = await world.db.classSession.findMany({
      where: { classId: f.classroom.id },
    });
    expect(rows.find((row) => row.id === before.id)?.teacherId).toBe(
      f.users.teacher.id,
    );
    expect(rows.find((row) => row.id === after.id)?.teacherId).toBe(standin.id);
    expect(rows.find((row) => row.id === later.id)?.teacherId).toBe(standin.id);
    const classroom = await world.db.class.findUniqueOrThrow({
      where: { id: f.classroom.id },
    });
    expect(classroom.teacherId).toBe(f.users.teacher.id);
    expect(classroom.pendingTeacherId).toBe(standin.id);
    expect(classroom.pendingTeacherFrom?.toISOString()).toBe(effectiveAt);
    const audit = await world.db.auditLog.findFirstOrThrow({
      where: { entityId: f.classroom.id, action: "CLASS_TEACHER_ASSIGNED" },
    });
    expect(audit.actorUserId).toBe(f.users.manager.id);
    expect(JSON.stringify(audit.afterData)).toContain(effectiveAt);
    const forbidden = await world.raw(
      "staff",
      `classes/${f.classroom.id}/teacher-assignments`,
      "POST",
      { teacherId: busy.id, effectiveAt, reason: "Nhân viên không có quyền" },
    );
    expect(forbidden.status).toBe(403);
  });
});
