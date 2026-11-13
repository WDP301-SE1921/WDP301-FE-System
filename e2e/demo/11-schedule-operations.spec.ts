import { test, expect, unique, day, instant } from "./world";
import { chooseCard } from "../web/helpers";

test("11 - Dời buổi và ngày nghỉ trung tâm", async ({ world, actors }) => {
  const f = await world.fixture("reschedule");
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
  const moved = await world.session(f, 12, "03:00");
  await world.db.sessionParticipant.create({
    data: { sessionId: moved.id, enrollmentId: f.enrollment!.id },
  });
  await test.step("Dời buổi không đổi bài học, giữ roster và ghi lịch sử", async () => {
    const startsAt = instant(13, "03:00").toISOString(),
      endsAt = instant(13, "04:00").toISOString();
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
  const cancelled = await world.session(f, 14, "03:00");
  const secondLesson = await world.db.lesson.create({
    data: {
      programId: f.program.id,
      unitId: unit.id,
      designerId: f.users.designer.id,
      title: unique("Bài tiếp theo"),
      content: "Nội dung",
      sequence: 2,
      status: "APPROVED",
    },
  });
  const following = await world.session(f, 16, "03:00", {
    lessonId: secondLesson.id,
  });
  await test.step("Quản lý hủy và dời bài trên giao diện, bài của buổi hủy chuyển sang buổi kế", async () => {
    await manager.goto(
      `/manager/schedule?classId=${f.classroom.id}&view=list&date=${day(14)}&session=${cancelled.id}&sessionTab=cancel`,
    );
    await chooseCard(manager, "Hủy và dời bài sang buổi sau");
    await manager.locator("#cancel-reason").click();
    await manager
      .getByRole("option", { name: "Giáo viên bận đột xuất", exact: true })
      .click();
    await manager
      .getByRole("button", { name: "Xác nhận hủy buổi", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await world.db.classSession.findUniqueOrThrow({
              where: { id: cancelled.id },
            })
          ).status,
      )
      .toBe("CANCELLED");
    expect(
      (
        await world.db.classSession.findUniqueOrThrow({
          where: { id: following.id },
        })
      ).lessonId,
    ).toBe(cancelled.lessonId);
    await actors.shot(manager, "11-cancel-shift-lessons");
  });
  await test.step("Ngày nghỉ hỗ trợ hủy theo lô; dữ liệu ngoài lô được giữ và phụ huynh có thông báo", async () => {
    const a = await world.session(f, 18, "03:00");
    const b = await world.session(f, 19, "03:00");
    const outside = await world.session(f, 21, "03:00");
    for (const row of [a, b])
      await world.db.sessionParticipant.create({
        data: { sessionId: row.id, enrollmentId: f.enrollment!.id },
      });
    const reason = unique("Ngày nghỉ E2E");
    const closureResponse = await world.call<{
      closure?: { id: string };
      id?: string;
    }>("manager", "academic/center-closures", "POST", {
      fromDate: day(18),
      toDate: day(19),
      reason,
    });
    const closureId = closureResponse.closure?.id ?? closureResponse.id;
    try {
      expect(
        (await world.db.classSession.findUniqueOrThrow({ where: { id: a.id } }))
          .status,
      ).toBe("SCHEDULED");
      await world.call("manager", "academic/sessions/bulk-cancel", "POST", {
        sessionIds: [a.id, b.id],
        shiftLessons: false,
        reason,
      });
      const rows = await world.db.classSession.findMany({
        where: { id: { in: [a.id, b.id] } },
      });
      expect(
        rows.every(
          (row) => row.status === "CANCELLED" && row.cancelReason === reason,
        ),
      ).toBe(true);
      expect(
        (
          await world.db.classSession.findUniqueOrThrow({
            where: { id: outside.id },
          })
        ).status,
      ).toBe("SCHEDULED");
      const response = await world.call<{
        items: {
          title: string;
          body: string;
          type: string;
          context?: { classId: string };
        }[];
      }>("parent", "notifications?limit=100");
      expect(
        response.items.some(
          (row) =>
            row.type === "SESSION_CANCELLED" &&
            row.context?.classId === f.classroom.id,
        ),
      ).toBe(true);
      await manager.goto(
        `/manager/schedule?classId=${f.classroom.id}&view=list&date=${day(18)}`,
      );
      await actors.shot(manager, "11-holiday-batch-cancel");
    } finally {
      if (closureId)
        await world.call(
          "manager",
          `academic/center-closures/${closureId}`,
          "DELETE",
        );
    }
  });
});
