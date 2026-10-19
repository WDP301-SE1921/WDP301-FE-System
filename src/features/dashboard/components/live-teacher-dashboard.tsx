"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckListIcon,
  SchoolIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import { curriculumApi } from "@/features/curriculum/api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { readAssignmentWorkspaces } from "@/features/assignments/workspace-api";
import { latestSubmissions } from "@/features/assignments/submission-selectors";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useCurrentUser } from "@/hooks/use-current-role";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";
import { dashboardApi } from "../api";
import { DashboardStatCard } from "./dashboard-stat-card";
import { ColumnChart } from "./column-chart";

/** Buổi đã kết thúc trong khoảng này mà chưa chốt thì tính là chưa điểm danh. */
const LOOKBACK_DAYS = 30;
const ATTENDANCE_WEEKS = 8;
const clock = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** Dashboard Giáo viên (artboard GV-Dashboard). */
export function LiveTeacherDashboard() {
  const user = useCurrentUser();
  const now = useCurrentTime();
  const today = todayInVietnam();
  const lookbackFrom = addCalendarDays(today, -LOOKBACK_DAYS);
  const attendanceFrom = addCalendarDays(today, -7 * ATTENDANCE_WEEKS);
  const classes = useLiveQuery(["teacher-dashboard-classes"], () =>
    registrationApi.classes(),
  );
  const recent = useLiveQuery(
    ["teacher-dashboard-sessions", lookbackFrom, today],
    (signal) =>
      academicApi.sessions({ fromDate: lookbackFrom, toDate: today }, signal),
  );
  const workspaces = useLiveQuery(["teacher-assignment-workspaces"], (signal) =>
    readAssignmentWorkspaces(signal),
  );
  const units = useLiveQuery(["teacher-dashboard-units"], (signal) =>
    curriculumApi.units(undefined, signal),
  );
  const unitFrom = (units.data ?? [])
    .filter(
      (unit) =>
        unit.status === "APPROVED" &&
        unit.fromDate.slice(0, 10) <= today &&
        unit.toDate.slice(0, 10) >= today,
    )
    .reduce<string>(
      (min, unit) =>
        unit.fromDate.slice(0, 10) < min ? unit.fromDate.slice(0, 10) : min,
      today,
    );
  // Buổi của giáo viên từ đầu giáo trình đang dùng để đếm bài đã dạy.
  const unitSessions = useLiveQuery(
    ["teacher-dashboard-unit-sessions", unitFrom, today],
    (signal) =>
      academicApi.sessions({ fromDate: unitFrom, toDate: today }, signal),
    !!units.data,
  );
  const attendance = useLiveQuery(
    ["teacher-dashboard-attendance", attendanceFrom, today],
    (signal) =>
      dashboardApi.analytics(
        {
          from: `${attendanceFrom}T00:00:00.000+07:00`,
          to: `${today}T23:59:59.999+07:00`,
          bucket: "WEEK",
        },
        signal,
      ),
  );

  const todaySessions = (recent.data ?? [])
    .filter(
      (item) =>
        item.status !== "CANCELLED" &&
        new Date(Date.parse(item.startsAt) + 7 * 3600000)
          .toISOString()
          .slice(0, 10) === today,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const unmarked = (recent.data ?? []).filter(
    (item) => item.status === "SCHEDULED" && Date.parse(item.endsAt) <= now,
  );
  const toGrade = (workspaces.data ?? []).flatMap(({ assignment, submissions }) =>
    [...latestSubmissions(submissions).values()]
      .filter(
        (submission) =>
          !submission.grades.length &&
          assignment.recipients.some((r) => r.id === submission.recipientId),
      )
      .map((submission) => ({ assignment, submission })),
  );
  const toReview = (units.data ?? []).filter(
    (unit) =>
      unit.status === "PENDING_REVIEW" &&
      !unit.technicalReviewedAt &&
      unit.reviewerTeacherId === user?.id,
  );
  const progress = (classes.data ?? []).map((classroom) => {
    const unit = (units.data ?? []).find(
      (item) =>
        item.programId === classroom.programId &&
        item.status === "APPROVED" &&
        item.fromDate.slice(0, 10) <= today &&
        item.toDate.slice(0, 10) >= today,
    );
    const mine = (unitSessions.data ?? []).filter(
      (session) =>
        session.classId === classroom.id && session.lesson?.unitId === unit?.id,
    );
    const taught = mine.filter((s) => s.status === "COMPLETED").length;
    const overdue = mine.filter(
      (s) => s.status === "SCHEDULED" && Date.parse(s.endsAt) <= now,
    ).length;
    return { classroom, unit, taught, overdue };
  });
  const weeks = (attendance.data?.trend ?? []).filter(
    (point) => point.attendancePercent !== null,
  );

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan giảng dạy"
        description="Lịch hôm nay, buổi cần điểm danh, bài cần chấm và giáo trình."
        actions={
          <Button render={<Link href={ROUTES.TEACHER.ASSIGNMENT_NEW} />}>
            Tạo bài tập / kiểm tra
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Lớp phụ trách"
          value={classes.data?.length ?? "—"}
          note={classes.isPending ? "Đang tải…" : "Lớp được phân công"}
          icon={<HugeiconsIcon icon={SchoolIcon} />}
        />
        <DashboardStatCard
          label="Buổi học hôm nay"
          value={recent.data ? todaySessions.length : "—"}
          note="Không tính buổi đã hủy"
          icon={<HugeiconsIcon icon={Calendar03Icon} />}
        />
        <DashboardStatCard
          label="Bài nộp chưa chấm"
          value={workspaces.data ? toGrade.length : "—"}
          note="Lần nộp mới nhất chưa có bản chấm"
          icon={<HugeiconsIcon icon={Task01Icon} />}
        />
        <DashboardStatCard
          label="Buổi chưa điểm danh"
          value={recent.data ? unmarked.length : "—"}
          note={`Đã kết thúc, chưa chốt (${LOOKBACK_DAYS} ngày gần đây)`}
          icon={<HugeiconsIcon icon={CheckListIcon} />}
        />
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Buổi học hôm nay</CardTitle>
                <CardDescription>
                  {today.split("-").reverse().join("/")}
                </CardDescription>
              </div>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.TEACHER.SCHEDULE} />}
              >
                Lịch dạy & điểm danh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            <AsyncBoundary
              isLoading={recent.isPending}
              isError={recent.isError}
              error={recent.error}
              onRetry={() => void recent.refetch()}
              data={todaySessions}
              emptyProps={{ title: "Hôm nay không có buổi được phân công" }}
            >
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Lớp · bài</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="tabular-nums">
                          {clock.format(new Date(session.startsAt))}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <span className="font-medium">
                            {session.class.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {session.lesson?.title ?? "Buổi học"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {STATUS_TEXT[session.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            render={
                              <Link
                                href={`${ROUTES.TEACHER.SCHEDULE}?${new URLSearchParams({ view: "list", session: session.id })}`}
                              />
                            }
                          >
                            Điểm danh
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Chuyên cần</CardTitle>
            <CardDescription>
              Tỉ lệ có mặt theo tuần, buổi đã chốt điểm danh của lớp bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <AsyncBoundary
              isLoading={attendance.isPending}
              isError={attendance.isError}
              error={attendance.error}
              onRetry={() => void attendance.refetch()}
              data={weeks}
              emptyProps={{ title: "Chưa có buổi đã chốt điểm danh" }}
            >
              <ColumnChart
                ariaLabel="Tỉ lệ chuyên cần theo tuần"
                valueLabel="Chuyên cần"
                format={(value) => `${Math.round(value)}%`}
                data={weeks.map((point) => {
                  const [, month, day] = point.period.split("-");
                  return {
                    key: point.period,
                    label: `${day}/${month}`,
                    title: `Tuần từ ${day}/${month}`,
                    value: point.attendancePercent ?? 0,
                  };
                })}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Tiến độ giáo trình</CardTitle>
            <CardDescription>
              Bài đã dạy (buổi đã chốt) trên tổng bài của giáo trình đang dùng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={
                classes.isPending || units.isPending || unitSessions.isPending
              }
              isError={classes.isError || units.isError || unitSessions.isError}
              error={classes.error ?? units.error ?? unitSessions.error}
              onRetry={() => {
                void classes.refetch();
                void units.refetch();
                void unitSessions.refetch();
              }}
              data={progress}
              emptyProps={{ title: "Chưa có lớp được phân công" }}
            >
              <ul className="space-y-4">
                {progress.map(({ classroom, unit, taught, overdue }) => {
                  const total = unit?._count?.lessons ?? 0;
                  return (
                    <li key={classroom.id} className="space-y-1.5 text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate font-medium">
                          {classroom.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {unit ? `${taught}/${total} bài` : "Chưa có giáo trình"}
                        </span>
                      </div>
                      {unit && (
                        <Progress
                          value={total ? Math.min(100, (taught / total) * 100) : 0}
                          aria-label={`Tiến độ giáo trình lớp ${classroom.name}`}
                        />
                      )}
                      {overdue > 0 && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {overdue} buổi đã qua chưa chốt điểm danh
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Cần chấm</CardTitle>
              <Button
                variant="link"
                size="sm"
                render={
                  <Link href={`${ROUTES.TEACHER.ASSIGNMENTS}?filter=need-grading`} />
                }
              >
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={workspaces.isPending}
              isError={workspaces.isError}
              error={workspaces.error}
              onRetry={() => void workspaces.refetch()}
              data={toGrade}
              emptyProps={{ title: "Không có bài chờ chấm" }}
            >
              <ul className="divide-y divide-border">
                {toGrade
                  .sort((a, b) =>
                    a.submission.submittedAt.localeCompare(b.submission.submittedAt),
                  )
                  .slice(0, 5)
                  .map(({ assignment, submission }) => (
                    <li key={submission.id}>
                      <Link
                        href={`${ROUTES.TEACHER.GRADING_DETAIL(submission.id)}?assignmentId=${assignment.id}`}
                        className="block py-2.5 text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="block font-medium">
                          {assignment.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Nộp {displayMoment(submission.submittedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Chờ bạn thẩm định</CardTitle>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.TEACHER.CURRICULUM} />}
              >
                Giáo trình
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={units.isPending}
              isError={units.isError}
              error={units.error}
              onRetry={() => void units.refetch()}
              data={toReview}
              emptyProps={{ title: "Không có giáo trình chờ thẩm định" }}
            >
              <ul className="divide-y divide-border">
                {toReview.slice(0, 5).map((unit) => (
                  <li key={unit.id}>
                    <Link
                      href={ROUTES.TEACHER.CURRICULUM_UNIT(unit.id)}
                      className="block py-2.5 text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block font-medium">{unit.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {unit._count?.lessons ?? 0} bài · gửi thẩm định
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
