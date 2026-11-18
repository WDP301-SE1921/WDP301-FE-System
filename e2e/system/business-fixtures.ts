import { day, expect, unique, type World } from "../demo/world";

export type BusinessFixture = Awaited<ReturnType<World["fixture"]>>;
export type PaymentMethod = "CASH" | "BANK_TRANSFER";
export interface RefundView {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: string;
  reason: string;
}
export interface FinancialResponse {
  registrationId: string;
  payment: { method: PaymentMethod | null; refunds: RefundView[] } | null;
}
export interface ShiftSummary {
  staffId: string;
  collected: Record<
    PaymentMethod | "UNKNOWN",
    { count: number; amount: string }
  >;
  refunded: Record<PaymentMethod, { count: number; amount: string }>;
  cashInDrawer: string;
}

export function nextClassDate(offset = 3): string {
  while (![1, 3].includes(new Date(`${day(offset)}T00:00:00Z`).getUTCDay()))
    offset++;
  return day(offset);
}

// An independent calendar/amount oracle: never import the implementation being tested.
export function tetPackageStart(): string {
  const tet = [
    "2027-02-06",
    "2028-01-26",
    "2029-02-13",
    "2030-02-03",
    "2031-01-23",
    "2032-02-11",
    "2033-01-31",
    "2034-02-19",
    "2035-02-08",
  ].find((date) => date > day(45));
  if (!tet)
    throw new Error("Extend the E2E lunar-new-year calendar beyond 2035.");
  const start = new Date(`${tet}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 21);
  while (![1, 3].includes(start.getUTCDay()))
    start.setUTCDate(start.getUTCDate() + 1);
  return start.toISOString().slice(0, 10);
}

export async function draftRegistration(
  world: World,
  label: string,
  options: {
    startDate?: string;
    months?: number;
    fee?: number;
    capacity?: number;
  } = {},
) {
  const f = await world.fixture(label, {
    enroll: false,
    capacity: options.capacity,
  });
  await world.db.class.update({
    where: { id: f.classroom.id },
    data: { monthlyFee: options.fee ?? 750000 },
  });
  const draft = await world.call<{ id: string }>(
    "staff",
    "registrations",
    "POST",
    {
      targetStudentId: f.student.id,
      classId: f.classroom.id,
      startDate: options.startDate ?? nextClassDate(),
      packageMonths: options.months ?? 3,
    },
  );
  return { ...f, registrationId: draft.id };
}

export async function paidRegistration(
  world: World,
  label: string,
  options: Parameters<typeof draftRegistration>[2] & {
    method?: PaymentMethod | null;
  } = {},
) {
  const f = await draftRegistration(world, label, options);
  const receiptNumber = unique("BL updates");
  await world.call(
    "staff",
    `registrations/${f.registrationId}/confirm-payment`,
    "POST",
    {
      receiptNumber,
      ...(options.method === null ? {} : { method: options.method ?? "CASH" }),
    },
  );
  const registration = await world.db.registrationOrder.findUniqueOrThrow({
    where: { id: f.registrationId },
    include: { payment: true, enrollment: true },
  });
  if (!registration.payment || !registration.enrollment)
    throw new Error(
      "Payment confirmation must create both payment and enrollment.",
    );
  return {
    ...f,
    registration,
    payment: registration.payment,
    enrollment: registration.enrollment,
  };
}

export async function assertParentRefunds(
  world: World,
  registrationId: string,
  studentId: string,
  expectedIds: string[],
) {
  for (const suffix of ["", "/bill", "/receipt"]) {
    const response = await world.call<FinancialResponse>(
      "parent",
      `registrations/${registrationId}${suffix}`,
    );
    expect(
      response.payment?.refunds.map((item) => item.id).sort(),
      `Parent registration${suffix}`,
    ).toEqual([...expectedIds].sort());
    expect(
      response.payment?.refunds.every((item) => item.status === "APPROVED"),
    ).toBe(true);
  }
  const bills = await world.call<{ items: FinancialResponse[] }>(
    "parent",
    `me/bills?studentId=${studentId}&limit=100`,
  );
  const bill = bills.items.find(
    (item) => item.registrationId === registrationId,
  );
  expect(bill, "The parent's own bill must be returned").toBeTruthy();
  expect(bill?.payment?.refunds.map((item) => item.id).sort()).toEqual(
    [...expectedIds].sort(),
  );
}

export async function activeFixture(world: World, label: string, capacity = 8) {
  const f = await world.fixture(label, { capacity });
  if (!f.enrollment?.endDate) throw new Error("Missing active enrollment term");
  await world.db.payment.create({
    data: {
      registrationOrderId: f.enrollment.registrationOrderId,
      amount: 6000000,
      method: "CASH",
      receiptNumber: unique("BL active"),
      confirmedByManagerId: f.users.staff.id,
    },
  });
  return { ...f, enrollment: f.enrollment, originalEnd: f.enrollment.endDate };
}
