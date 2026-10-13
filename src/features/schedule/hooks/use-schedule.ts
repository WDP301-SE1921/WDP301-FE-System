"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getCalendarEvents,
  getScheduleSummary,
  type ScheduleFilters,
  type ScheduleSummary,
} from "@/features/schedule/selectors"
import type { CalendarEvent } from "@/components/shared/calendar/schedule-calendar"
import { yesterdayInVietnam } from "@/lib/calendar-date"

export interface ScheduleData {
  events: CalendarEvent[]
  summary: ScheduleSummary
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useSchedule(
  filters: ScheduleFilters,
  date = yesterdayInVietnam(),
) {
  return useQuery<ScheduleData>({
    queryKey: ["schedule", filters, date],
    queryFn: () =>
      mockQuery(() => {
        const events = getCalendarEvents(filters)
        return { events, summary: getScheduleSummary(events, date) }
      }),
  })
}
