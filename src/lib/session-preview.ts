/** Hàm thuần dựng phần xem trước (buổi bị ảnh hưởng, ngày đi học lại) theo giờ Việt Nam. */
const dateOnly = (value: string) => value.slice(0, 10);
const displayDate = (value: string) => dateOnly(value).split("-").reverse().join("/");

/** Ngày học theo giờ Việt Nam (YYYY-MM-DD) của một mốc ISO. */
export function vietnamDay(iso: string) {
  return new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10);
}

/** "Thứ 2, 16/11" — thứ theo giờ Việt Nam. */
export function dayLabel(iso: string) {
  const day = vietnamDay(iso);
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  const [, month, date] = day.split("-");
  return `${weekday === 0 ? "CN" : `Thứ ${weekday + 1}`}, ${date}/${month}`;
}

/** "16:00–18:00" theo giờ Việt Nam. */
export function timeRange(startsAt: string, endsAt: string) {
  const time = (iso: string) =>
    new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(11, 16);
  return `${time(startsAt)}–${time(endsAt)}`;
}

export function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

interface DatedSession {
  startsAt: string;
  status: string;
}

/** Buổi đang lên lịch có ngày (giờ VN) nằm trong [from, to]. Chỉ để xem trước, không quyết định gửi. */
export function scheduledBetween<T extends DatedSession>(
  sessions: T[],
  from: string,
  to: string,
) {
  return sessions
    .filter((session) => session.status === "SCHEDULED")
    .filter((session) => {
      const day = vietnamDay(session.startsAt);
      return day >= from && day <= to;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Buổi đang lên lịch đầu tiên sau ngày `day` (giờ VN). */
export function firstScheduledAfter<T extends DatedSession>(
  sessions: T[],
  day: string,
) {
  return sessions
    .filter(
      (session) =>
        session.status === "SCHEDULED" && vietnamDay(session.startsAt) > day,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
}

export function rangeText(from: string, to: string) {
  return `${displayDate(from)} đến ${displayDate(to)}`;
}

export function termText(start: string | null, end: string | null) {
  if (!start || !end) return "Chưa có kỳ học";
  return `${displayDate(dateOnly(start))} đến ${displayDate(dateOnly(end))}`;
}
