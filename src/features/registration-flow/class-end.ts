// Không import calendar.ts: file đó nhập alias "@/", node --test không resolve được.
const dateOnly = (value: string) => value.slice(0, 10);
const todayInVietnam = (now = new Date()) =>
  new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
const isoWeekday = (value: string) => new Date(value + "T00:00:00Z").getUTCDay() || 7;
function addCalendarDays(date: string, days: number) {
  const value = new Date(date + "T00:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function addCalendarMonths(value: string, months: number) {
  const start = new Date(dateOnly(value) + "T00:00:00Z");
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}

/**
 * Lớp học xong giáo trình khi buổi cuối (không hủy) đã qua. `scheduledUntil` null/undefined
 * (chưa có buổi, hoặc BE cũ) thì không coi là đã xong.
 */
export function isCurriculumFinished(
  scheduledUntil: string | null | undefined,
  today = todayInVietnam(),
) {
  if (!scheduledUntil) return false;
  return dateOnly(scheduledUntil) < today;
}

/**
 * Số buổi còn lại tính theo lịch tuần, từ hôm nay tới buổi cuối (gồm cả hai ngày).
 * Chưa trừ ngày nghỉ/buổi hủy nên chỉ là số ước lượng. Thiếu ngày cuối thì trả null.
 */
export function sessionsLeft(
  scheduledUntil: string | null | undefined,
  schedules: ReadonlyArray<{ weekday: number }>,
  today = todayInVietnam(),
) {
  if (!scheduledUntil) return null;
  const until = dateOnly(scheduledUntil);
  let count = 0;
  for (let date = today; date <= until; date = addCalendarDays(date, 1)) {
    const weekday = isoWeekday(date);
    count += schedules.filter((slot) => slot.weekday === weekday).length;
  }
  return count;
}

/** Kỳ đăng ký (start + months, ngày cuối là hôm trước ngày kết thúc) dài hơn buổi cuối của lớp. */
export function termPassesEnd(
  startDate: string,
  months: number,
  scheduledUntil: string | null | undefined,
) {
  if (!scheduledUntil || !startDate || !Number.isInteger(months) || months < 1)
    return false;
  const lastDay = addCalendarDays(addCalendarMonths(startDate, months), -1);
  return lastDay > dateOnly(scheduledUntil);
}

/** "dd/mm/yyyy" của ngày kết thúc (kỳ đăng ký tối đa 12 tháng có thể sang năm sau). */
export function endFullDate(value: string) {
  const [year, month, day] = dateOnly(value).split("-");
  return `${day}/${month}/${year}`;
}

/** "dd/mm" của ngày kết thúc, vd. "Kết thúc 14/12". */
export function endDayMonth(value: string) {
  const [, month, day] = dateOnly(value).split("-");
  return `${day}/${month}`;
}

/**
 * Lời nhắc khi kỳ đăng ký vượt quá buổi cuối của lớp. Chỉ nhắc, không chặn, học phí không đổi (D3).
 * Ngày bắt đầu sau buổi cuối: một câu duy nhất, không hẹn "tạo thêm lịch" vì lớp đã dạy hết giáo trình.
 */
export function termEndWarning(
  scheduledUntil: string | null | undefined,
  startDate: string,
  months: number,
  schedules: ReadonlyArray<{ weekday: number }>,
) {
  if (!scheduledUntil || !startDate) return null;
  const until = dateOnly(scheduledUntil);
  if (dateOnly(startDate) > until)
    return `Lớp kết thúc ${endFullDate(until)}, trước ngày bắt đầu: con không có buổi học nào trong kỳ này. Vẫn đăng ký được; học phí không đổi.`;
  if (!termPassesEnd(startDate, months, until)) return null;
  const left = sessionsLeft(until, schedules, dateOnly(startDate));
  return `Lớp kết thúc ${endFullDate(until)}${left ? ` (còn khoảng ${left} buổi)` : ""}, trước khi hết kỳ đăng ký. Vẫn đăng ký được; con chỉ học tới hết giáo trình, học phí không đổi.`;
}
