/** Ngày theo múi giờ Việt Nam (UTC+7), ở dạng YYYY-MM-DD. */
export function todayInVietnam(now = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Ngày lịch người dùng chọn (giờ máy), dạng YYYY-MM-DD; không đổi qua UTC để khỏi lùi ngày. */
export function localIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function yesterdayInVietnam(now = new Date()): string {
  return addCalendarDays(todayInVietnam(now), -1)
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function calendarWeekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return addCalendarDays(date, -((weekday + 6) % 7))
}

export function calendarDateLabel(date: string, includeYear = true): string {
  const [year, month, day] = date.split("-")
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`
}
