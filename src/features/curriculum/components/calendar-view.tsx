"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScheduleCalendar } from "@/components/shared/calendar/schedule-calendar";
import {
  todayInVietnam,
  isCalendarDate,
  calendarWeekStart,
  addCalendarDays,
} from "@/lib/calendar-date";
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { registrationApi } from "@/features/registration-flow/api";
import {
  isSubstituteSession,
  useTeacherNames,
} from "@/features/registration-flow/teacher-names";
import { curriculumApi } from "../api";
import { vietnamLocalInput } from "../session-contract";
import { SessionDetailSheet } from "./session-detail-sheet";
import { ScheduleBoard } from "./schedule-board";
import type { ScheduleBoardEvent } from "../schedule-board-data";

const CALENDAR_VIEWS = ["day", "week", "board"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/**
 * Lịch học dùng chung cho Quản lý, Nhân viên và Giáo viên. Mỗi trang chọn cách xem mặc định
 * (Quản lý và Nhân viên mặc định Kanban).
 */
export function AcademicCalendarView({
  defaultView = "week",
}: {
  defaultView?: CalendarView;
}) {
  const role = useCurrentRole();
  const user = useCurrentUser();
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
    parseAsStringLiteral(CALENDAR_VIEWS).withDefault(defaultView),
  );
  const [selected, setSelected] = useQueryState(
    "session",
    parseAsString.withDefault(""),
  );
  const [teacherId, setTeacherId] = useQueryState(
    "teacherId",
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
  // Danh sách buổi chỉ trả `teacherId`; Giáo viên chỉ thấy buổi của mình.
  const { names: teacherNames } = useTeacherNames(
    role === "center_manager" || role === "staff",
  );
  const classById = new Map((classes.data ?? []).map((c) => [c.id, c]));
  const events: ScheduleBoardEvent[] =
    sessions.data
      ?.filter(
        (session) =>
          role === "teacher" || !teacherId || session.teacherId === teacherId,
      )
      .map((session) => {
        const start = vietnamLocalInput(session.startsAt),
          end = vietnamLocalInput(session.endsAt);
        const classroom = classById.get(session.classId);
        return {
          id: session.id,
          title: session.lesson?.title ?? session.class.name,
          classLabel: session.class.name,
          subject: session.class.program.subject,
          date: start.slice(0, 10),
          time: `${start.slice(11)}–${end.slice(11)}`,
          startHour:
            Number(start.slice(11, 13)) + Number(start.slice(14, 16)) / 60,
          status: session.status,
          teacherName:
            session.teacher?.displayName ??
            teacherNames.get(session.teacherId) ??
            (role === "teacher" && session.teacherId === user?.id
              ? user.name
              : undefined),
          isSubstitute: classroom
            ? isSubstituteSession(session, classroom)
            : false,
        };
      }) ?? [];
  return (
    <PageContainer>
      <PageHeader
        title="Lịch học"
        description="Lịch buổi học thực tế và nội dung đã được duyệt. Giờ hiển thị theo giờ Việt Nam."
        actions={
          role === "center_manager" && (
            <Button
              variant="outline"
              render={
                <Link
                  href={
                    classId
                      ? `${ROUTES.MANAGER.SESSIONS}?${new URLSearchParams({ classId })}`
                      : ROUTES.MANAGER.SESSIONS
                  }
                />
              }
            >
              Sinh lịch theo khóa
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={classId || "all"}
          items={[
            { value: "all", label: "Tất cả lớp" },
            ...(classes.data ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
          onValueChange={(v) => void setClassId(v === "all" ? null : String(v))}
        >
          <SelectTrigger
            className="w-full sm:w-64"
            aria-label="Lọc lịch theo lớp"
          >
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
        {(role === "center_manager" || role === "staff") && (
          <Select
            value={teacherId || "all"}
            items={[
              { value: "all", label: "Tất cả giáo viên" },
              ...Array.from(teacherNames, ([value, label]) => ({
                value,
                label,
              })),
            ]}
            onValueChange={(value) =>
              void setTeacherId(value === "all" ? null : String(value))
            }
          >
            <SelectTrigger
              className="w-full sm:w-56"
              aria-label="Lọc lịch theo giáo viên"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giáo viên</SelectItem>
              {Array.from(teacherNames, ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Tabs
          value={view}
          onValueChange={(value) => {
            const next = CALENDAR_VIEWS.find((key) => key === value);
            if (next) void setView(next);
          }}
        >
          <TabsList aria-label="Cách xem lịch học">
            <TabsTrigger value="board">Kanban</TabsTrigger>
            <TabsTrigger value="week">Tuần</TabsTrigger>
            <TabsTrigger value="day">Ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
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
          {view === "board" ? (
            <ScheduleBoard
              events={events}
              date={day}
              onDateChange={(value) => void setDate(value)}
              onEventClick={(event) => void setSelected(event.id)}
            />
          ) : (
            <ScheduleCalendar
              events={events}
              date={day}
              onDateChange={(v) => void setDate(v)}
              view={view === "day" ? "day" : "week"}
              onViewChange={(v) => void setView(v)}
              groupBy="time"
              showGroupBy={false}
              showViewSwitcher={false}
              onEventClick={(event) => void setSelected(event.id)}
            />
          )}
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
