import { test, expect, unique, day } from "../demo/world";
import {
  assertParentRefunds,
  draftRegistration,
  paidRegistration,
  tetPackageStart,
  type ShiftSummary,
  type RefundView,
  type PaymentMethod,
} from "./business-fixtures";

test("@updates Tết: giá mới, chọn chuyển khoản trên web, biên lai trên app", async ({
  world,
  actors,
}) => {
  const f = await draftRegistration(world, "Tết chuyển khoản", {
    startDate: tetPackageStart(),
  });
  const bill = await world.call<{
    pricing: {
      listTotal: string;
      total: string;
      tetDiscount: { amount: string } | null;
    };
  }>("staff", `registrations/${f.registrationId}/bill`);
  expect(Number(bill.pricing.listTotal)).toBe(2250000);
  expect(Number(bill.pricing.total)).toBe(1875000);
  expect(Number(bill.pricing.tetDiscount?.amount)).toBe(375000);
  expect(
    await world.db.payment.count({
      where: { registrationOrderId: f.registrationId },
    }),
  ).toBe(0);

  const staff = await actors.open("staff");
  await staff.goto(
    `/staff/payments?search=${encodeURIComponent(f.student.fullName)}`,
  );
  await staff
    .getByRole("row")
    .filter({ hasText: f.student.fullName })
    .getByRole("button", { name: /Thu phí/ })
    .click();
  await staff
    .getByRole("button", { name: "Xác nhận thanh toán", exact: true })
    .click();
  const dialog = staff.getByRole("dialog", { name: "Xác nhận thanh toán" });
  await dialog
    .getByRole("checkbox", { name: /Tôi đã kiểm tra và nhận đủ/ })
    .check();
  await expect(
    dialog.getByRole("button", { name: "Đã thanh toán", exact: true }),
  ).toBeDisabled();
  const receiptNumber = unique("BL Tết bank");
  await dialog.locator("#registration-receipt-number").fill(receiptNumber);
  await dialog.getByRole("radio", { name: /^Chuyển khoản/ }).check();
  const confirmed = staff.waitForResponse(
    (response) =>
      response
        .url()
        .endsWith(`/registrations/${f.registrationId}/confirm-payment`) &&
      response.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Đã thanh toán", exact: true })
    .click();
  const response = await confirmed;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON().method).toBe("BANK_TRANSFER");
  await expect(dialog).toBeHidden();
  const payment = await world.db.payment.findUniqueOrThrow({
    where: { registrationOrderId: f.registrationId },
  });
  expect(payment.method).toBe("BANK_TRANSFER");
  expect(Number(payment.amount)).toBe(1875000);
  const parent = await actors.open("parent");
  await parent.goto(`/bills/${f.registrationId}`);
  await expect(parent.getByText(/Tết/).first()).toBeVisible();
  await parent.goto(`/receipts/${f.registrationId}`);
  await expect(
    parent.getByText(receiptNumber, { exact: false }).first(),
  ).toBeVisible();
  await expect(
    parent.getByText("Chuyển khoản", { exact: true }).first(),
  ).toBeVisible();
  await actors.shot(parent, "updates-tet-bank-receipt");
  const odd = await draftRegistration(world, "Tết làm tròn VND", {
    startDate: tetPackageStart(),
    fee: 750001,
  });
  const oddBill = await world.call<{
    pricing: { total: string; tetDiscount: { amount: string } };
  }>("staff", `registrations/${odd.registrationId}/bill`);
  expect(Number(oddBill.pricing.tetDiscount.amount)).toBe(375000);
  expect(Number(oddBill.pricing.total)).toBe(1875003);
});

test("@updates Đối soát ca tách tiền mặt, chuyển khoản và khách cũ chưa có hình thức", async ({
  world,
}) => {
  const before = await world.call<ShiftSummary>(
    "staff",
    "payments/shift-summary",
  );
  const cash = await paidRegistration(world, "cash shift", {
    method: "CASH",
    months: 1,
    fee: 600001,
  });
  const bank = await paidRegistration(world, "bank shift", {
    method: "BANK_TRANSFER",
    months: 1,
    fee: 600003,
  });
  const legacy = await paidRegistration(world, "legacy method", {
    method: null,
    months: 1,
    fee: 600005,
  });
  const after = await world.call<ShiftSummary>(
    "staff",
    "payments/shift-summary",
  );
  for (const [method, f] of [
    ["CASH", cash],
    ["BANK_TRANSFER", bank],
    ["UNKNOWN", legacy],
  ] as const) {
    expect(after.collected[method].count - before.collected[method].count).toBe(
      1,
    );
    expect(
      Number(after.collected[method].amount) -
        Number(before.collected[method].amount),
    ).toBe(Number(f.payment.amount));
  }
  expect(Number(after.cashInDrawer) - Number(before.cashInDrawer)).toBe(
    Number(cash.payment.amount),
  );
  expect(legacy.payment.method).toBeNull();
  const managed = await world.call<ShiftSummary>(
    "manager",
    `payments/shift-summary?staffId=${cash.users.staff.id}&date=${day()}`,
  );
  expect(managed).toEqual(after);
  const filtered = await world.call<{
    items: { id: string; method: string }[];
  }>(
    "staff",
    `payments?method=BANK_TRANSFER&confirmedBy=me&search=${encodeURIComponent(bank.payment.receiptNumber)}`,
  );
  expect(filtered.items.map((item) => item.id)).toEqual([bank.payment.id]);
  expect((await world.raw("parent", "payments/shift-summary")).status).toBe(
    403,
  );
});

test("@updates Khôi phục xác nhận thu tiền sau lỗi mạng giữ nguyên khóa, hình thức và dữ liệu cũ", async ({
  world,
  actors,
}) => {
  const staff = await actors.open("staff");
  for (const method of ["CASH", "BANK_TRANSFER", null] as const) {
    await test.step(`Khôi phục ${method ?? "lần xác nhận cũ chưa có hình thức"}`, async () => {
      const f = await draftRegistration(world, "payment retry");
      const receiptNumber = unique("BL retry");
      const saved = {
        key: unique("retry key"),
        body: { receiptNumber } as {
          receiptNumber: string;
          method?: PaymentMethod;
        },
      };
      await staff.goto(`/staff/payments?registrationId=${f.registrationId}`);
      if (method === null) {
        await staff.evaluate(
          ({ userId, registrationId, attempt }) => {
            sessionStorage.setItem(
              `edugrade:registrations:${userId}:${registrationId}:payment`,
              JSON.stringify(attempt),
            );
          },
          {
            userId: f.users.staff.id,
            registrationId: f.registrationId,
            attempt: saved,
          },
        );
      }
      await staff
        .getByRole("button", { name: "Xác nhận thanh toán", exact: true })
        .click();
      const dialog = staff.getByRole("dialog", { name: "Xác nhận thanh toán" });
      if (method !== null) {
        await staff.route(
          `**/registrations/${f.registrationId}/confirm-payment`,
          async (route) => {
            saved.key = route.request().headers()["idempotency-key"];
            saved.body = route.request().postDataJSON() as typeof saved.body;
            await route.fulfill({
              status: 503,
              contentType: "application/json",
              body: JSON.stringify({
                error: {
                  code: "SERVICE_UNAVAILABLE",
                  message: "Temporary network failure",
                },
              }),
            });
          },
          { times: 1 },
        );
        await dialog
          .locator("#registration-receipt-number")
          .fill(receiptNumber);
        await dialog
          .getByRole("radio", {
            name: method === "CASH" ? /^Tiền mặt/ : /^Chuyển khoản/,
          })
          .check();
        await dialog
          .getByRole("checkbox", { name: /Tôi đã kiểm tra và nhận đủ/ })
          .check();
        const failed = staff.waitForResponse(
          (response) =>
            response
              .url()
              .endsWith(`/registrations/${f.registrationId}/confirm-payment`) &&
            response.request().method() === "POST",
        );
        await dialog
          .getByRole("button", { name: "Đã thanh toán", exact: true })
          .click();
        expect((await failed).status()).toBe(503);
        expect(
          await world.db.payment.count({
            where: { registrationOrderId: f.registrationId },
          }),
        ).toBe(0);
        await dialog
          .locator("form")
          .getByRole("button", { name: "Đóng", exact: true })
          .click();
        await expect(dialog).toBeHidden();
        await staff
          .getByRole("button", { name: "Xác nhận thanh toán", exact: true })
          .click();
        await expect(
          dialog.getByRole("radio", {
            name: method === "CASH" ? /^Tiền mặt/ : /^Chuyển khoản/,
          }),
        ).toBeChecked();
      } else {
        await expect(
          dialog.getByText(/Lần xác nhận cũ chưa ghi hình thức/),
        ).toBeVisible();
      }
      await expect(
        dialog.getByRole("button", { name: "Thử xác nhận lại", exact: true }),
      ).toBeDisabled();
      await dialog
        .getByRole("checkbox", { name: /Tôi đã kiểm tra và nhận đủ/ })
        .check();
      const confirmed = staff.waitForResponse(
        (response) =>
          response
            .url()
            .endsWith(`/registrations/${f.registrationId}/confirm-payment`) &&
          response.request().method() === "POST",
      );
      await dialog
        .getByRole("button", { name: "Thử xác nhận lại", exact: true })
        .click();
      const response = await confirmed;
      expect(response.ok()).toBe(true);
      expect(response.request().headers()["idempotency-key"]).toBe(saved.key);
      expect(response.request().postDataJSON()).toEqual(saved.body);
      await expect(dialog).toBeHidden();
      const payment = await world.db.payment.findUniqueOrThrow({
        where: { registrationOrderId: f.registrationId },
      });
      expect(payment.method).toBe(method);
      const repeated = await world.raw(
        "staff",
        `registrations/${f.registrationId}/confirm-payment`,
        "POST",
        saved.body,
        { "Idempotency-Key": saved.key },
      );
      expect(repeated.ok).toBe(true);
      expect(
        await world.db.payment.count({
          where: { registrationOrderId: f.registrationId },
        }),
      ).toBe(1);
    });
  }
  await actors.shot(staff, "updates-payment-retries");
});

test("@updates Hoàn tiền: nhân viên ghi nhận, quản lý duyệt, chỉ công khai khoản đã duyệt", async ({
  world,
  actors,
}) => {
  const f = await paidRegistration(world, "refund approval", {
    startDate: tetPackageStart(),
  });
  const before = await world.call<ShiftSummary>(
    "staff",
    "payments/shift-summary",
  );
  const readQuote = () =>
    world.call<{
      months: { price: string; started: boolean; tet: boolean }[];
      refundable: string;
      pendingAmount: string;
      refundedAmount: string;
    }>("staff", `enrollments/${f.enrollment.id}/refund-quote`);
  const readNet = async () => {
    const payments = await world.call<{
      netAmount: string;
      refundedAmount: string;
    }>(
      "staff",
      `payments?search=${encodeURIComponent(f.payment.receiptNumber)}`,
    );
    return {
      net: Number(payments.netAmount),
      refunded: Number(payments.refundedAmount),
    };
  };
  const initialQuote = await readQuote();
  expect(
    initialQuote.months.map((month) => [
      Number(month.price),
      month.started,
      month.tet,
    ]),
  ).toEqual([
    [375000, false, true],
    [750000, false, false],
    [750000, false, false],
  ]);
  expect(Number(initialQuote.refundable)).toBe(1875000);
  expect(await readNet()).toEqual({ net: 1875000, refunded: 0 });
  const staff = await actors.open("staff");
  await staff.goto(
    `/staff/payments?view=payments&search=${encodeURIComponent(f.payment.receiptNumber)}`,
  );
  await staff
    .getByRole("row")
    .filter({ hasText: f.payment.receiptNumber })
    .getByRole("button", { name: /Hoàn tiền/ })
    .click();
  const dialog = staff.getByRole("dialog", { name: "Ghi nhận hoàn tiền" });
  await expect(
    dialog.getByRole("region", { name: "Đề xuất số tiền hoàn" }),
  ).toBeVisible();
  await dialog.locator("#refund-amount").fill("100000");
  const requested = staff.waitForResponse(
    (response) =>
      response.url().endsWith(`/payments/${f.payment.id}/refunds`) &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Gửi Quản lý duyệt" }).click();
  const response = await requested;
  expect(response.ok()).toBe(true);
  const pending = (await response.json()).data as RefundView;
  expect(pending.status).toBe("PENDING");
  await expect(dialog).toBeHidden();
  await assertParentRefunds(world, f.registrationId, f.student.id, []);
  const pendingQuote = await readQuote();
  expect(Number(pendingQuote.pendingAmount)).toBe(100000);
  expect(Number(pendingQuote.refundable)).toBe(1775000);
  expect(await readNet()).toEqual({ net: 1875000, refunded: 0 });
  const duplicate = await world.raw(
    "staff",
    `payments/${f.payment.id}/refunds`,
    "POST",
    {
      amount: "10000",
      method: "CASH",
      reason: "Không được ghi nhận trùng khi chờ duyệt",
    },
  );
  expect(duplicate.status).toBe(409);
  expect((await duplicate.json()).error.code).toBe("REFUND_PENDING");
  expect(
    await world.call<ShiftSummary>("staff", "payments/shift-summary"),
  ).toEqual(before);
  expect(
    (
      await world.raw("staff", `refunds/${pending.id}/decision`, "POST", {
        approve: true,
      })
    ).status,
  ).toBe(403);

  const manager = await actors.open("manager");
  await manager.goto("/manager/payments");
  await manager
    .getByRole("button", {
      name: `Duyệt hoàn ${f.payment.receiptNumber}`,
      exact: true,
    })
    .click();
  const decision = manager.getByRole("dialog", { name: "Duyệt hoàn tiền" });
  const decided = manager.waitForResponse(
    (result) =>
      result.url().endsWith(`/refunds/${pending.id}/decision`) &&
      result.request().method() === "POST",
  );
  await decision
    .getByRole("button", { name: "Duyệt hoàn tiền", exact: true })
    .click();
  expect((await decided).ok()).toBe(true);
  await expect(decision).toBeHidden();
  await assertParentRefunds(world, f.registrationId, f.student.id, [
    pending.id,
  ]);
  expect(await readNet()).toEqual({ net: 1775000, refunded: 100000 });
  const after = await world.call<ShiftSummary>(
    "staff",
    "payments/shift-summary",
  );
  expect(
    Number(after.refunded.CASH.amount) - Number(before.refunded.CASH.amount),
  ).toBe(100000);
  expect(Number(after.cashInDrawer) - Number(before.cashInDrawer)).toBe(
    -100000,
  );
  expect(
    (
      await world.db.enrollment.findUniqueOrThrow({
        where: { id: f.enrollment.id },
      })
    ).status,
  ).toBe("ACTIVE");
  const repeat = await world.raw(
    "manager",
    `refunds/${pending.id}/decision`,
    "POST",
    { approve: true },
  );
  expect(repeat.status).toBe(409);
  expect(
    await world.db.outboxEvent.count({
      where: { eventType: "PAYMENT_REFUNDED", aggregateId: pending.id },
    }),
  ).toBe(1);

  const rejected = await world.call<RefundView>(
    "staff",
    `payments/${f.payment.id}/refunds`,
    "POST",
    {
      amount: "200000",
      method: "BANK_TRANSFER",
      reason: unique("Chờ kiểm tra nội bộ"),
    },
  );
  await world.call("manager", `refunds/${rejected.id}/decision`, "POST", {
    approve: false,
    note: "Đề nghị kiểm tra lại số tháng",
  });
  await assertParentRefunds(world, f.registrationId, f.student.id, [
    pending.id,
  ]);
  const rejectedQuote = await readQuote();
  expect(Number(rejectedQuote.pendingAmount)).toBe(0);
  expect(Number(rejectedQuote.refundedAmount)).toBe(100000);
  expect(Number(rejectedQuote.refundable)).toBe(1775000);
  expect(await readNet()).toEqual({ net: 1775000, refunded: 100000 });
  expect(
    await world.call<ShiftSummary>("staff", "payments/shift-summary"),
  ).toEqual(after);
  const internal = await world.call<{ payment: { refunds: RefundView[] } }>(
    "staff",
    `registrations/${f.registrationId}`,
  );
  expect(internal.payment.refunds.map((item) => item.id)).toEqual([
    pending.id,
    rejected.id,
  ]);
  for (const payload of [
    { amount: "0", method: "CASH", reason: "Không hoàn bằng không" },
    { amount: "9999999", method: "CASH", reason: "Vượt tiền đã thu" },
    { amount: "1000", method: "CASH", reason: "   " },
    { amount: "1000", method: "INVALID", reason: "Sai hình thức" },
  ]) {
    const invalid = await world.raw(
      "staff",
      `payments/${f.payment.id}/refunds`,
      "POST",
      payload,
    );
    expect([400, 409]).toContain(invalid.status);
  }
  expect(
    await world.db.paymentRefund.count({ where: { paymentId: f.payment.id } }),
  ).toBe(2);
  await actors.shot(manager, "updates-refund-approved");
});

test("@updates Đề xuất hoàn bỏ tháng đã bắt đầu; hóa đơn cũ giữ nguyên giá và hình thức", async ({
  world,
}) => {
  const f = await world.fixture("legacy pricing");
  if (!f.enrollment) throw new Error("Missing enrollment");
  // Model a pre-migration snapshot spanning a Tết month; it must never acquire a new discount.
  await world.db.registrationOrder.update({
    where: { id: f.enrollment.registrationOrderId },
    data: {
      packageMonths: 3,
      quotedAmount: 1500000,
      listAmount: null,
      tetDiscountAmount: null,
      startDate: new Date("2026-01-19T00:00:00Z"),
      endDate: new Date("2026-04-19T00:00:00Z"),
      payment: {
        create: {
          receiptNumber: unique("BL legacy"),
          amount: 1500000,
          confirmedByManagerId: f.users.staff.id,
        },
      },
    },
  });
  await world.db.enrollment.update({
    where: { id: f.enrollment.id },
    data: {
      status: "ENDED",
      packageMonths: 3,
      startDate: new Date("2026-01-19T00:00:00Z"),
      endDate: new Date("2026-04-19T00:00:00Z"),
      endedAt: new Date("2026-02-01T00:00:00Z"),
    },
  });
  const quote = await world.call<{
    months: { price: string; tet: boolean; started: boolean }[];
    refundable: string;
  }>("staff", `enrollments/${f.enrollment.id}/refund-quote`);
  expect(
    quote.months.map((month) => [
      Number(month.price),
      month.tet,
      month.started,
    ]),
  ).toEqual([
    [500000, false, true],
    [500000, false, false],
    [500000, false, false],
  ]);
  expect(Number(quote.refundable)).toBe(1000000);
  const bill = await world.call<{
    pricing: { total: string; tetDiscount: unknown };
    payment: { method: unknown };
  }>("parent", `registrations/${f.enrollment.registrationOrderId}/bill`);
  expect(Number(bill.pricing.total)).toBe(1500000);
  expect(bill.pricing.tetDiscount).toBeNull();
  expect(bill.payment.method).toBeNull();
});
