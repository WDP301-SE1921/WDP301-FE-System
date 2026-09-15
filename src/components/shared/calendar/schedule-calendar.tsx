"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionBlock, type SessionStatus } from "./session-block"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar01Icon, Location01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

export interface CalendarEvent {
  id: string
  title: string
  subject: string // "MATH" | "PHYS" | "CHEM" | "BIOL"
  date: string // YYYY-MM-DD
  time: string // e.g. "18:00 - 19:30"
  startHour?: number // e.g. 18
  room?: string
  teacherName?: string
  status?: SessionStatus
  totalStudents?: number
  attendedCount?: number
  absentStudents?: Array<{ id: string; name: string; reason?: string }>
}

export type CalendarViewMode = "day" | "week"
export type CalendarGroupBy = "time" | "room"

export interface ScheduleCalendarProps {
  events: CalendarEvent[]
  view?: CalendarViewMode
  onViewChange?: (view: CalendarViewMode) => void
  groupBy?: CalendarGroupBy
  onGroupByChange?: (groupBy: CalendarGroupBy) => void
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (dateStr: string) => void
  className?: string
}

const SAMPLE_ROOMS = ["P.101", "P.102", "P.201", "P.202", "P.301"]

/**
 * Schedule Calendar component for Managers and Teachers.
 * Supports View Mode ("day" | "week") and GroupBy Mode ("time" | "room").
 */
function ScheduleCalendar({
  events,
  view: controlledView,
  onViewChange,
  groupBy: controlledGroupBy,
  onGroupByChange,
  onEventClick,
  onDateSelect,
  className,
}: ScheduleCalendarProps) {
  const [internalView, setInternalView] = React.useState<CalendarViewMode>("week")
  const [internalGroupBy, setInternalGroupBy] = React.useState<CalendarGroupBy>("time")

  const currentView = controlledView ?? internalView
  const currentGroupBy = controlledGroupBy ?? internalGroupBy

  const handleViewChange = (v: CalendarViewMode) => {
    setInternalView(v)
    onViewChange?.(v)
  }

  const handleGroupByChange = (g: CalendarGroupBy) => {
    setInternalGroupBy(g)
    onGroupByChange?.(g)
  }

  // Sample week days (Monday to Sunday)
  const sampleWeekDays = React.useMemo(() => {
    return [
      { dayName: "Thứ 2", dateStr: "2026-09-15", displayDate: "15/09", isToday: true },
      { dayName: "Thứ 3", dateStr: "2026-09-16", displayDate: "16/09", isToday: false },
      { dayName: "Thứ 4", dateStr: "2026-09-17", displayDate: "17/09", isToday: false },
      { dayName: "Thứ 5", dateStr: "2026-09-18", displayDate: "18/09", isToday: false },
      { dayName: "Thứ 6", dateStr: "2026-09-19", displayDate: "19/09", isToday: false },
      { dayName: "Thứ 7", dateStr: "2026-09-20", displayDate: "20/09", isToday: false },
      { dayName: "Chủ nhật", dateStr: "2026-09-21", displayDate: "21/09", isToday: false },
    ]
  }, [])

  // Extract unique rooms from events or fallback to default room list
  const roomList = React.useMemo(() => {
    const set = new Set(events.map((e) => e.room).filter((r): r is string => Boolean(r)))
    SAMPLE_ROOMS.forEach((r) => set.add(r))
    return Array.from(set)
  }, [events])

  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs", className)}>
      {/* Calendar Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} className="size-5 text-primary" />
            {currentView === "day" ? "Lịch học ngày (15/09/2026)" : "Lịch học tuần (15/09 – 21/09/2026)"}
          </h3>
          <Button variant="outline" size="xs" className="h-7 rounded-full text-xs">
            Hôm nay
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </div>

          {/* GroupBy Switcher (Thời gian | Phòng) */}
          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <span className="text-xs text-muted-foreground font-medium">Xem theo:</span>
            <Tabs
              value={currentGroupBy}
              onValueChange={(val) => handleGroupByChange(val as CalendarGroupBy)}
            >
              <TabsList className="h-8 p-0.5 rounded-full bg-muted/60">
                <TabsTrigger value="time" className="h-7 rounded-full text-xs px-2.5 gap-1">
                  <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                  Thời gian
                </TabsTrigger>
                <TabsTrigger value="room" className="h-7 rounded-full text-xs px-2.5 gap-1">
                  <HugeiconsIcon icon={Location01Icon} className="size-3" />
                  Phòng
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* View Mode Switcher (Ngày | Tuần) */}
          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <Tabs
              value={currentView}
              onValueChange={(val) => handleViewChange(val as CalendarViewMode)}
            >
              <TabsList className="h-8 p-0.5 rounded-full">
                <TabsTrigger value="day" className="h-7 rounded-full text-xs px-3">
                  Ngày
                </TabsTrigger>
                <TabsTrigger value="week" className="h-7 rounded-full text-xs px-3">
                  Tuần
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      {currentGroupBy === "room" ? (
        /* ROOM GROUPING VIEW */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {roomList.map((room) => {
            const roomEvents = events.filter((e) => e.room === room || (!e.room && room === "P.101"))

            return (
              <div
                key={room}
                className="flex flex-col rounded-xl border border-border/60 bg-muted/10 p-3 min-h-[220px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 font-bold text-xs">
                  <span className="flex items-center gap-1.5 text-primary">
                    <HugeiconsIcon icon={Location01Icon} className="size-3.5" />
                    {room}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {roomEvents.length} ca
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {roomEvents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
                      Không có ca
                    </div>
                  ) : (
                    roomEvents.map((evt) => (
                      <SessionBlock
                        key={evt.id}
                        {...evt}
                        onClick={() => onEventClick?.(evt)}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : currentView === "week" ? (
        /* WEEK BY TIME VIEW */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {sampleWeekDays.map((day) => {
            const dayEvents = events.filter((e) => e.date === day.dateStr)

            return (
              <div
                key={day.dateStr}
                onClick={() => onDateSelect?.(day.dateStr)}
                className={cn(
                  "flex flex-col rounded-xl border p-2.5 min-h-[220px] transition-colors cursor-pointer",
                  day.isToday
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/60 bg-muted/10 hover:bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {day.dayName}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      day.isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {day.displayDate}
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {dayEvents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground/60 italic">
                      Trống
                    </div>
                  ) : (
                    dayEvents.map((evt) => (
                      <SessionBlock
                        key={evt.id}
                        {...evt}
                        onClick={() => onEventClick?.(evt)}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* DAY BY TIME VIEW */
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Lịch dạy / học Hôm nay (15/09/2026)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map((evt) => (
                <SessionBlock
                  key={evt.id}
                  {...evt}
                  onClick={() => onEventClick?.(evt)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { ScheduleCalendar }
