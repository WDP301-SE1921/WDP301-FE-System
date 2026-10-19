export function sessionTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

const sessionDayFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const sessionClockFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "Thứ Hai, 19/10/2026 · 18:30–20:00" theo giờ Việt Nam. */
export function sessionRange(startsAt: string, endsAt: string) {
  return `${sessionDayFormat.format(new Date(startsAt))} · ${sessionClockFormat.format(new Date(startsAt))}–${sessionClockFormat.format(new Date(endsAt))}`;
}
