"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import {
  addCalendarDays,
  calendarDateLabel,
  calendarWeekStart,
  todayInVietnam,
} from "@/lib/calendar-date";
import { useCurrentTime } from "@/hooks/use-current-time";
import { sessionRange } from "@/features/curriculum/session-format";
import type { ScheduledSession } from "@/types/curriculum";
import { attendanceSessionStatus } from "../session-status";
import { LiveAttendanceSession } from "./live-attendance-view";

export function TeacherAttendanceWeek({
  sessions,
  date,
  onDateChange,
  selected,
  onSelect,
}: {
  sessions: ScheduledSession[];
  date: string;
  onDateChange: (date: string) => void;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const now = useCurrentTime();
  const today = todayInVietnam();
  const rows = [...sessions].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const active =
    selected ||
    rows.find(
      (row) => row.status === "SCHEDULED" && Date.parse(row.endsAt) <= now,
    )?.id ||
    rows.find((row) => row.status === "SCHEDULED")?.id ||
    rows[0]?.id;
  const week = calendarWeekStart(date);
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Tuần {calendarDateLabel(week)} –{" "}
          {calendarDateLabel(addCalendarDays(week, 6))}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addCalendarDays(date, -7))}
          >
            Tuần trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(today)}
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addCalendarDays(date, 7))}
          >
            Tuần sau
          </Button>
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3" aria-label="Buổi dạy trong tuần">
          {rows.map((session) => {
            const status = attendanceSessionStatus(session, now, today);
            return (
              <Button
                key={session.id}
                variant="outline"
                className={`h-auto w-full min-w-0 flex-col items-start gap-2 p-4 text-left whitespace-normal ${active === session.id ? "border-primary bg-primary/5" : ""}`}
                aria-pressed={active === session.id}
                onClick={() => onSelect(session.id)}
              >
                <span className="flex w-full flex-wrap justify-between gap-2">
                  <span className="text-xs">
                    {sessionRange(session.startsAt, session.endsAt)}
                  </span>
                  <Badge
                    variant={
                      status === "Chưa điểm danh"
                        ? "warning"
                        : status === "Đã chốt"
                          ? "success"
                          : "outline"
                    }
                  >
                    {status}
                  </Badge>
                </span>
                <span>{session.class.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session.lesson?.title ?? "Buổi học"}
                </span>
              </Button>
            );
          })}
          {!rows.length && (
            <EmptyState
              title="Tuần này chưa có buổi dạy"
              description="Chọn tuần khác để xem lịch được phân công."
            />
          )}
        </section>
        <section className="min-w-0" aria-label="Điểm danh buổi đã chọn">
          {active ? (
            <LiveAttendanceSession key={active} sessionId={active} embedded />
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  title="Chọn một buổi để điểm danh"
                  description="Chỉ chốt được khi buổi học đã kết thúc."
                />
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
