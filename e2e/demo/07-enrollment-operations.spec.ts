import { test, expect, day, instant, unique, select, confirm } from "./world";
import { chooseCard } from "../web/helpers";

test("07 - Tạm nghỉ dài hạn", async ({ world, actors }) => {
  const f = await world.fixture("pause");
  const sessions = [
    await world.session(f, 2),
    await world.session(f, 4),
    await world.session(f, 6),
  ];
  for (const session of sessions)
    await world.call(
      "teacher",
      `academic/sessions/${session.id}/roster`,
      "POST",
    );
  const staff = await actors.open("staff");
  await test.step("Nhân viên chọn khoảng nghỉ và ghi nhận trên giao diện", async () => {
    await staff.goto(
      `/staff/students?studentId=${f.student.id}&enrollmentId=${f.enrollment!.id}&action=leave`,
    );
    await staff.getByLabel("Từ ngày", { exact: true }).fill(day(2));
    await staff.getByLabel("Đến ngày", { exact: true }).fill(day(4));
    await select(staff, "Lý do", "Ốm, điều trị dài ngày");
    await staff
      .getByRole("button", { name: "Xác nhận nghỉ dài hạn", exact: true })
      .click();
    await expect
      .poll(async () =>
        world.db.leaveRequest.count({
          where: {
            enrollmentId: f.enrollment!.id,
            kind: "PERIOD_PAUSE",
            status: "APPROVED",
          },
        }),
      )
      .toBe(1);
  });
  await test.step("Chỉ các buổi trong khoảng thành Có phép, không kết thúc ghi danh", async () => {
    const rows = await world.db.sessionParticipant.findMany({
      where: { enrollmentId: f.enrollment!.id },
      orderBy: { session: { startsAt: "asc" } },
    });
    expect(rows.map((row) => row.attendance)).toEqual([
      "EXCUSED",
      "EXCUSED",
      "UNMARKED",
    ]);
    expect(rows.every((row) => !row.cancelled)).toBe(true);
    expect(
      (
        await world.db.enrollment.findUniqueOrThrow({
          where: { id: f.enrollment!.id },
        })
      ).status,
    ).toBe("ACTIVE");
    const summary = await world.call<{ counts: { required: number } }>(
      "parent",
      `academic/me/students/${f.student.id}/attendance`,
    );
    expect(summary.counts.required).toBe(0);
    await actors.shot(staff, "07-pause-range");
  });
});

test("08 - Chuyển lớp có ngày hiệu lực", async ({ world, actors }) => {
  const f = await world.fixture("transfer");
  const target = await world.db.class.create({
    data: {
      programId: f.program.id,
      name: unique("Lớp mới cùng khóa"),
      teacherId: f.users.teacher.id,
      monthlyFee: 500000,
      capacity: 8,
      weeklySchedules: {
        create: [
          { weekday: 2, startTime: "06:00", endTime: "07:00" },
          { weekday: 4, startTime: "06:00", endTime: "07:00" },
        ],
      },
    },
  });
  const before = await world.session(f, 1, "06:00");
  const after = await world.session(f, 5, "06:00");
  const newSession = await world.session(f, 6, "06:00", { classId: target.id });
  for (const session of [before, after])
    await world.call(
      "teacher",
      `academic/sessions/${session.id}/roster`,
      "POST",
    );
  const wrong = await world.fixture("transfer different course", {
    enroll: false,
  });
  await test.step("Không cho chuyển sang khóa khác và không ghi nửa chừng", async () => {
    const rejected = await world.raw(
      "staff",
      `academic/enrollments/${f.enrollment!.id}/transfer`,
      "POST",
      {
        targetClassId: wrong.classroom.id,
        effectiveAt: instant(3, "00:00").toISOString(),
        reason: "Kiểm tra khóa khác",
      },
    );
    expect(rejected.status).toBe(409);
    expect(
      await world.db.enrollmentTransfer.count({
        where: { enrollmentId: f.enrollment!.id },
      }),
    ).toBe(0);
  });
  const staff = await actors.open("staff");
  await test.step("Chọn lớp mới và ngày hiệu lực qua giao diện", async () => {
    await staff.goto(
      `/staff/students?studentId=${f.student.id}&enrollmentId=${f.enrollment!.id}&action=change`,
    );
    await chooseCard(staff, target.name);
    await staff
      .getByLabel("Hiệu lực từ (giờ Việt Nam)", { exact: true })
      .fill(day(3));
    await select(staff, "Lý do chuyển", "Đổi giờ cho tiện đưa đón");
    await staff
      .getByRole("button", { name: "Chuyển lớp", exact: true })
      .click();
    await expect
      .poll(async () =>
        world.db.enrollmentTransfer.count({
          where: { enrollmentId: f.enrollment!.id },
        }),
      )
      .toBe(1);
  });
  await test.step("Giữ lịch sử lớp cũ, đóng/mở placement đúng thời điểm và cập nhật buổi tương lai", async () => {
    const placements = await world.db.enrollmentPlacement.findMany({
      where: { enrollmentId: f.enrollment!.id },
      orderBy: { effectiveFrom: "asc" },
    });
    expect(placements).toHaveLength(2);
    expect(placements[0].classId).toBe(f.classroom.id);
    expect(placements[0].effectiveTo?.toISOString()).toBe(
      instant(3, "00:00").toISOString(),
    );
    expect(placements[1].classId).toBe(target.id);
    expect(placements[1].effectiveFrom.toISOString()).toBe(
      placements[0].effectiveTo?.toISOString(),
    );
    const rows = await world.db.sessionParticipant.findMany({
      where: { enrollmentId: f.enrollment!.id },
    });
    expect(rows.find((row) => row.sessionId === before.id)?.cancelled).toBe(
      false,
    );
    expect(rows.find((row) => row.sessionId === after.id)?.cancelled).toBe(
      true,
    );
    expect(rows.find((row) => row.sessionId === newSession.id)?.cancelled).toBe(
      false,
    );
    await actors.shot(staff, "08-transfer-history");
  });
});

test("09 - Kết thúc môn và đăng ký lại", async ({ world, actors }) => {
  const f = await world.fixture("finish");
  const past = await world.session(f, -2, "07:00", { status: "COMPLETED" });
  const future = await world.session(f, 3, "07:00");
  await world.db.sessionParticipant.create({
    data: {
      sessionId: past.id,
      enrollmentId: f.enrollment!.id,
      attendance: "PRESENT",
    },
  });
  await world.call("teacher", `academic/sessions/${future.id}/roster`, "POST");
  const staff = await actors.open("staff");
  await test.step("Kết thúc môn có xác nhận; hủy ghế tương lai và giữ lịch sử đã học", async () => {
    await staff.goto(
      `/staff/students?studentId=${f.student.id}&enrollmentId=${f.enrollment!.id}&action=withdraw`,
    );
    await chooseCard(staff, "Một môn");
    await select(staff, "Lý do (không bắt buộc)", "Đã đạt mục tiêu");
    await staff
      .getByRole("button", { name: "Kết thúc môn…", exact: true })
      .click();
    await confirm(staff, "Kết thúc môn");
    await expect
      .poll(
        async () =>
          (
            await world.db.enrollment.findUniqueOrThrow({
              where: { id: f.enrollment!.id },
            })
          ).status,
      )
      .toBe("ENDED");
    const rows = await world.db.sessionParticipant.findMany({
      where: { enrollmentId: f.enrollment!.id },
    });
    expect(rows.find((row) => row.sessionId === future.id)?.cancelled).toBe(
      true,
    );
    expect(rows.find((row) => row.sessionId === past.id)?.attendance).toBe(
      "PRESENT",
    );
    expect(rows.find((row) => row.sessionId === past.id)?.cancelled).toBe(
      false,
    );
    await actors.shot(staff, "09-old-enrollment-ended");
  });
  await test.step("Học lại tạo đăng ký và khoản thu mới; ghi danh cũ giữ trạng thái kết thúc", async () => {
    // Pick the first weekly study day on/after tomorrow.
    let offset = 1;
    while (![1, 3].includes(new Date(`${day(offset)}T12:00:00+07:00`).getDay()))
      offset++;
    const response = await world.raw(
      "staff",
      "registrations",
      "POST",
      {
        targetStudentId: f.student.id,
        classId: f.classroom.id,
        packageMonths: 1,
        startDate: day(offset),
      },
      { "Idempotency-Key": unique("re-enroll") },
    );
    expect(
      response.ok,
      await response.text().then((text) => text.slice(0, 300)),
    ).toBe(true);
    // Read the new order by its fixture child rather than attempting to consume the response twice.
    const order = await world.db.registrationOrder.findFirstOrThrow({
      where: { targetStudentId: f.student.id, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    });
    expect(order.id).not.toBe(f.enrollment!.registrationOrderId);
    expect(
      await world.db.payment.count({
        where: { registrationOrderId: order.id },
      }),
    ).toBe(0);
    const paid = await world.raw(
      "staff",
      `registrations/${order.id}/confirm-payment`,
      "POST",
      { receiptNumber: unique("BL học lại") },
      { "Idempotency-Key": unique("pay-again") },
    );
    expect(paid.ok, await paid.text().then((text) => text.slice(0, 300))).toBe(
      true,
    );
    const enrollment = await world.db.enrollment.findUniqueOrThrow({
      where: { registrationOrderId: order.id },
    });
    expect(enrollment.id).not.toBe(f.enrollment!.id);
    expect(enrollment.status).toBe("ACTIVE");
    expect(
      await world.db.payment.count({
        where: { registrationOrderId: order.id },
      }),
    ).toBe(1);
    expect(
      (
        await world.db.enrollment.findUniqueOrThrow({
          where: { id: f.enrollment!.id },
        })
      ).status,
    ).toBe("ENDED");
    await staff.goto(`/staff/enrollments/new?registrationId=${order.id}`);
    await expect(
      staff.getByText(/Đã thanh toán|Hoàn tất|Biên lai/).first(),
    ).toBeVisible();
    await actors.shot(staff, "09-new-payment-required");
  });
});
