/**
 * Hàm thuần đếm buổi theo lịch tuần, bỏ qua các khoảng nghỉ (từ 19/11/2026 chỉ còn kỳ nghỉ Tết,
 * xem `tetBreaks` trong `@/lib/lunar-new-year`). Ngày so sánh bằng chuỗi `YYYY-MM-DD` (giờ Việt
 * Nam) như BE.
 */

export interface ClosureRange {
  fromDate: string;
  toDate: string;
}

const DAY_MS = 86_400_000;

export function isClosedDay(day: string, closures: readonly ClosureRange[]) {
  const key = day.slice(0, 10);
  return closures.some(
    (closure) =>
      key >= closure.fromDate.slice(0, 10) &&
      key <= closure.toDate.slice(0, 10),
  );
}

/**
 * Số buổi một lớp có trong khoảng ngày, bỏ các khoảng nghỉ. `weekday` theo BE: 1 = Thứ 2 … 7 = CN.
 */
export function countSlots(
  schedules: readonly { weekday: number }[],
  from: string,
  to: string,
  closures: readonly ClosureRange[] = [],
): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let count = 0;
  for (let day = start; day <= end; day = new Date(day.getTime() + DAY_MS)) {
    if (closures.length && isClosedDay(day.toISOString().slice(0, 10), closures))
      continue;
    const weekday = day.getUTCDay() || 7;
    count += schedules.filter((slot) => slot.weekday === weekday).length;
  }
  return count;
}

/** Số ngày nghỉ rơi vào khoảng [from, to] (không đếm trùng khi các khoảng nghỉ chồng nhau). */
export function closedDaysInRange(
  from: string,
  to: string,
  closures: readonly ClosureRange[],
): number {
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS)
    if (isClosedDay(new Date(t).toISOString().slice(0, 10), closures)) count++;
  return count;
}
