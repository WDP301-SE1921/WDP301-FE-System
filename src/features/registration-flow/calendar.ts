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
/** Mỗi buổi trong tuần một dòng, vd. "Thứ 7 14:00–16:00" — dùng khi cần xếp dọc (bảng lớp). */
export function scheduleLines(schedules: WeeklySchedule[]) {
  return [...schedules]
    .sort(
      (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
    )
    .map(
      (slot) =>
        `${slot.weekday === 7 ? "CN" : `Thứ ${slot.weekday + 1}`} ${slot.startTime}–${slot.endTime}`,
    );
}
export function scheduleText(schedules: WeeklySchedule[]) {
  return scheduleLines(schedules).join(" · ");
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
/**
 * Nhắc Nhân viên khi lớp chưa có buổi học cho kỳ đăng ký: phụ huynh chỉ thấy lịch trên ứng dụng sau
 * khi Quản lý bấm "Tạo lịch học". Không chặn đăng ký. `scheduledUntil` thiếu (BE cũ) thì không nhắc.
 */
export function unscheduledTermNotice(
  scheduledUntil: string | null | undefined,
  startDate: string,
) {
  if (scheduledUntil === undefined) return null;
  if (scheduledUntil === null)
    return "Lớp chưa có buổi học nào. Vẫn đăng ký được, nhưng phụ huynh chỉ thấy lịch học trên ứng dụng sau khi Quản lý tạo lịch học cho lớp.";
  if (startDate && dateOnly(scheduledUntil) < dateOnly(startDate))
    return `Lớp mới có buổi học tới ${displayDate(scheduledUntil)}, trước ngày bắt đầu. Vẫn đăng ký được, nhưng phụ huynh chỉ thấy lịch học trên ứng dụng sau khi Quản lý tạo thêm lịch học.`;
  return null;
}
export function money(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
