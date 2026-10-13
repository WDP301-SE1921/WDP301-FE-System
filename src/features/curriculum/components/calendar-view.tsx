"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  ScheduleCalendar,
  type CalendarEvent,
} from "@/components/shared/calendar/schedule-calendar";
import {
  todayInVietnam,
  isCalendarDate,
  calendarWeekStart,
  addCalendarDays,
} from "@/lib/calendar-date";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { registrationApi } from "@/features/registration-flow/api";
import { curriculumApi } from "../api";
import { vietnamLocalInput } from "../session-contract";
import { SessionDetailSheet } from "./session-detail-sheet";
export function AcademicCalendarView() {
  const role = useCurrentRole();
  const [classId, setClassId] = useQueryState(
    "classId",
    parseAsString.withDefault(""),
  );
  const [date, setDate] = useQueryState(
    "date",
    parseAsString.withDefault(todayInVietnam()),
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("week"),
  );
  const [selected, setSelected] = useQueryState(
    "session",
    parseAsString.withDefault(""),
  );
  const day = isCalendarDate(date) ? date : todayInVietnam();
  const fromDate = view === "day" ? day : calendarWeekStart(day),
    toDate = view === "day" ? day : addCalendarDays(fromDate, 6);
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const sessions = useQuery({
    queryKey: ["academic-calendar", classId, fromDate, toDate],
    queryFn: ({ signal }) =>
      curriculumApi.sessions(classId, signal, { fromDate, toDate }),
    retry: false,
  });
  const events: CalendarEvent[] =
    sessions.data?.map((session) => {
      const start = vietnamLocalInput(session.startsAt),
        end = vietnamLocalInput(session.endsAt);
      return {
        id: session.id,
        title: session.lesson?.title ?? session.class.name,
        subject: session.class.program.subject,
        date: start.slice(0, 10),
        time: start.slice(11) + " → " + end.slice(11),
        startHour:
          Number(start.slice(11, 13)) + Number(start.slice(14, 16)) / 60,
        status: session.status,
        teacherName: session.teacher?.displayName ?? undefined,
      };
    }) ?? [];
  return (
    <PageContainer>
      <PageHeader
        title="Thời khóa biểu"
        description="Lịch buổi học thực tế và nội dung đã được duyệt. Giờ hiển thị theo giờ Việt Nam."
        actions={
          role === "center_manager" && (
            <Button
              variant="outline"
              render={
                <Link
                  href={
                    classId
                      ? ROUTES.MANAGER.CLASS_SESSIONS(classId)
                      : ROUTES.MANAGER.SESSIONS
                  }
                />
              }
            >
              Xem trước và sinh lịch
            </Button>
          )
        }
      />
      <Select
        value={classId || "all"}
        items={[
          { value: "all", label: "Tất cả lớp" },
          ...(classes.data ?? []).map((c) => ({ value: c.id, label: c.name })),
        ]}
        onValueChange={(v) => void setClassId(v === "all" ? null : String(v))}
      >
        <SelectTrigger aria-label="Lọc lịch theo lớp">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả lớp</SelectItem>
          {classes.data?.map((c) => (
            <SelectItem value={c.id} key={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AsyncBoundary
        isLoading={classes.isPending}
        isError={classes.isError}
        error={classes.error}
        onRetry={() => void classes.refetch()}
      >
        <AsyncBoundary
          isLoading={sessions.isPending}
          isError={sessions.isError}
          error={sessions.error}
          onRetry={() => void sessions.refetch()}
        >
          <ScheduleCalendar
            events={events}
            date={day}
            onDateChange={(v) => void setDate(v)}
            view={view === "day" ? "day" : "week"}
            onViewChange={(v) => void setView(v)}
            groupBy="time"
            showGroupBy={false}
            onEventClick={(event) => void setSelected(event.id)}
          />
        </AsyncBoundary>
      </AsyncBoundary>
      {selected && (
        <SessionDetailSheet
          key={selected}
          id={selected}
          onClose={() => void setSelected(null)}
        />
      )}
    </PageContainer>
  );
}
