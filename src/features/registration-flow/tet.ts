import { addCalendarMonths } from "./calendar";

/**
 * Mùng 1 Tết by year (local dates). Must match `LUNAR_NEW_YEAR` in the BE
 * (`registration-flow/tuition-pricing.ts`), which is the source of the real price.
 */
const LUNAR_NEW_YEAR = [
  "2025-01-29",
  "2026-02-17",
  "2027-02-06",
  "2028-01-26",
  "2029-02-13",
  "2030-02-03",
  "2031-01-23",
  "2032-02-11",
  "2033-01-31",
  "2034-02-19",
  "2035-02-08",
];

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
