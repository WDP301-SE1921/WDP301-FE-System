import { directoryApi, type PaymentRecord } from "@/features/directory/api";
import type { RegistrationOrder } from "@/types/backend";

const PAGE_SIZE = 100;
/** Giới hạn an toàn khi đọc hết các trang; trung tâm có vài nghìn đơn là cùng. */
const MAX_PAGES = 50;

const amount = (value: number | string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/** Đơn chờ thu (`DRAFT`) của cả trung tâm và tổng tiền dự kiến. Nhân viên mới gọi được. */
export async function readPendingRegistrations(signal?: AbortSignal) {
  const items: RegistrationOrder[] = [];
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await directoryApi.registrations(
      { status: "DRAFT", page, limit: PAGE_SIZE },
      signal,
    );
    items.push(...batch.items);
    total = batch.total;
    if (!batch.items.length || page * batch.limit >= batch.total) break;
  }
  return {
    count: total,
    amount: items.reduce((sum, item) => sum + amount(item.quotedAmount), 0),
    items,
  };
}

/** Số đơn đã thu và tổng tiền đã thu (BE trả `totalAmount` thật của toàn bộ bộ lọc). */
export async function readCompletedSummary(signal?: AbortSignal) {
  const [registrations, payments] = await Promise.all([
    directoryApi.registrations({ status: "COMPLETED", page: 1, limit: 1 }, signal),
    directoryApi.payments({ page: 1, limit: 1 }, signal),
  ]);
  return {
    count: registrations.total,
    amount: amount(payments.totalAmount),
  };
}

/** Biên lai trong khoảng ngày (giờ Việt Nam, `YYYY-MM-DD`). */
export async function readPayments(
  fromDate: string,
  toDate: string,
  signal?: AbortSignal,
) {
  const items: PaymentRecord[] = [];
  let totalAmount = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await directoryApi.payments(
      { fromDate, toDate, page, limit: PAGE_SIZE },
      signal,
    );
    items.push(...batch.items);
    totalAmount = amount(batch.totalAmount);
    if (!batch.items.length || page * batch.limit >= batch.total) break;
  }
  return { items, totalAmount };
}

/** Ngày `YYYY-MM-DD` (giờ Việt Nam) của một thời điểm ISO. */
export function vietnamDay(value: string) {
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10);
}

export { amount as moneyAmount };
