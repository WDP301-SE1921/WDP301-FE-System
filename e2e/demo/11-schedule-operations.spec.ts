import { test, expect, unique, day, instant } from "./world";

test("11 - Dời buổi", async ({ world, actors }) => {
  const f = await world.fixture("reschedule");
  // Rescheduling stays within a curriculum month. Keep this entire sequence away from a
  // month boundary, including on dates such as 18/11 where offsets 12/13 cross months.
  let anchor = 12;
  while (day(anchor).slice(0, 7) !== day(anchor + 9).slice(0, 7)) anchor++;
  // A fresh teacher prevents genuine schedule conflicts with earlier runs of this test.
  f.users.teacher = await world.db.user.create({
    data: {
      email: `${unique("schedule-teacher").replaceAll(" ", "")}@example.test`,
      displayName: unique("Giáo viên lịch kiểm thử"),
      passwordHash: f.users.teacher.passwordHash,
      role: "TEACHER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  await world.db.class.update({
    where: { id: f.classroom.id },
    data: { teacherId: f.users.teacher.id },
  });
  const track = await world.db.curriculumTrack.findFirstOrThrow({
    where: { grade: 8, subject: "Toán" },
  });
  const unit = await world.db.curriculumUnit.create({
    data: {
      programId: f.program.id,
      trackId: track.id,
      designerId: f.users.designer.id,
      title: unique("Giáo trình dời bài"),
      fromDate: instant(1, "00:00"),
      toDate: instant(40, "00:00"),
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });
  await world.db.lesson.update({
    where: { id: f.lesson.id },
    data: { unitId: unit.id },
  });
  const moved = await world.session(f, anchor, "03:00");
  await world.db.sessionParticipant.create({
    data: { sessionId: moved.id, enrollmentId: f.enrollment!.id },
  });
  await test.step("Dời buổi không đổi bài học, giữ roster và ghi lịch sử", async () => {
    const startsAt = instant(anchor + 1, "03:00").toISOString(),
      endsAt = instant(anchor + 1, "04:00").toISOString();
    await world.call(
      "manager",
      `academic/sessions/${moved.id}/reschedule`,
      "POST",
      {
        startsAt,
        endsAt,
        expectedRevision: moved.revision,
        reason: "Đổi lịch demo",
      },
    );
    const saved = await world.db.classSession.findUniqueOrThrow({
      where: { id: moved.id },
      include: { participants: true },
    });
    expect(saved.startsAt.toISOString()).toBe(startsAt);
    expect(saved.lessonId).toBe(moved.lessonId);
    expect(
      saved.participants.some(
        (row) => row.enrollmentId === f.enrollment!.id && !row.cancelled,
      ),
    ).toBe(true);
    expect(saved.revision).toBe(moved.revision + 1);
  });
  const manager = await actors.open("manager");
  await test.step("Không còn hủy buổi và Ngày nghỉ: link cũ mở tab Nội dung, API trả 404", async () => {
    // Session cancel and center closures were removed on 19/11/2026.
    await manager.goto(
      `/manager/schedule?classId=${f.classroom.id}&view=list&date=${day(anchor + 1)}&session=${moved.id}&sessionTab=cancel`,
    );
    const tabs = manager.getByRole("tablist", { name: "Phần của buổi học" });
    await expect(tabs.getByRole("tab")).toHaveText(["Nội dung", "Đổi giờ", "Dạy thay"]);
    await expect(tabs.getByRole("tab", { name: "Nội dung" })).toHaveAttribute("aria-selected", "true");
    await expect(manager.getByRole("button", { name: "Ngày nghỉ trung tâm" })).toHaveCount(0);
    await actors.shot(manager, "11-session-tabs");
    for (const route of [
      `academic/sessions/${moved.id}/cancel`,
      `academic/sessions/${moved.id}/cancel-preview`,
      "academic/sessions/bulk-cancel",
      "academic/sessions/bulk-cancel-preview",
      "academic/center-closures",
    ])
      await world.call("manager", route, "POST", { reason: "x", sessionIds: [moved.id] }, 404);
    await world.call("manager", "academic/center-closures", "GET", undefined, 404);
    const saved = await world.db.classSession.findUniqueOrThrow({ where: { id: moved.id } });
    expect(saved.status).toBe("SCHEDULED");
  });
});
