import type { PaymentRecord } from "@/features/directory/api";
import type { EnrollmentRecord, MakeupSource } from "@/types/academic-workflows";
import type { RegistrationClass } from "@/types/backend";
import type { ScheduledSession } from "@/types/curriculum";
import { addCalendarDays } from "@/lib/calendar-date";
import { vietnamDay } from "./staff-summary";

/** Số tiền BE trả dạng chuỗi Decimal; giá trị lỗi tính là 0. */
export const toAmount = (value: number | string | undefined | null) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

export const sumAmount = (items: PaymentRecord[]) =>
  items.reduce((sum, item) => sum + toAmount(item.amount), 0);

const DAY_MS = 86400000;
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

function monthEndOf(day: string) {
  const [year, month] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Ngày cuối thực sự đã qua của kỳ (không tính ngày tương lai). */
export const elapsedEnd = (toDate: string, today: string) =>
  toDate < today ? toDate : today;

/**
 * Kỳ so sánh cùng số ngày đã qua.
 * - Kỳ bắt đầu từ ngày 1 và nằm trong một tháng: cùng các ngày đó của tháng trước (01–13/11 ↔ 01–13/10).
 * - Kỳ khác: lùi đúng số ngày của kỳ, liền trước kỳ hiện tại.
 */
export function previousRange(fromDate: string, toDate: string) {
  if (fromDate.endsWith("-01") && fromDate.slice(0, 7) === toDate.slice(0, 7)) {
    const [year, month] = fromDate.split("-").map(Number);
    const prevFrom = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
    const prevMonthEnd = monthEndOf(prevFrom);
    const sameDay = `${prevFrom.slice(0, 8)}${toDate.slice(8, 10)}`;
    return { fromDate: prevFrom, toDate: sameDay > prevMonthEnd ? prevMonthEnd : sameDay };
  }
  const length = dayNumber(toDate) - dayNumber(fromDate) + 1;
  return {
    fromDate: addCalendarDays(fromDate, -length),
    toDate: addCalendarDays(fromDate, -1),
  };
}

export type DeltaTone = "up" | "down" | "neutral";
export interface Delta {
  text: string;
  tone: DeltaTone;
}

const pct = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

/**
 * So sánh hai số. Nền nhỏ (< 5) không ra % mà hiện "trước: x" màu xám để không la hét vô lý.
 * `lowerIsBetter` đảo màu (vd. học sinh nghỉ).
 */
export function compareCounts(
  current: number,
  previous: number | null | undefined,
  { lowerIsBetter = false, smallBase = 5 } = {},
): Delta | undefined {
  if (previous === null || previous === undefined) return undefined;
  if (previous < smallBase)
    return { text: `trước: ${one.format(previous)}`, tone: "neutral" };
  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.005) return { text: "không đổi", tone: "neutral" };
  const good = lowerIsBetter ? change < 0 : change > 0;
  return {
    text: `${change > 0 ? "▲" : "▼"} ${pct.format(Math.abs(change) * 100)}%`,
    tone: good ? "up" : "down",
  };
}

/** So sánh tỉ lệ % theo điểm phần trăm; chênh dưới 1 điểm để xám. */
export function comparePoints(
  current: number | null | undefined,
  previous: number | null | undefined,
  unit = "điểm",
): Delta | undefined {
  if (current === null || current === undefined) return undefined;
  if (previous === null || previous === undefined) return undefined;
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return { text: "không đổi", tone: "neutral" };
  return {
    text: `${diff > 0 ? "▲" : "▼"} ${one.format(Math.abs(diff))} ${unit}`,
    tone: Math.abs(diff) < 1 ? "neutral" : diff > 0 ? "up" : "down",
  };
}

export interface RankRow {
  key: string;
  label: string;
  value: number;
  count: number;
  share: number;
}

/** Gom doanh thu theo khóa, sắp giảm dần; `share` là phần trên tổng. */
export function groupRevenue(
  items: PaymentRecord[],
  pick: (item: PaymentRecord) => { key: string; label: string } | null,
): RankRow[] {
  const total = sumAmount(items) || 1;
  const map = new Map<string, RankRow>();
  for (const item of items) {
    const group = pick(item);
    if (!group) continue;
    const row = map.get(group.key) ?? { ...group, value: 0, count: 0, share: 0 };
    row.value += toAmount(item.amount);
    row.count += 1;
    map.set(group.key, row);
  }
  return [...map.values()]
    .map((row) => ({ ...row, share: row.value / total }))
    .sort((a, b) => b.value - a.value);
}

export interface PayerRow {
  email: string;
  total: number;
  receipts: number;
  students: number;
  classes: number;
  lastAt: string;
}

/** Phụ huynh đóng nhiều nhất trong danh sách biên lai (theo email đăng ký). */
export function topPayers(items: PaymentRecord[], limit = 6): PayerRow[] {
  const map = new Map<
    string,
    { total: number; receipts: number; students: Set<string>; classes: Set<string>; lastAt: string }
  >();
  for (const item of items) {
    const email = item.registrationOrder.parentEmail.toLowerCase();
    const row = map.get(email) ?? {
      total: 0,
      receipts: 0,
      students: new Set<string>(),
      classes: new Set<string>(),
      lastAt: item.confirmedAt,
    };
    row.total += toAmount(item.amount);
    row.receipts += 1;
    row.students.add(item.registrationOrder.studentFullName.trim().toLowerCase());
    row.classes.add(item.registrationOrder.class.id);
    if (item.confirmedAt > row.lastAt) row.lastAt = item.confirmedAt;
    map.set(email, row);
  }
  return [...map.entries()]
    .map(([email, row]) => ({
      email,
      total: row.total,
      receipts: row.receipts,
      students: row.students.size,
      classes: row.classes.size,
      lastAt: row.lastAt,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Tổng tiền theo từng ngày (giờ Việt Nam) cho một dãy ngày liên tục. */
export function dailyTotals(items: PaymentRecord[], fromDate: string, days: number) {
  const byDay = new Map<string, number>();
  for (const item of items) {
    const day = vietnamDay(item.confirmedAt);
    byDay.set(day, (byDay.get(day) ?? 0) + toAmount(item.amount));
  }
  return Array.from({ length: days }, (_, index) => {
    const day = addCalendarDays(fromDate, index);
    return { day, value: byDay.get(day) ?? 0 };
  });
}

export interface ExpiringRow {
  enrollment: EnrollmentRecord;
  endDate: string;
  daysLeft: number;
  /** Ước tính = học phí tháng của lớp × số tháng gói cũ. */
  estimate: number | null;
}

/**
 * Gói đang học sẽ hết hạn trong `withinDays` ngày và chưa có gói nối tiếp
 * (cùng học sinh, cùng lớp, bắt đầu từ ngày hết hạn trở đi).
 */
export function expiringEnrollments(
  enrollments: EnrollmentRecord[],
  classes: RegistrationClass[],
  today: string,
  withinDays: number,
): ExpiringRow[] {
  const fee = new Map(classes.map((item) => [item.id, toAmount(item.monthlyFee)]));
  const limit = addCalendarDays(today, withinDays);
  const rows: ExpiringRow[] = [];
  for (const enrollment of enrollments) {
    if (enrollment.status !== "ACTIVE" || !enrollment.endDate) continue;
    const endDate = enrollment.endDate.slice(0, 10);
    if (endDate < today || endDate > limit) continue;
    const renewed = enrollments.some(
      (other) =>
        other.id !== enrollment.id &&
        other.status !== "ENDED" &&
        other.classId === enrollment.classId &&
        !!other.studentProfile?.id &&
        other.studentProfile.id === enrollment.studentProfile?.id &&
        (other.startDate?.slice(0, 10) ?? "") >= endDate,
    );
    if (renewed) continue;
    const monthly = fee.get(enrollment.classId);
    rows.push({
      enrollment,
      endDate,
      daysLeft: dayNumber(endDate) - dayNumber(today),
      estimate: monthly ? monthly * enrollment.packageMonths : null,
    });
  }
  return rows.sort((a, b) => a.endDate.localeCompare(b.endDate));
}

export const AGING_BUCKETS = [
  { key: "0-3", label: "0–3 ngày", min: 0, max: 3 },
  { key: "4-7", label: "4–7 ngày", min: 4, max: 7 },
  { key: "8-14", label: "8–14 ngày", min: 8, max: 14 },
  { key: "15+", label: "> 14 ngày", min: 15, max: Infinity },
] as const;

/** Số ngày đã chờ tính từ buổi vắng. */
export const makeupAge = (source: MakeupSource, today: string) =>
  Math.max(0, dayNumber(today) - dayNumber(vietnamDay(source.session.startsAt)));

export function makeupAging(sources: MakeupSource[], today: string) {
  return AGING_BUCKETS.map((bucket) => ({
    ...bucket,
    count: sources.filter((source) => {
      const age = makeupAge(source, today);
      return age >= bucket.min && age <= bucket.max;
    }).length,
  }));
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});
const HOUR = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});
const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/**
 * Mức dùng phòng theo thứ × giờ bắt đầu trong một tuần: số phòng khác nhau đang có buổi
 * chia cho số phòng đang hoạt động. Phòng lấy theo lớp của buổi.
 */
export function roomHeatmap(
  sessions: ScheduledSession[],
  classes: RegistrationClass[],
  activeRooms: number,
) {
  const roomOf = new Map(classes.map((item) => [item.id, item.roomId ?? item.room?.id ?? null]));
  const cells = new Map<string, Set<string>>();
  const slots = new Set<string>();
  for (const session of sessions) {
    if (session.status === "CANCELLED") continue;
    const moment = new Date(session.startsAt);
    const slot = HOUR.format(moment);
    const weekday = WEEK_ORDER.indexOf(WEEKDAY.format(moment));
    const room = roomOf.get(session.classId) ?? `class:${session.classId}`;
    slots.add(slot);
    const key = `${slot}|${weekday}`;
    const set = cells.get(key) ?? new Set<string>();
    set.add(room);
    cells.set(key, set);
  }
  return [...slots].sort().map((slot) => ({
    slot,
    values: WEEK_ORDER.map((_, weekday) => {
      const used = cells.get(`${slot}|${weekday}`)?.size;
      return used === undefined || !activeRooms ? null : Math.min(1, used / activeRooms);
    }),
  }));
}

/** BE trả `averageScore` theo % (tổng điểm / điểm tối đa × 100); dashboard hiện thang 10. */
export const toTenScale = (percent: number | null | undefined) =>
  percent === null || percent === undefined ? null : percent / 10;

const scoreFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});
/** Điểm thang 10 dạng "8,0"; không có điểm thì "—". */
export const scoreText = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : scoreFormat.format(value);

/** Tháng `YYYY-MM` (giờ Việt Nam) của một thời điểm. */
export const vietnamMonth = (value: string) => vietnamDay(value).slice(0, 7);
