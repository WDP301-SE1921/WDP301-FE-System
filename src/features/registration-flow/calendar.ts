import type { WeeklySchedule } from "@/types/backend";

export function todayInVietnam(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}
export function dateOnly(value: string) {
  return value.slice(0, 10);
}
export function isoWeekday(value: string) {
  return new Date(`${dateOnly(value)}T00:00:00Z`).getUTCDay() || 7;
}
export function addCalendarMonths(value: string, months: number) {
  const start = new Date(`${dateOnly(value)}T00:00:00Z`);
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1),
  );
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}
export function nextStudyDate(
  schedules: WeeklySchedule[],
  today = todayInVietnam(),
) {
  if (!schedules.length) return "";
  const start = new Date(`${today}T00:00:00Z`);
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(start.getTime() + offset * 86400000)
      .toISOString()
      .slice(0, 10);
    if (schedules.some((slot) => slot.weekday === isoWeekday(date)))
      return date;
  }
  return "";
}
export function scheduleText(schedules: WeeklySchedule[]) {
  return [...schedules]
    .sort(
      (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
    )
    .map(
      (slot) =>
        `${slot.weekday === 7 ? "CN" : `Thứ ${slot.weekday + 1}`} ${slot.startTime}–${slot.endTime}`,
    )
    .join(" · ");
}
export function termLabel(
  startDate: string,
  endDate: string,
  today = todayInVietnam(),
) {
  if (dateOnly(endDate) <= today) return "Hết hạn";
  return dateOnly(startDate) > today ? "Sắp học" : "Đang học";
}
export function displayDate(value: string) {
  const [year, month, day] = dateOnly(value).split("-");
  return `${day}/${month}/${year}`;
}
export function money(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
