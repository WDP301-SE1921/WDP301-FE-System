"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionBlock, type SessionStatus } from "./session-block";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Location01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";
import {
  addCalendarDays,
  calendarDateLabel,
  calendarWeekStart,
  isCalendarDate,
  todayInVietnam,
  yesterdayInVietnam,
} from "@/lib/calendar-date";

export interface CalendarEvent {
  id: string;
  title: string;
  subject: string; // "MATH" | "PHYS" | "CHEM" | "BIOL"
  date: string; // YYYY-MM-DD
  time: string; // e.g. "18:00 - 19:30"
  startHour?: number; // e.g. 18
  room?: string;
  teacherName?: string;
  status?: SessionStatus;
  totalStudents?: number;
  attendedCount?: number;
  absentStudents?: Array<{ id: string; name: string; reason?: string }>;
}

export type CalendarViewMode = "day" | "week";
export type CalendarGroupBy = "time" | "room";

export interface ScheduleCalendarProps {
  events: CalendarEvent[];
  date?: string;
  onDateChange?: (date: string) => void;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  groupBy?: CalendarGroupBy;
  onGroupByChange?: (groupBy: CalendarGroupBy) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateSelect?: (dateStr: string) => void;
  className?: string;
  showGroupBy?: boolean;
  showViewSwitcher?: boolean;
}

const SAMPLE_ROOMS = ["P.101", "P.102", "P.201", "P.202", "P.301"];

/**
 * Schedule Calendar component for Managers and Teachers.
 * Supports View Mode ("day" | "week") and GroupBy Mode ("time" | "room").
 */
function ScheduleCalendar({
  events,
  date: controlledDate,
  onDateChange,
  view: controlledView,
  onViewChange,
  groupBy: controlledGroupBy,
  onGroupByChange,
  onEventClick,
  onDateSelect,
  className,
  showGroupBy = true,
  showViewSwitcher = true,
}: ScheduleCalendarProps) {
  const [internalView, setInternalView] =
    React.useState<CalendarViewMode>("week");
  const [internalGroupBy, setInternalGroupBy] =
    React.useState<CalendarGroupBy>("time");
  const [internalDate, setInternalDate] = React.useState(yesterdayInVietnam);

  const currentView = controlledView ?? internalView;
  const currentGroupBy = controlledGroupBy ?? internalGroupBy;
  const requestedDate = controlledDate ?? internalDate;
  const currentDate = isCalendarDate(requestedDate)
    ? requestedDate
    : yesterdayInVietnam();
  const today = todayInVietnam();
  const weekStart = calendarWeekStart(currentDate);
  const weekEnd = addCalendarDays(weekStart, 6);

  const handleDateChange = (date: string) => {
    setInternalDate(date);
    onDateChange?.(date);
  };

  const handleViewChange = (v: CalendarViewMode) => {
    setInternalView(v);
    onViewChange?.(v);
  };

  const handleGroupByChange = (g: CalendarGroupBy) => {
    setInternalGroupBy(g);
    onGroupByChange?.(g);
  };

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const dateStr = addCalendarDays(weekStart, index);
    return {
      dayName: index === 6 ? "Chủ nhật" : `Thứ ${index + 2}`,
      dateStr,
      displayDate: calendarDateLabel(dateStr, false),
      isToday: dateStr === today,
    };
  });

  const visibleEvents = events
    .filter((event) =>
      currentView === "day"
        ? event.date === currentDate
        : event.date >= weekStart && event.date <= weekEnd,
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );

  // Extract unique rooms from events or fallback to default room list
  const roomList = Array.from(
    new Set([
      ...visibleEvents
        .map((e) => e.room)
        .filter((r): r is string => Boolean(r)),
      ...SAMPLE_ROOMS,
    ]),
  );

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs",
        className,
      )}
    >
      {/* Calendar Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="size-5 text-primary"
            />
            {currentView === "day"
              ? `Lịch học ngày (${calendarDateLabel(currentDate)})`
              : `Lịch học tuần (${calendarDateLabel(weekStart)} – ${calendarDateLabel(weekEnd)})`}
          </h3>
          <Button
            variant="outline"
            size="xs"
            className="h-7 rounded-full text-xs"
            onClick={() => handleDateChange(today)}
          >
            Hôm nay
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label={currentView === "day" ? "Ngày trước" : "Tuần trước"}
              onClick={() =>
                handleDateChange(
                  addCalendarDays(currentDate, currentView === "day" ? -1 : -7),
                )
              }
              leftIcon={
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label={currentView === "day" ? "Ngày sau" : "Tuần sau"}
              onClick={() =>
                handleDateChange(
                  addCalendarDays(currentDate, currentView === "day" ? 1 : 7),
                )
              }
              leftIcon={
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              }
            />
          </div>

          {/* GroupBy Switcher (Thời gian | Phòng) */}
          {showGroupBy && (
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <span className="text-xs text-muted-foreground font-medium">
                Xem theo:
              </span>
              <Tabs
                value={currentGroupBy}
                onValueChange={(val) =>
                  handleGroupByChange(val as CalendarGroupBy)
                }
              >
                <TabsList className="h-8 p-0.5 rounded-full bg-muted/60">
                  <TabsTrigger
                    value="time"
                    className="h-7 rounded-full text-xs px-2.5 gap-1"
                  >
                    <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                    Thời gian
                  </TabsTrigger>
                  <TabsTrigger
                    value="room"
                    className="h-7 rounded-full text-xs px-2.5 gap-1"
                  >
                    <HugeiconsIcon icon={Location01Icon} className="size-3" />
                    Phòng
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* View Mode Switcher (Ngày | Tuần) */}
          {showViewSwitcher && (
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <Tabs
                value={currentView}
                onValueChange={(val) =>
                  handleViewChange(val as CalendarViewMode)
                }
              >
                <TabsList className="h-8 p-0.5 rounded-full">
                  <TabsTrigger
                    value="day"
                    className="h-7 rounded-full text-xs px-3"
                  >
                    Ngày
                  </TabsTrigger>
                  <TabsTrigger
                    value="week"
                    className="h-7 rounded-full text-xs px-3"
                  >
                    Tuần
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid View */}
      {currentGroupBy === "room" ? (
        /* ROOM GROUPING VIEW */
        <div className="min-w-0 overflow-x-auto overscroll-x-contain rounded-xl pb-2">
          <div className="grid grid-cols-1 md:min-w-[60rem] md:grid-cols-5 gap-3">
            {roomList.map((room) => {
              const roomEvents = visibleEvents.filter(
                (e) => e.room === room || (!e.room && room === "P.101"),
              );

              return (
                <div
                  key={room}
                  className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-muted/10 p-3 min-h-[220px]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 font-bold text-xs">
                    <span className="flex items-center gap-1.5 text-primary">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        className="size-3.5"
                      />
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
              );
            })}
          </div>
        </div>
      ) : currentView === "week" ? (
        /* WEEK BY TIME VIEW */
        <div className="min-w-0 overflow-x-auto overscroll-x-contain rounded-xl pb-2">
          <div className="grid grid-cols-1 md:min-w-[84rem] md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEvents = visibleEvents.filter(
                (e) => e.date === day.dateStr,
              );

              return (
                <div
                  key={day.dateStr}
                  className={cn(
                    "flex min-w-0 flex-col rounded-xl border p-2.5 min-h-[220px] transition-colors",
                    day.isToday
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 bg-muted/10 hover:bg-muted/30",
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Xem lịch ngày ${calendarDateLabel(day.dateStr)}`}
                    onClick={() => {
                      handleDateChange(day.dateStr);
                      handleViewChange("day");
                      onDateSelect?.(day.dateStr);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg pb-2 mb-2 border-b border-border/40 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      {day.dayName}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        day.isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {day.displayDate}
                    </span>
                  </button>

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
              );
            })}
          </div>
        </div>
      ) : (
        /* DAY BY TIME VIEW */
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Lịch dạy / học {currentDate === today ? "hôm nay " : ""}(
              {calendarDateLabel(currentDate)})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleEvents.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  Không có buổi học trong ngày này.
                </p>
              )}
              {visibleEvents.map((evt) => (
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
  );
}

export { ScheduleCalendar };
