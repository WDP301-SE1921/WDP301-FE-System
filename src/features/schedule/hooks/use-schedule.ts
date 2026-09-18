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

export interface ScheduleData {
  events: CalendarEvent[]
  summary: ScheduleSummary
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useSchedule(filters: ScheduleFilters) {
  return useQuery<ScheduleData>({
    queryKey: ["schedule", filters],
    queryFn: () =>
      mockQuery(() => {
        const events = getCalendarEvents(filters)
        return { events, summary: getScheduleSummary(events) }
      }),
  })
}
