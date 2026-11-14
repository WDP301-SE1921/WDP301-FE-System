import { test, expect, day, unique, select } from "./world";

test("04 - Nghỉ học và xếp học bù", async ({ world, actors }, info) => {
  const f = await world.fixture("makeup");
  const source = await world.session(f, 2);
  await world.call("teacher", `academic/sessions/${source.id}/roster`, "POST");
  const participant = await world.db.sessionParticipant.findUniqueOrThrow({
    where: {
      sessionId_enrollmentId: {
        sessionId: source.id,
        enrollmentId: f.enrollment!.id,
      },
    },
  });
  const targetClass = await world.db.class.create({
    data: {
      programId: f.program.id,
      teacherId: f.users.teacher.id,
      name: unique("Lớp nhận học bù"),
      capacity: 5,
      monthlyFee: 500000,
    },
  });
  const fullClass = await world.db.class.create({
    data: {
      programId: f.program.id,
      teacherId: f.users.teacher.id,
      name: unique("Lớp học bù hết chỗ"),
      capacity: 1,
      monthlyFee: 500000,
    },
  });
  const anotherStudent = await world.db.studentProfile.create({
    data: {
      parentProfileId: f.student.parentProfileId,
      fullName: unique("Học viên giữ chỗ"),
      grade: 8,
    },
  });
  await world.enrollIn(fullClass.id, anotherStudent.id);
  const eligible = await world.session(f, 4, "09:00", {
    classId: targetClass.id,
  });
  const full = await world.session(f, 5, "09:00", { classId: fullClass.id });
  const clash = await world.session(f, 6, "09:00", { classId: targetClass.id });
  const competing = await world.session(f, 6, "09:00");
  await world.db.sessionParticipant.create({
    data: { sessionId: competing.id, enrollmentId: f.enrollment!.id },
  });
  const wrongLesson = await world.db.lesson.create({
    data: {
      programId: f.program.id,
      designerId: f.users.designer.id,
      title: unique("Bài khác"),
      content: "Bài khác",
      sequence: 2,
      status: "APPROVED",
    },
  });
  const mismatch = await world.session(f, 7, "09:00", {
    classId: targetClass.id,
    lessonId: wrongLesson.id,
  });
  const reason = unique("Phụ huynh báo con ốm");
  let leaveId = "";
  await test.step("Phụ huynh báo nghỉ qua API thật; chưa duyệt thì chưa xếp bù được", async () => {
    const leave = await world.call<{ id: string }>(
      "parent",
      "academic/leaves",
      "POST",
      {
        enrollmentId: f.enrollment!.id,
        kind: "SINGLE_ABSENCE",
        sessionId: source.id,
        fromDate: day(2),
        toDate: day(2),
        reason,
      },
    );
    leaveId = leave.id;
    const response = await world.raw("staff", "academic/makeups", "POST", {
      originalParticipantId: participant.id,
      targetSessionId: eligible.id,
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("ABSENCE_NOT_APPROVED");
    await info.attach("Parent absence entry", {
      body: Buffer.from(
        "The parent mobile UI currently has no absence request form; this step uses the real parent-authorized API. Staff approval and booking are tested through the web UI.",
      ),
      contentType: "text/plain",
    });
  });
  const staff = await actors.open("staff");
  const href = `/staff/students?studentId=${f.student.id}&enrollmentId=${f.enrollment!.id}&action=makeup`;
  await test.step("Nhân viên duyệt đơn trên giao diện", async () => {
    await staff.goto(href);
    const row = staff.getByRole("row").filter({ hasText: reason });
    await row.getByRole("button", { name: "Duyệt", exact: true }).click();
    const dialog = staff.getByRole("dialog").last();
    await select(staff, "Ghi chú duyệt", "Đã liên hệ phụ huynh");
    await dialog
      .getByRole("button", { name: "Duyệt đơn", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await world.db.leaveRequest.findUniqueOrThrow({
              where: { id: leaveId },
            })
          ).status,
      )
      .toBe("APPROVED");
  });
  await test.step("Chỉ cùng bài, còn chỗ, không trùng lịch được chọn; từng buổi loại có lý do", async () => {
    interface Candidate {
      id: string;
      eligible: boolean;
      availableSeats: number;
      reasonCodes: string[];
    }
    const candidates = await world.call<Candidate[]>(
      "staff",
      `academic/participants/${participant.id}/makeup-candidates?limit=100`,
    );
    expect(candidates.find((row) => row.id === eligible.id)?.eligible).toBe(
      true,
    );
    expect(candidates.find((row) => row.id === full.id)?.reasonCodes).toContain(
      "SESSION_FULL",
    );
    expect(
      candidates.find((row) => row.id === clash.id)?.reasonCodes,
    ).toContain("STUDENT_SCHEDULE_CONFLICT");
    expect(candidates.some((row) => row.id === mismatch.id)).toBe(false);
    expect(
      candidates
        .filter((row) => !row.eligible)
        .every((row) => row.reasonCodes.length > 0),
    ).toBe(true);
    await staff.goto(`${href}&sourceId=${participant.id}`);
    await expect(
      staff.getByText("Buổi cùng bài không xếp được", { exact: true }),
    ).toBeVisible();
    await expect(staff.getByText(/đã đủ sĩ số/).first()).toBeVisible();
    await expect(
      staff.getByText(/trùng lịch học khác của con/).first(),
    ).toBeVisible();
    await select(staff, "Buổi thay thế", new RegExp(targetClass.name));
    await staff
      .getByRole("checkbox", {
        name: "Tôi xác nhận xếp buổi thay thế đã chọn.",
        exact: true,
      })
      .check();
    await staff
      .getByRole("button", { name: "Xếp học bù", exact: true })
      .click();
    await expect
      .poll(async () =>
        world.db.makeupBooking.count({
          where: { originalParticipantId: participant.id, status: "BOOKED" },
        }),
      )
      .toBe(1);
    await actors.shot(staff, "04-booked-with-exclusions");
    const duplicate = await world.raw("staff", "academic/makeups", "POST", {
      originalParticipantId: participant.id,
      targetSessionId: eligible.id,
    });
    expect(duplicate.status).toBe(409);
  });
  await test.step("Giáo viên thấy học sinh học bù trong danh sách buổi thay thế", async () => {
    const teacher = await actors.open("teacher");
    await teacher.goto(`/teacher/attendance/${eligible.id}`);
    const row = teacher
      .getByRole("row")
      .filter({ hasText: f.student.fullName });
    await expect(row).toContainText("Học bù");
    const booking = await world.db.makeupBooking.findFirstOrThrow({
      where: { originalParticipantId: participant.id },
      include: { replacement: true },
    });
    expect(booking.replacement.sessionId).toBe(eligible.id);
    expect(booking.replacement.kind).toBe("MAKEUP");
    await actors.shot(teacher, "04-teacher-makeup-roster");
  });
});
