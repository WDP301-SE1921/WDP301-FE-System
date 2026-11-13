import { test, expect, day, unique } from "./world";

test("02 - Ghi danh và học phí", async ({ world, actors }) => {
  const fixture = await world.fixture("registration", { enroll: false });
  const fullFixture = await world.fixture("Lớp đã đủ chỗ", { capacity: 1 });
  const full = fullFixture.classroom;
  const childName = unique("Nguyễn Minh Anh");
  let startOffset = 3;
  while (
    ![1, 3].includes(new Date(`${day(startOffset)}T00:00:00Z`).getUTCDay())
  )
    startOffset++;
  const startDate = day(startOffset);
  let studentId = "",
    registrationId = "";
  const parent = await actors.open("parent");
  await test.step("Tạo hồ sơ con từ app phụ huynh đang chạy trên trình duyệt", async () => {
    await parent.goto("/add-child");
    await parent
      .getByPlaceholder("Nguyễn Minh Anh", { exact: true })
      .fill(childName);
    await parent.getByRole("radio", { name: /8$/ }).click();
    const added = parent.waitForResponse(
      (response) =>
        /\/students$/.test(response.url()) &&
        response.request().method() === "POST",
    );
    await parent
      .getByRole("button", { name: "Thêm học sinh", exact: true })
      .click();
    expect((await added).ok()).toBe(true);
    const student = await world.db.studentProfile.findFirstOrThrow({
      where: { fullName: childName },
    });
    studentId = student.id;
    expect(student.parentProfileId).toBe(
      (
        await world.db.parentProfile.findUniqueOrThrow({
          where: { userId: fixture.users.parent.id },
        })
      ).id,
    );
    expect(student.grade).toBe(8);
    await actors.shot(parent, "02-child-created");
  });
  const staff = await actors.open("staff");
  await test.step("Chỉ chọn được lớp đúng khối còn chỗ; lập nháp không tự thu tiền", async () => {
    await staff.goto("/staff/enrollments/new");
    await staff
      .getByLabel("Tìm email phụ huynh", { exact: true })
      .fill("parent@edugrade.local");
    await staff.getByRole("button", { name: /parent@edugrade\.local/ }).click();
    await staff.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await staff.getByRole("radio", { name: new RegExp(childName) }).check();
    await staff.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    const picker = staff.getByRole("radiogroup", { name: "Danh sách lớp học" });
    await expect(picker).toBeVisible();
    await staff.locator("#registration-start").fill(startDate);
    await staff.locator("#registration-months").fill("1");
    const radios = picker.getByRole("radio");
    await expect(radios).not.toHaveCount(0);
    const labels = await picker.locator("label").allInnerTexts();
    expect(labels.every((label) => label.includes("Khối 8"))).toBe(true);
    await expect(picker.locator(`input[value="${full.id}"]`)).toBeDisabled();
    await picker.locator(`input[value="${fixture.classroom.id}"]`).check();
    const draft = staff.waitForResponse(
      (response) =>
        response.url().endsWith("/registrations") &&
        response.request().method() === "POST",
    );
    await staff
      .getByRole("button", { name: "Lập bản nháp", exact: true })
      .click();
    const response = await draft;
    expect(response.ok()).toBe(true);
    registrationId = (await response.json()).data.id;
    expect(
      await world.db.payment.count({
        where: { registrationOrderId: registrationId },
      }),
    ).toBe(0);
    expect(
      await world.db.enrollment.count({
        where: { registrationOrderId: registrationId },
      }),
    ).toBe(0);
    await actors.shot(staff, "02-unpaid-bill");
  });
  await test.step("Thu đủ tiền: payment, enrollment và biên lai cùng một đăng ký; gửi lại không tạo trùng", async () => {
    await staff
      .getByRole("button", { name: "Xác nhận thanh toán", exact: true })
      .click();
    const dialog = staff.getByRole("dialog", { name: "Xác nhận thanh toán" });
    await expect(
      dialog.getByRole("button", { name: "Đã thanh toán", exact: true }),
    ).toBeDisabled();
    const receiptNumber = unique("BL");
    await dialog.locator("#registration-receipt-number").fill(receiptNumber);
    await dialog
      .getByRole("checkbox", { name: /Tôi đã kiểm tra và nhận đủ/ })
      .check();
    const paid = staff.waitForResponse(
      (response) =>
        response.url().includes("/confirm-payment") &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Đã thanh toán", exact: true })
      .click();
    const confirmation = await paid;
    expect(confirmation.ok()).toBe(true);
    const originalKey = confirmation.request().headers()["idempotency-key"];
    expect(originalKey).toBeTruthy();
    const replay = await world.raw(
      "staff",
      `registrations/${registrationId}/confirm-payment`,
      "POST",
      confirmation.request().postDataJSON(),
      { "Idempotency-Key": originalKey },
    );
    expect(replay.ok).toBe(true);
    await expect(dialog).toBeHidden();
    await expect(
      staff.getByText(receiptNumber, { exact: false }).first(),
    ).toBeVisible();
    const order = await world.db.registrationOrder.findUniqueOrThrow({
      where: { id: registrationId },
      include: { payment: true, enrollment: true },
    });
    expect(order.status).toBe("COMPLETED");
    expect(order.payment?.receiptNumber).toBe(receiptNumber);
    expect(Number(order.payment?.amount)).toBe(500000);
    expect(order.enrollment?.studentProfileId).toBe(studentId);
    expect(order.enrollment?.status).toBe("ACTIVE");
    const receipt = await world.call<{
      registrationId: string;
      status: string;
    }>("staff", `registrations/${registrationId}/receipt`);
    expect(receipt.registrationId).toBe(registrationId);
    expect(receipt.status).toBe("COMPLETED");
    expect(
      await world.db.payment.count({
        where: { registrationOrderId: registrationId },
      }),
    ).toBe(1);
    await staff.reload();
    await expect(
      staff.getByText(receiptNumber, { exact: false }).first(),
    ).toBeVisible();
    await actors.shot(staff, "02-receipt-persisted");
    await parent.goto(`/receipts/${registrationId}`);
    await expect(
      parent.getByText(receiptNumber, { exact: false }).first(),
    ).toBeVisible();
  });
  await test.step("API cũng từ chối lớp sai khối và lớp hết chỗ", async () => {
    const wrong = await world.fixture("wrong grade", {
      enroll: false,
      grade: 9,
    });
    for (const [classId, code] of [
      [full.id, "CLASS_FULL"],
      [wrong.classroom.id, "CLASS_GRADE_MISMATCH"],
    ]) {
      const response = await world.raw(
        "staff",
        "registrations",
        "POST",
        {
          targetStudentId: studentId,
          classId,
          packageMonths: 1,
          startDate,
        },
        { "Idempotency-Key": unique("rejected") },
      );
      expect(response.status).toBe(409);
      expect((await response.json()).error.code).toBe(code);
    }
  });
});
