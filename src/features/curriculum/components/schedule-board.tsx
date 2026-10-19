"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { STATUS_MAP } from "@/constants/status";
import { subjectDotClass } from "@/constants/subjects";
import {
  addCalendarDays,
  calendarDateLabel,
  todayInVietnam,
} from "@/lib/calendar-date";
import {
  scheduleBoardDays,
  type ScheduleBoardEvent,
} from "../schedule-board-data";

export interface ScheduleBoardProps {
  events: ScheduleBoardEvent[];
  date: string;
  onDateChange: (date: string) => void;
  onEventClick: (event: ScheduleBoardEvent) => void;
}

export function ScheduleBoard({
  events,
  date,
  onDateChange,
  onEventClick,
}: ScheduleBoardProps) {
  const today = todayInVietnam();
  const days = scheduleBoardDays(events, date);
  const weekStart = days[0].date;
  const weekEnd = days[6].date;
  const visibleEvents = days.flatMap((day) => day.events);
  const cancelledCount = visibleEvents.filter(
    (event) => event.status === "CANCELLED",
  ).length;
  const substituteCount = visibleEvents.filter(
    (event) => event.isSubstitute,
  ).length;

  return (
    <Card className="min-w-0 gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="size-5 text-primary"
            />
            Lịch tuần {calendarDateLabel(weekStart, false)} –{" "}
            {calendarDateLabel(weekEnd)}
          </h2>
          <p className="text-xs text-muted-foreground">
            Chọn buổi học để xem nội dung và thao tác được phép.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(today)}
          >
            Hôm nay
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tuần trước"
            onClick={() => onDateChange(addCalendarDays(date, -7))}
            leftIcon={<HugeiconsIcon icon={ArrowLeft01Icon} />}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tuần sau"
            onClick={() => onDateChange(addCalendarDays(date, 7))}
            leftIcon={<HugeiconsIcon icon={ArrowRight01Icon} />}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">
          {visibleEvents.length} buổi trong tuần
        </Badge>
        <Badge variant={cancelledCount ? "danger" : "outline"}>
          {cancelledCount} đã hủy
        </Badge>
        <Badge variant={substituteCount ? "warning" : "outline"}>
          {substituteCount} dạy thay
        </Badge>
        <span className="ml-auto text-muted-foreground">
          Giờ Việt Nam (UTC+7)
        </span>
      </div>

      {!visibleEvents.length ? (
        <EmptyState
          title="Tuần này chưa có buổi học"
          description="Chọn tuần khác hoặc đổi bộ lọc lớp để xem lịch học."
        />
      ) : (
        <div
          className="min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          role="region"
          aria-label="Bảng Kanban lịch học theo bảy ngày trong tuần"
        >
          <div className="grid min-w-252 grid-cols-7 gap-3">
            {days.map((day) => (
              <section
                key={day.date}
                aria-label={`${day.title} ${calendarDateLabel(day.date)}, ${day.events.length} buổi`}
                className={cn(
                  "flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-2.5",
                  day.date === today && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-1 border-b border-border pb-2">
                  <div>
                    <h3 className="text-sm font-semibold">{day.title}</h3>
                    <p
                      className={cn(
                        "mt-1 text-xs text-muted-foreground",
                        day.date === today && "font-semibold text-primary",
                      )}
                    >
                      {calendarDateLabel(day.date, false)}
                      {day.date === today && " · Hôm nay"}
                    </p>
                  </div>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    {day.events.length}
                  </Badge>
                </div>

                {day.events.length ? (
                  <ul className="space-y-2">
                    {day.events.map((event) => (
                      <li key={event.id}>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-auto w-full min-w-0 flex-col items-start gap-1.5 rounded-xl bg-card p-2.5 text-left whitespace-normal shadow-xs",
                            event.status === "CANCELLED" && "opacity-70",
                            event.isSubstitute && "border-amber-300",
                          )}
                          onClick={() => onEventClick(event)}
                          aria-label={`${event.classLabel}, ${event.title}, ${calendarDateLabel(event.date)}, ${event.time}, ${event.teacherName ?? "chưa rõ giáo viên"}, ${STATUS_MAP.session[event.status.toLowerCase()]?.label ?? event.status}${event.isSubstitute ? ", dạy thay" : ""}. Xem chi tiết buổi học`}
                        >
                          <span className="flex items-center gap-1 text-xs font-semibold text-primary tabular-nums">
                            <HugeiconsIcon
                              icon={Clock01Icon}
                              className="size-3"
                            />
                            {event.time}
                          </span>
                          <span
                            className={cn(
                              "flex w-full min-w-0 items-start gap-1.5 text-sm font-semibold",
                              event.status === "CANCELLED" && "line-through",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mt-1.5 size-2 shrink-0 rounded-full",
                                subjectDotClass(event.subject),
                              )}
                            />
                            <span className="line-clamp-2 min-w-0 wrap-anywhere">
                              {event.classLabel}
                            </span>
                          </span>
                          <span className="line-clamp-2 w-full wrap-anywhere text-xs font-normal text-muted-foreground">
                            {event.title}
                          </span>
                          {event.teacherName && (
                            <span className="flex w-full min-w-0 items-center gap-1 text-xs font-normal">
                              <HugeiconsIcon
                                icon={UserIcon}
                                className="size-3 shrink-0 text-muted-foreground"
                              />
                              <span className="truncate">
                                {event.teacherName}
                              </span>
                            </span>
                          )}
                          {(event.isSubstitute ||
                            event.status !== "SCHEDULED") && (
                            <span className="flex flex-wrap gap-1">
                              {event.isSubstitute && (
                                <Badge
                                  variant="warning"
                                  className="h-auto px-1.5 py-0.5 text-[10px]"
                                >
                                  Dạy thay
                                </Badge>
                              )}
                              {event.status !== "SCHEDULED" && (
                                <StatusBadge
                                  category="session"
                                  status={event.status.toLowerCase()}
                                  className="h-auto max-w-full px-1.5 py-0.5 text-[10px] whitespace-normal"
                                />
                              )}
                            </span>
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Không có buổi học
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
