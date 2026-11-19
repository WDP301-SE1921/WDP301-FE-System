// Mùng 1 Tết comes from the same table as the Tết break of the schedule.
import { LUNAR_NEW_YEAR } from "@/lib/lunar-new-year";
import { addCalendarMonths } from "./calendar";

const lastDayBefore = (day: string) =>
  new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);

export interface TuitionPreview {
  listTotal: number;
  /** Giảm 50% tháng của gói chứa mùng 1 Tết; `null` khi gói không có Tết. */
  tet: { amount: number; fromDate: string; toDate: string } | null;
  total: number;
}

/** Học phí dự kiến khi lập bill, cùng cách BE tính (tháng chứa mùng 1 Tết giảm nửa). */
export function previewTuition(
  startDate: string,
  months: number,
  monthlyFee: number,
): TuitionPreview {
  const listTotal = monthlyFee * months;
  if (!startDate || months < 1) return { listTotal, tet: null, total: listTotal };
  for (let index = 0; index < months; index++) {
    const from = addCalendarMonths(startDate, index);
    const to = addCalendarMonths(startDate, index + 1);
    if (LUNAR_NEW_YEAR.some((day) => day >= from && day < to)) {
      const amount = Math.floor(monthlyFee / 2);
      return {
        listTotal,
        tet: { amount, fromDate: from, toDate: lastDayBefore(to) },
        total: listTotal - amount,
      };
    }
  }
  return { listTotal, tet: null, total: listTotal };
}
