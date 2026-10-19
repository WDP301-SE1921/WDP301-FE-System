"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Invoice01Icon,
  StarIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { RowActions } from "@/components/shared/data-table/row-actions";
import { ApiForm } from "@/components/shared/forms/api-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/hooks/use-current-role";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, currentEnrollmentClass } from "@/features/academic/api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { TEST_TYPE_TEXT } from "@/features/assignments/assessment-labels";
import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import {
  displayDate,
  money,
  scheduleText,
} from "@/features/registration-flow/calendar";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import { studentUpdateSchema } from "@/lib/validators/web-workflows";
import type {
  ClassAttendanceSummary,
  StudentGradeRecord,
} from "@/types/academic-workflows";
import { directoryApi } from "../api";

const TABS = {
  overview: "Tổng quan",
  schedule: "Lịch học",
  grades: "Điểm & bài tập",
  tuition: "Học phí",
  absences: "Nghỉ & học bù",
} as const;
type Tab = keyof typeof TABS;
const TAB_KEYS = Object.keys(TABS) as Tab[];
const UPCOMING_DAYS = 14;

type AttendanceStatus = ClassAttendanceSummary["history"][number]["effectiveStatus"];
const CELL: Record<AttendanceStatus | "UPCOMING", { label: string; className: string }> = {
  PRESENT: { label: "Có mặt", className: "bg-emerald-500" },
  ABSENT: { label: "Vắng", className: "bg-red-500" },
  EXCUSED: { label: "Có phép", className: "bg-amber-400" },
  MADE_UP: { label: "Học bù", className: "bg-sky-500" },
  UPCOMING: { label: "Sắp tới", className: "border border-border bg-muted" },
};
const day = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const scoreFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const GRADE_OPTIONS = [6, 7, 8, 9].map((grade) => ({
  value: String(grade),
  label: `Khối ${grade}`,
}));
const STAT_COLUMNS = ["", "xl:grid-cols-1", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4"];

type GradedRecord = StudentGradeRecord & {
  grade: NonNullable<StudentGradeRecord["grade"]>;
};
function assignmentKind(row: StudentGradeRecord) {
  return row.kind === "TEST"
    ? row.testType
      ? TEST_TYPE_TEXT[row.testType]
      : "Bài kiểm tra"
    : "Bài tập";
}
function scoreText(row: GradedRecord) {
  return `${scoreFormat.format(row.grade.totalScore)}/${scoreFormat.format(row.maxScore)}`;
}

/**
 * Chi tiết học sinh (Quản lý, Nhân viên). Chuyên cần từ `attendance-summary` từng lớp (BE-8),
 * điểm từ `academic/students/:id/grades`; API nào lỗi thì ẩn khối của API đó. Sửa hồ sơ gọi
 * `PATCH students/:id`, BE khóa đổi khối khi còn ghi danh hiện tại hoặc sắp học.
 */
export function LiveStudentDetailView({ id }: { id: string }) {
  const user = useCurrentUser();
  const router = useRouter();
  const isStaff = user?.role === "staff";
  const today = todayInVietnam();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_KEYS).withDefault("overview"),
  );
  const data = useLiveQuery(["student-detail", id], async (signal) => {
    const [student, enrollments, schedule] = await Promise.all([
      directoryApi.student(id, signal),
      directoryApi.studentEnrollments(id, signal),
      directoryApi.studentSchedule(id, signal),
    ]);
    return { student, enrollments, schedule };
  });
  const active = (data.data?.enrollments ?? []).filter(
    (item) => item.status === "ACTIVE",
  );
  // Gia hạn theo tháng tạo nhiều ghi danh cùng lớp: gộp theo lớp hiện tại, bỏ kỳ đã hết hạn.
  const studying = [
    ...active
      .filter((item) => !item.endDate || item.endDate.slice(0, 10) > today)
      .reduce((groups, item) => {
        const classId = currentEnrollmentClass(item);
        const group = groups.get(classId) ?? [];
        groups.set(classId, [...group, item]);
        return groups;
      }, new Map<string, typeof active>())
      .values(),
  ].map((items) => {
    const sorted = [...items].sort((a, b) =>
      (a.startDate ?? "").localeCompare(b.startDate ?? ""),
    );
    const first = sorted[0];
    const currentId = currentEnrollmentClass(first);
    return {
      id: first.id,
      classroom:
        first.placements.find((placement) => placement.classId === currentId)
          ?.class ?? first.class,
      startDate: first.startDate?.slice(0, 10),
      endDate: sorted.at(-1)?.endDate?.slice(0, 10),
    };
  });
  const classIds = [
    ...new Set(
      (data.data?.enrollments ?? []).flatMap((item) => [
        currentEnrollmentClass(item),
        ...item.placements.map((placement) => placement.classId),
      ]),
    ),
  ];
  const attendance = useLiveQuery(
    ["student-attendance", id, classIds],
    async (signal) =>
      Promise.all(
        classIds.map(async (classId) => ({
          classId,
          summary: await academicApi.classAttendance(classId, id, signal),
        })),
      ),
    !!data.data && classIds.length > 0,
  );
  const upcoming = useLiveQuery(
    ["student-upcoming", id, today],
    (signal) =>
      academicApi.sessions(
        {
          studentId: id,
          fromDate: today,
          toDate: addCalendarDays(today, UPCOMING_DAYS - 1),
        },
        signal,
      ),
    !!data.data,
  );
  const makeups = useLiveQuery(
    ["student-makeup-sources", id],
    (signal) => academicApi.recordedMakeupSources(id, signal),
    isStaff,
  );
  const grades = useLiveQuery(
    ["student-grades", id],
    (signal) => academicApi.studentGrades(id, signal),
    !!data.data,
  );

  const student = data.data?.student;
  const totals = (attendance.data ?? []).reduce(
    (sum, { summary }) => ({
      present: sum.present + summary.counts.present,
      absent: sum.absent + summary.counts.absent,
      excused: sum.excused + summary.counts.excused,
      madeUp: sum.madeUp + summary.counts.madeUp,
      required: sum.required + summary.counts.required,
      attended: sum.attended + summary.counts.attended,
    }),
    { present: 0, absent: 0, excused: 0, madeUp: 0, required: 0, attended: 0 },
  );
  const history = (attendance.data ?? [])
    .flatMap(({ summary }) => summary.history)
    .sort((a, b) => b.session.startsAt.localeCompare(a.session.startsAt));
  const className = new Map(
    (data.data?.enrollments ?? []).flatMap((item) => [
      [item.class.id, item.class.name] as const,
      ...item.placements.flatMap((placement) =>
        placement.class ? [[placement.classId, placement.class.name] as const] : [],
      ),
    ]),
  );
  const payments = (data.data?.enrollments ?? []).flatMap((item) =>
    item.registrationOrder?.payment
      ? [{ enrollment: item, payment: item.registrationOrder.payment }]
      : [],
  );
  const paid = payments.reduce((sum, row) => sum + Number(row.payment.amount), 0);
  const paidUntil = active
    .map((item) => item.endDate?.slice(0, 10))
    .filter((value): value is string => !!value)
    .sort()
    .at(-1);
  const attendanceReady = attendance.isSuccess;
  const graded = (grades.data ?? []).filter(
    (row): row is GradedRecord => !!row.grade && row.maxScore > 0,
  );
  const average = graded.length
    ? graded.reduce(
        (sum, row) => sum + (row.grade.totalScore / row.maxScore) * 10,
        0,
      ) / graded.length
    : null;
  const recentGrades = [...graded]
    .sort((a, b) =>
      (b.grade.publishedAt ?? b.dueAt).localeCompare(
        a.grade.publishedAt ?? a.dueAt,
      ),
    )
    .slice(0, 5);
  const statCount = (attendanceReady ? 2 : 0) + (grades.isSuccess ? 1 : 0) + 1;
  // Mốc "đã quá hạn" lấy lúc dữ liệu điểm về.
  const gradesAt = grades.dataUpdatedAt;
  // Giống BE: đổi khối bị khóa khi còn ghi danh đang học hoặc sắp học.
  const gradeLocked = active.some(
    (item) => !item.endDate || item.endDate.slice(0, 10) > today,
  );

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title={student?.fullName ?? "Hồ sơ học sinh"}
        breadcrumbs={[
          {
            label: "Học sinh & phụ huynh",
            href: isStaff ? ROUTES.STAFF.STUDENTS : ROUTES.MANAGER.STUDENTS,
          },
          { label: student?.fullName ?? "Hồ sơ học sinh" },
        ]}
        description={
          student
            ? [
                `Khối ${student.grade}`,
                student.dateOfBirth ? `Sinh ${displayDate(student.dateOfBirth)}` : null,
                `Phụ huynh ${student.parentProfile.user.displayName || student.parentProfile.user.email}`,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        actions={
          student && (
            <div className="flex flex-wrap items-center gap-2">
              {isStaff && student.status === "ACTIVE" && (
                <Button
                  render={
                    <Link
                      href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                        studentId: id,
                        email: student.parentProfile.user.email,
                      })}
                    />
                  }
                >
                  Đăng ký thêm lớp
                </Button>
              )}
              {isStaff && (
                <Button
                  variant="outline"
                  render={
                    <Link href={ROUTES.STAFF.STUDENT_ACTION({ studentId: id })} />
                  }
                >
                  Xử lý nghỉ / học bù
                </Button>
              )}
              <RowActions
                items={[
                  {
                    id: "edit",
                    label: "Sửa hồ sơ",
                    onClick: () => setEditing(true),
                  },
                  ...(isStaff
                    ? [
                        {
                          id: "withdraw",
                          label: "Ngừng học",
                          danger: true,
                          onClick: () =>
                            router.push(
                              ROUTES.STAFF.STUDENT_ACTION({
                                studentId: id,
                                action: "withdraw",
                              }),
                            ),
                        },
                      ]
                    : [
                        {
                          id: "parent",
                          label: "Xem tài khoản phụ huynh",
                          onClick: () =>
                            router.push(
                              `${ROUTES.MANAGER.STUDENTS}?${new URLSearchParams({ tab: "parents", parentId: student.parentProfile.user.id })}`,
                            ),
                        },
                      ]),
                ]}
              />
            </div>
          )
        }
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {student && data.data && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant={student.status === "ACTIVE" ? "success" : "secondary"}>
                {student.status === "ACTIVE" ? "Đang học" : "Ngừng học"}
              </Badge>
              <Badge variant="outline">{studying.length} lớp đang học</Badge>
            </div>
            <div
              className={cn("grid gap-4 sm:grid-cols-2", STAT_COLUMNS[statCount])}
            >
              {attendanceReady && (
                <>
                  <DashboardStatCard
                    label="Chuyên cần"
                    value={
                      totals.required
                        ? `${Math.round((totals.attended / totals.required) * 100)}%`
                        : "—"
                    }
                    note={`Có mặt ${totals.attended}/${totals.required} buổi đã chốt`}
                    icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} />}
                  />
                  <DashboardStatCard
                    label="Số buổi vắng"
                    value={totals.absent + totals.excused}
                    note={[
                      `${totals.excused} có phép`,
                      `${totals.madeUp} đã học bù`,
                      isStaff && makeups.data
                        ? `${makeups.data.length} chờ học bù`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    icon={<HugeiconsIcon icon={UserRemove01Icon} />}
                  />
                </>
              )}
              {grades.isSuccess && (
                <DashboardStatCard
                  label="Điểm trung bình"
                  value={
                    average === null
                      ? "—"
                      : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(average)}/10`
                  }
                  note={
                    graded.length
                      ? `${graded.length} bài đã công bố điểm, quy về thang 10`
                      : "Chưa có bài công bố điểm"
                  }
                  icon={<HugeiconsIcon icon={StarIcon} />}
                />
              )}
              <DashboardStatCard
                label="Học phí đã đóng"
                value={money(paid)}
                note={
                  paidUntil
                    ? `Hết hạn ${displayDate(paidUntil)}`
                    : "Chưa có lớp đang học"
                }
                icon={<HugeiconsIcon icon={Invoice01Icon} />}
              />
            </div>
            <Tabs
              value={tab}
              onValueChange={(value) => {
                const next = TAB_KEYS.find((key) => key === value);
                if (next) void setTab(next === "overview" ? null : next);
              }}
            >
              <TabsList aria-label="Phần của hồ sơ học sinh">
                {TAB_KEYS.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {TABS[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {tab === "overview" && (
              <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-6">
                  {attendanceReady && (
                    <Card className="min-w-0">
                      <CardHeader>
                        <CardTitle>Điểm danh theo lớp</CardTitle>
                        <CardDescription>
                          Mỗi ô là một buổi; rê chuột để xem ngày.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(attendance.data ?? []).map(({ classId, summary }) => {
                          const future = (upcoming.data ?? []).filter(
                            (session) =>
                              session.classId === classId &&
                              session.status === "SCHEDULED",
                          );
                          const cells = [
                            ...[...summary.history]
                              .sort((a, b) =>
                                a.session.startsAt.localeCompare(b.session.startsAt),
                              )
                              .map((row) => ({
                                key: row.id,
                                status: row.effectiveStatus as AttendanceStatus | "UPCOMING",
                                startsAt: row.session.startsAt,
                              })),
                            ...future.map((session) => ({
                              key: session.id,
                              status: "UPCOMING" as const,
                              startsAt: session.startsAt,
                            })),
                          ];
                          const own = summary.students[0];
                          return (
                            <div key={classId} className="space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                <span className="font-medium">
                                  {className.get(classId) ?? "Lớp học"}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                  {own?.attendancePercent !== null &&
                                  own?.attendancePercent !== undefined
                                    ? `${Math.round(own.attendancePercent)}% chuyên cần`
                                    : "Chưa có buổi đã chốt"}
                                </span>
                              </div>
                              {cells.length ? (
                                <ul className="flex flex-wrap gap-1" aria-label={`Điểm danh lớp ${className.get(classId) ?? ""}`}>
                                  {cells.map((cell) => (
                                    <li
                                      key={cell.key}
                                      title={`${day.format(new Date(cell.startsAt))}: ${CELL[cell.status].label}`}
                                      aria-label={`${day.format(new Date(cell.startsAt))}: ${CELL[cell.status].label}`}
                                      className={cn(
                                        "size-4 rounded-[4px]",
                                        CELL[cell.status].className,
                                      )}
                                    />
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Chưa có buổi học.
                                </p>
                              )}
                            </div>
                          );
                        })}
                        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {Object.values(CELL).map((cell) => (
                            <li key={cell.label} className="flex items-center gap-1.5">
                              <span
                                aria-hidden="true"
                                className={cn("size-3 rounded-[3px]", cell.className)}
                              />
                              {cell.label}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {attendanceReady && (
                    <Card className="min-w-0">
                      <CardHeader>
                        <CardTitle>Buổi gần đây</CardTitle>
                      </CardHeader>
                      <CardContent className="min-w-0">
                        {history.length ? (
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Ngày</TableHead>
                                  <TableHead>Lớp</TableHead>
                                  <TableHead>Điểm danh</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {history.slice(0, 8).map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="tabular-nums">
                                      {displayMoment(row.session.startsAt)}
                                    </TableCell>
                                    <TableCell>
                                      {className.get(row.session.classId) ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          row.effectiveStatus === "ABSENT"
                                            ? "danger"
                                            : row.effectiveStatus === "PRESENT"
                                              ? "success"
                                              : "outline"
                                        }
                                      >
                                        {CELL[row.effectiveStatus].label}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Chưa có buổi đã chốt điểm danh.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="min-w-0 space-y-6">
                  <Card className="min-w-0">
                    <CardHeader>
                      <CardTitle>Lớp đang học</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studying.length ? (
                        <ul className="space-y-3">
                          {studying.map(({ id: key, classroom, startDate, endDate }) => {
                            const weeks = endDate
                              ? Math.max(
                                  0,
                                  Math.ceil(
                                    (Date.parse(`${endDate}T00:00:00Z`) -
                                      Date.parse(`${today}T00:00:00Z`)) /
                                      (7 * 86400000),
                                  ),
                                )
                              : null;
                            return (
                              <li
                                key={key}
                                className="space-y-1 rounded-xl border border-border p-3 text-sm"
                              >
                                <p className="font-medium">
                                  {classroom.name} · {classroom.program.subject}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {scheduleText(classroom.weeklySchedules) ||
                                    "Chưa có lịch tuần"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {startDate ? displayDate(startDate) : "—"} →{" "}
                                  {endDate ? displayDate(endDate) : "—"}
                                  {weeks !== null ? ` · còn ${weeks} tuần` : ""}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Chưa có lớp đang học.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="min-w-0">
                    <CardHeader>
                      <CardTitle>Phụ huynh</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="font-medium">
                        {student.parentProfile.user.displayName ||
                          student.parentProfile.user.email}
                      </p>
                      <p className="break-all text-muted-foreground">
                        {student.parentProfile.user.email}
                      </p>
                      {student.parentProfile.phone && (
                        <p className="text-muted-foreground">
                          {student.parentProfile.phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  {grades.isSuccess && (
                    <Card className="min-w-0">
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle>Điểm gần đây</CardTitle>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => void setTab("grades")}
                          >
                            Xem tất cả
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {recentGrades.length ? (
                          <ul className="divide-y divide-border text-sm">
                            {recentGrades.map((row) => (
                              <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 py-2"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">
                                    {row.title}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {row.class.name} · {assignmentKind(row)}
                                  </span>
                                </span>
                                <span className="shrink-0 font-medium tabular-nums">
                                  {scoreText(row)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Chưa có bài công bố điểm.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {tab === "schedule" && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Lịch tuần hiện tại và sắp tới</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.data.schedule.map((slot, index) => (
                    <p key={`${slot.enrollmentId}-${slot.classId}-${index}`}>
                      <span className="font-medium">{slot.className}</span> ·{" "}
                      {scheduleText([slot])}
                      {slot.effectiveFrom
                        ? ` · Từ ${displayDate(slot.effectiveFrom)}`
                        : ""}
                      {slot.effectiveTo
                        ? ` đến ${displayDate(slot.effectiveTo)}`
                        : ""}
                    </p>
                  ))}
                  {!data.data.schedule.length && (
                    <p className="text-muted-foreground">
                      Chưa có lịch tuần đang hiệu lực.
                    </p>
                  )}
                  {data.data.enrollments.some((item) => item.placements.length > 1) && (
                    <details className="pt-2">
                      <summary className="cursor-pointer text-muted-foreground">
                        Lịch sử xếp lớp
                      </summary>
                      <ul className="space-y-1 pt-2">
                        {data.data.enrollments.flatMap((enrollment) =>
                          enrollment.placements.map((placement) => (
                            <li key={`${enrollment.id}-${placement.classId}-${placement.effectiveFrom}`}>
                              {placement.class?.name ?? placement.classId} ·{" "}
                              {displayDate(placement.effectiveFrom)} –{" "}
                              {placement.effectiveTo
                                ? displayDate(placement.effectiveTo)
                                : "hiện tại"}
                            </li>
                          )),
                        )}
                      </ul>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            {tab === "grades" && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Điểm & bài tập</CardTitle>
                  <CardDescription>
                    Bài đã giao cho học sinh, mới nhất trước. Điểm chỉ hiện khi
                    giáo viên đã công bố.
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                  <AsyncBoundary
                    isLoading={grades.isPending}
                    isError={grades.isError}
                    error={grades.error}
                    onRetry={() => void grades.refetch()}
                    data={grades.data}
                    emptyProps={{ title: "Chưa có bài được giao" }}
                  >
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bài</TableHead>
                            <TableHead>Lớp</TableHead>
                            <TableHead>Hạn nộp</TableHead>
                            <TableHead>Bài nộp</TableHead>
                            <TableHead className="text-right">Điểm</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grades.data?.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="max-w-80 whitespace-normal">
                                <span className="font-medium">{row.title}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {assignmentKind(row)}
                                </span>
                              </TableCell>
                              <TableCell>{row.class.name}</TableCell>
                              <TableCell className="tabular-nums">
                                {displayMoment(row.dueAt)}
                              </TableCell>
                              <TableCell>
                                {row.submission ? (
                                  <span className="tabular-nums">
                                    {displayMoment(row.submission.submittedAt)}
                                    {row.submission.attemptNo > 1
                                      ? ` · lần ${row.submission.attemptNo}`
                                      : ""}
                                  </span>
                                ) : (
                                  <Badge
                                    variant={
                                      Date.parse(row.dueAt) < gradesAt
                                        ? "danger"
                                        : "outline"
                                    }
                                  >
                                    {Date.parse(row.dueAt) < gradesAt
                                      ? "Không nộp"
                                      : "Chưa nộp"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.grade && row.maxScore > 0 ? (
                                  <span className="font-medium">
                                    {scoreText(row as GradedRecord)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {row.submission ? "Chưa công bố" : "—"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AsyncBoundary>
                </CardContent>
              </Card>
            )}

            {tab === "tuition" && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Học phí</CardTitle>
                  <CardDescription>
                    Biên lai của các ghi danh · tổng {money(paid)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lớp</TableHead>
                          <TableHead>Thời hạn</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead>Biên lai</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.data.enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>{enrollment.class.name}</TableCell>
                            <TableCell className="tabular-nums">
                              {enrollment.startDate
                                ? displayDate(enrollment.startDate)
                                : "—"}{" "}
                              →{" "}
                              {enrollment.endDate
                                ? displayDate(enrollment.endDate)
                                : "—"}{" "}
                              · {enrollment.packageMonths} tháng
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  enrollment.status === "ACTIVE"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {enrollment.status === "ACTIVE"
                                  ? "Đang học"
                                  : enrollment.status === "ENDED"
                                    ? "Đã kết thúc"
                                    : enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {enrollment.registrationOrder?.payment
                                ? money(enrollment.registrationOrder.payment.amount)
                                : "—"}
                            </TableCell>
                            <TableCell className="whitespace-normal text-xs">
                              {enrollment.registrationOrder?.payment
                                ? `${enrollment.registrationOrder.payment.receiptNumber} · ${displayMoment(enrollment.registrationOrder.payment.confirmedAt)}`
                                : "Chưa có biên lai"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {!data.data.enrollments.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">
                              Chưa có ghi danh.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {tab === "absences" && (
              <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Buổi vắng và có phép</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AsyncBoundary
                      isLoading={attendance.isPending}
                      isError={false}
                      data={history.filter((row) => row.effectiveStatus !== "PRESENT")}
                      emptyProps={{
                        title: attendanceReady
                          ? "Không có buổi vắng"
                          : "Chưa xem được chuyên cần",
                      }}
                    >
                      <ul className="divide-y divide-border text-sm">
                        {history
                          .filter((row) => row.effectiveStatus !== "PRESENT")
                          .map((row) => (
                            <li
                              key={row.id}
                              className="flex items-center justify-between gap-3 py-2"
                            >
                              <span>
                                {displayMoment(row.session.startsAt)} ·{" "}
                                {className.get(row.session.classId) ?? "Lớp học"}
                              </span>
                              <Badge variant="outline">
                                {CELL[row.effectiveStatus].label}
                              </Badge>
                            </li>
                          ))}
                      </ul>
                    </AsyncBoundary>
                  </CardContent>
                </Card>
                {isStaff && (
                  <Card className="min-w-0">
                    <CardHeader>
                      <CardTitle>Chờ xếp học bù</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AsyncBoundary
                        isLoading={makeups.isPending}
                        isError={makeups.isError}
                        error={makeups.error}
                        onRetry={() => void makeups.refetch()}
                        data={makeups.data}
                        emptyProps={{ title: "Không có buổi chờ học bù" }}
                      >
                        <ul className="divide-y divide-border text-sm">
                          {makeups.data?.map((source) => (
                            <li
                              key={source.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-2"
                            >
                              <span>
                                {displayMoment(source.session.startsAt)} ·{" "}
                                {source.session.class.name}
                              </span>
                              <Button
                                size="xs"
                                variant="outline"
                                render={
                                  <Link
                                    href={ROUTES.STAFF.STUDENT_ACTION({
                                      studentId: id,
                                      action: "makeup",
                                      sessionId: source.session.id,
                                    })}
                                  />
                                }
                              >
                                Xếp học bù
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </AsyncBoundary>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </AsyncBoundary>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa hồ sơ học sinh</DialogTitle>
            <DialogDescription>
              Phụ huynh cũng sửa được hồ sơ trên ứng dụng. Thay đổi được ghi
              vào lịch sử thay đổi.
            </DialogDescription>
          </DialogHeader>
          {editing && student && (
            <ApiForm
              key={student.id}
              schema={studentUpdateSchema}
              defaults={{
                fullName: student.fullName,
                grade: String(student.grade),
                dateOfBirth: student.dateOfBirth?.slice(0, 10) ?? "",
              }}
              fields={[
                { name: "fullName", label: "Họ tên" },
                {
                  name: "grade",
                  label: "Khối",
                  type: "select",
                  options: GRADE_OPTIONS,
                  disabled: gradeLocked,
                  description: gradeLocked
                    ? "Học sinh đang học hoặc sắp học một lớp nên không đổi khối được."
                    : "Lớp học theo khối; chỉ đổi khối khi chưa có ghi danh.",
                },
                {
                  name: "dateOfBirth",
                  label: "Ngày sinh",
                  type: "date",
                  description: "Để trống nếu chưa rõ.",
                },
              ]}
              successMessage={false}
              onSubmit={(value) => directoryApi.updateStudent(id, value)}
              onSuccess={() => {
                toast.success("Đã lưu hồ sơ học sinh.");
                setEditing(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
