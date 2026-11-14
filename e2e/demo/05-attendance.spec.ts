import { test, expect, unique, instant, day } from "./world";

test("05 - Điểm danh và tỷ lệ chuyên cần", async ({ world, actors }, info) => {
  const f = await world.fixture("attendance");
  const other = await world.db.studentProfile.create({
    data: {
      parentProfileId: f.student.parentProfileId,
      fullName: unique("Học sinh vắng"),
      grade: 8,
    },
  });
  const otherEnrollment = await world.enrollIn(f.classroom.id, other.id);
  const regular = await world.session(f, -1, "08:00");
  await world.call("teacher", `academic/sessions/${regular.id}/roster`, "POST");
  const original = await world.session(f, -3, "08:00", { status: "COMPLETED" });
  const missed = await world.db.sessionParticipant.create({
    data: {
      sessionId: original.id,
      enrollmentId: f.enrollment!.id,
      attendance: "ABSENT",
    },
  });
  const excused = await world.session(f, -4, "08:00", { status: "COMPLETED" });
  await world.db.sessionParticipant.create({
    data: {
      sessionId: excused.id,
      enrollmentId: f.enrollment!.id,
      attendance: "EXCUSED",
    },
  });
  const replacementClass = await world.db.class.create({
    data: {
      programId: f.program.id,
      name: unique("Lớp nhận học bù điểm danh"),
      teacherId: f.users.teacher.id,
      capacity: 5,
      monthlyFee: 500000,
    },
  });
  const replacement = await world.session(f, 4, "10:00", {
    classId: replacementClass.id,
  });
  const booking = await world.call<{ id: string }>(
    "staff",
    "academic/makeups",
    "POST",
    { originalParticipantId: missed.id, targetSessionId: replacement.id },
  );
  // Fast-forward the test fixture's session time, not the application's business state.
  // Booking remains real and BOOKED; finalization must perform the completion transition.
  await world.db.classSession.update({
    where: { id: replacement.id },
    data: { startsAt: instant(-2, "10:00"), endsAt: instant(-2, "11:00") },
  });
  await info.attach("Time arrangement", {
    body: Buffer.from(
      "After a real future makeup booking, only fixture session timestamps are moved into the past, simulating elapsed time. Attendance, locking and automatic booking completion are performed by the real application.",
    ),
    contentType: "text/plain",
  });
  const teacher = await actors.open("teacher");
  await test.step("Chọn Có mặt/Vắng cho từng học sinh và xác nhận chốt buổi", async () => {
    await teacher.goto(`/teacher/attendance/${regular.id}`);
    await teacher
      .getByRole("group", {
        name: `Điểm danh ${f.student.fullName}`,
        exact: true,
      })
      .getByRole("button", { name: "Có mặt", exact: true })
      .click();
    await teacher
      .getByRole("group", { name: `Điểm danh ${other.fullName}`, exact: true })
      .getByRole("button", { name: "Vắng", exact: true })
      .click();
    await teacher
      .locator("#attendance-summary")
      .fill("Đã kiểm tra danh sách cả lớp.");
    await teacher
      .getByRole("checkbox", {
        name: "Tôi đã kiểm tra kết quả từng học viên và xác nhận chốt buổi.",
        exact: true,
      })
      .check();
    await teacher
      .getByRole("button", { name: "Chốt điểm danh", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await world.db.classSession.findUniqueOrThrow({
              where: { id: regular.id },
            })
          ).status,
      )
      .toBe("COMPLETED");
    await expect(
      teacher.getByRole("button", { name: "Chốt điểm danh", exact: true }),
    ).toHaveCount(0);
    const saved = await world.db.sessionParticipant.findMany({
      where: { sessionId: regular.id },
    });
    expect(
      saved.find((row) => row.enrollmentId === f.enrollment!.id)?.attendance,
    ).toBe("PRESENT");
    expect(
      saved.find((row) => row.enrollmentId === otherEnrollment.id)?.attendance,
    ).toBe("ABSENT");
    const locked = await world.raw(
      "teacher",
      `academic/sessions/${regular.id}/finalize-attendance`,
      "POST",
      {
        items: saved.map((row) => ({
          participantId: row.id,
          status: "PRESENT",
        })),
      },
    );
    expect(locked.status).toBe(409);
    expect((await locked.json()).error.code).toBe("SESSION_NOT_FINISHED");
    await teacher.reload();
    await expect(
      teacher.getByRole("row").filter({ hasText: other.fullName }),
    ).toContainText("Vắng");
    await actors.shot(teacher, "05-attendance-locked");
  });
  await test.step("Chốt Có mặt ở lớp học bù tự hoàn thành booking", async () => {
    await teacher.goto(`/teacher/attendance/${replacement.id}`);
    await teacher
      .getByRole("group", {
        name: `Điểm danh ${f.student.fullName}`,
        exact: true,
      })
      .getByRole("button", { name: "Có mặt", exact: true })
      .click();
    await teacher
      .getByRole("checkbox", {
        name: "Tôi đã kiểm tra kết quả từng học viên và xác nhận chốt buổi.",
        exact: true,
      })
      .check();
    await teacher
      .getByRole("button", { name: "Chốt điểm danh", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await world.db.makeupBooking.findUniqueOrThrow({
              where: { id: booking.id },
            })
          ).status,
      )
      .toBe("COMPLETED");
    await actors.shot(teacher, "05-makeup-completed");
  });
  await test.step("Web và app phụ huynh cùng công thức; buổi có phép không vào mẫu số", async () => {
    interface Summary {
      counts: {
        required: number;
        attended: number;
        present: number;
        madeUp: number;
        excused: number;
      };
      attendancePercent: number;
    }
    const query = `fromDate=${day(-10)}&toDate=${day()}&studentId=${f.student.id}`;
    const web = await world.call<Summary>(
      "teacher",
      `academic/classes/${f.classroom.id}/attendance-summary?${query}`,
    );
    const mobile = await world.call<Summary>(
      "parent",
      `academic/me/students/${f.student.id}/attendance?fromDate=${day(-10)}&toDate=${day()}`,
    );
    expect(web.counts).toEqual(mobile.counts);
    expect(web.counts).toMatchObject({
      required: 2,
      attended: 2,
      present: 1,
      madeUp: 1,
      excused: 1,
    });
    expect(web.attendancePercent).toBe(100);
    expect(mobile.attendancePercent).toBe(web.attendancePercent);
    await teacher.goto(`/teacher/classes/${f.classroom.id}?tab=attendance`);
    const row = teacher
      .getByRole("row")
      .filter({ hasText: f.student.fullName });
    await expect(row).toContainText("100%");
    const parent = await actors.open("parent");
    await parent.goto("/");
    await parent
      .getByRole("button", { name: /^Chọn học sinh, đang xem / })
      .click();
    await parent
      .getByRole("radio", { name: new RegExp(f.student.fullName) })
      .click();
    await expect(
      parent.getByRole("button", { name: "Tỷ lệ đi học 100%", exact: true }),
    ).toBeVisible();
    await actors.shot(parent, "05-parent-same-rate");
  });
});
