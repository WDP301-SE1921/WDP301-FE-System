import type { CalendarEvent } from "@/components/shared/calendar/schedule-calendar";
import type { ScheduledSession } from "@/types/curriculum";
import { addCalendarDays, calendarWeekStart } from "@/lib/calendar-date";

export interface ScheduleBoardEvent extends Omit<CalendarEvent, "status"> {
  classLabel: string;
  status: ScheduledSession["status"];
  /** Buổi chưa diễn ra do giáo viên khác giáo viên phân công của lớp dạy. */
  isSubstitute?: boolean;
}

/** Week columns use Vietnam calendar dates supplied by the API adapter. */
export function scheduleBoardDays(events: ScheduleBoardEvent[], date: string) {
  const weekStart = calendarWeekStart(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = addCalendarDays(weekStart, index);
    const dayEvents = events
      .filter((event) => event.date === day)
      .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
    return {
      date: day,
      title: index === 6 ? "Chủ nhật" : `Thứ ${index + 2}`,
      events: dayEvents,
    };
  });
}
