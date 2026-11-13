"use client";

import Link from "next/link";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { displayMoment } from "@/features/academic/components/live-fields";
import { readAssignmentWorkspaces } from "@/features/assignments/workspace-api";
import {
  latestSubmissions,
  submissionSummary,
} from "@/features/assignments/submission-selectors";
import { assignmentFollowUps } from "@/features/assignments/assignment-steps";
import { classesMissingMonthlyTest } from "@/features/assignments/monthly-test";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useCurrentUser } from "@/hooks/use-current-role";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import { dashboardApi } from "../api";
import {
  compareCounts,
  comparePoints,
  previousRange,
  scoreText,
  toTenScale,
  vietnamMonth,
} from "../metrics";
import { vietnamDay } from "../staff-summary";
import type { AnalyticsFilters } from "../types";
import { ColumnChart } from "./column-chart";
import {
  AttentionStrip,
  KpiCard,
  KpiRow,
  Panel,
  PanelError,
  percentText,
} from "./dashboard-ui";
import { MonthlyTestReminder } from "./monthly-test-reminder";

/** Buổi đã kết thúc trong khoảng này mà chưa chốt thì tính là chưa điểm danh. */
const LOOKBACK_DAYS = 30;
const ATTENDANCE_WEEKS = 8;
const TEACHING_MONTHS = 6;
/** Bài chờ chấm quá số ngày này thì tô cam. */
const STALE_GRADING_DAYS = 3;
const LOW_ATTENDANCE = 85;
const clock = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const dm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const ageInDays = (from: string, now: number) =>
  Math.max(0, Math.floor((now - Date.parse(from)) / 86400000));
const filtersFor = (
  fromDate: string,
  toDate: string,
  bucket: AnalyticsFilters["bucket"],
): AnalyticsFilters => ({
  from: `${fromDate}T00:00:00.000+07:00`,
  to: `${toDate}T23:59:59.999+07:00`,
  bucket,
});
function monthsBack(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 - months, 1)).toISOString().slice(0, 10);
}

/** Dashboard Giáo viên — canvas "Dashboard 4 vai trò", artboard Giáo viên. Chỉ API có sẵn. */
export function LiveTeacherDashboard() {
  const user = useCurrentUser();
  const now = useCurrentTime();
  const today = todayInVietnam();
  const lookbackFrom = addCalendarDays(today, -LOOKBACK_DAYS);
  const attendanceFrom = addCalendarDays(today, -7 * ATTENDANCE_WEEKS);
  const monthFrom = `${today.slice(0, 8)}01`;
  const prevMonth = previousRange(monthFrom, today);
  const teachingFrom = monthsBack(today, TEACHING_MONTHS - 1);

  const classes = useLiveQuery(["teacher-dashboard-classes"], () =>
    registrationApi.classes(),
  );
  const recent = useLiveQuery(
    ["teacher-dashboard-sessions", lookbackFrom, today],
    (signal) =>
      academicApi.sessions({ fromDate: lookbackFrom, toDate: today }, signal),
  );
  const upcoming = useLiveQuery(
    ["teacher-dashboard-upcoming", today],
    (signal) =>
      academicApi.sessions({ fromDate: today, toDate: addCalendarDays(today, 14) }, signal),
  );
  const teaching = useLiveQuery(
    ["teacher-dashboard-teaching", teachingFrom, today],
    (signal) => academicApi.sessions({ fromDate: teachingFrom, toDate: today }, signal),
  );
  const workspaces = useLiveQuery(["teacher-assignment-workspaces"], (signal) =>
    readAssignmentWorkspaces(signal),
  );
  // Danh sách tóm tắt (không gọi chi tiết/bài nộp) đủ để biết lớp nào đã có bài kiểm tra trong tháng.
  const assignmentSummaries = useLiveQuery(
    ["teacher-assignment-summaries"],
    (signal) => academicApi.assignments(signal),
  );
  const missingTests =
    classes.data && assignmentSummaries.data
      ? classesMissingMonthlyTest(classes.data, assignmentSummaries.data, today)
      : [];
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
    (signal) => dashboardApi.analytics(filtersFor(attendanceFrom, today, "WEEK"), signal),
  );
  const monthStats = useLiveQuery(
    ["teacher-dashboard-month", monthFrom, today],
    (signal) => dashboardApi.analytics(filtersFor(monthFrom, today, "MONTH"), signal),
  );
  const prevMonthStats = useLiveQuery(
    ["teacher-dashboard-month", prevMonth.fromDate, prevMonth.toDate],
    (signal) =>
      dashboardApi.analytics(filtersFor(prevMonth.fromDate, prevMonth.toDate, "MONTH"), signal),
  );

  // ---- Số liệu ----
  const todaySessions = (recent.data ?? [])
    .filter((item) => item.status !== "CANCELLED" && vietnamDay(item.startsAt) === today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const unmarked = (recent.data ?? [])
    .filter((item) => item.status === "SCHEDULED" && Date.parse(item.endsAt) <= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  // Hôm nay + tối đa 3 buổi quá hạn gần nhất; phần còn lại dồn vào một dòng mở lịch dạy.
  const overdueEarlier = unmarked.filter((item) => vietnamDay(item.startsAt) !== today);
  const timeline = [...overdueEarlier.slice(-3), ...todaySessions];
  const hiddenOverdue = Math.max(0, overdueEarlier.length - 3);
  const nextToday = todaySessions.find((item) => Date.parse(item.startsAt) > now);
  const toGrade = (workspaces.data ?? []).flatMap(({ assignment, submissions, className }) =>
    [...latestSubmissions(submissions).values()]
      .filter(
        (submission) =>
          !submission.grades.length &&
          assignment.recipients.some((r) => r.id === submission.recipientId),
      )
      .map((submission) => ({ assignment, submission, className })),
  );
  const gradingGroups = [
    ...toGrade
      .reduce((map, row) => {
        const group = map.get(row.assignment.id) ?? { ...row, count: 0, oldest: row.submission };
        group.count += 1;
        if (row.submission.submittedAt < group.oldest.submittedAt) group.oldest = row.submission;
        return map.set(row.assignment.id, group);
      }, new Map<string, (typeof toGrade)[number] & { count: number; oldest: (typeof toGrade)[number]["submission"] }>())
      .values(),
  ].sort((a, b) => a.oldest.submittedAt.localeCompare(b.oldest.submittedAt));
  const oldestGradingDays = gradingGroups[0] ? ageInDays(gradingGroups[0].oldest.submittedAt, now) : null;
  const staleGrading = toGrade.filter((row) => ageInDays(row.submission.submittedAt, now) > STALE_GRADING_DAYS).length;
  // Bài cần làm tiếp theo từng bước (Luồng 4): nháp chưa giao, hết hạn chưa đóng, chưa gửi điểm/đáp án.
  const followUps = assignmentFollowUps(workspaces.data ?? [], (row) => ({
    status: row.assignment.status,
    dueAt: row.assignment.dueAt,
    answersPublishedAt: row.assignment.answersPublishedAt,
    questionCount: row.assignment.questions.length,
    summary: submissionSummary(row.assignment, row.submissions),
    now,
  }));
  const toReview = (units.data ?? []).filter(
    (unit) =>
      unit.status === "PENDING_REVIEW" &&
      !unit.technicalReviewedAt &&
      unit.reviewerTeacherId === user?.id,
  );
  const progress = new Map(
    (classes.data ?? []).map((classroom) => {
      const unit = (units.data ?? []).find(
        (item) =>
          item.programId === classroom.programId &&
          item.status === "APPROVED" &&
          item.fromDate.slice(0, 10) <= today &&
          item.toDate.slice(0, 10) >= today,
      );
      const mine = (unitSessions.data ?? []).filter(
        (session) => session.classId === classroom.id && session.lesson?.unitId === unit?.id,
      );
      return [
        classroom.id,
        {
          unit,
          taught: mine.filter((s) => s.status === "COMPLETED").length,
          total: unit?._count?.lessons ?? 0,
        },
      ] as const;
    }),
  );
  const metricByClass = new Map(
    (attendance.data?.classes ?? []).map((metric) => [metric.classId, metric]),
  );
  const nextSession = new Map<string, string>();
  for (const session of [...(upcoming.data ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
    if (session.status === "SCHEDULED" && Date.parse(session.startsAt) > now && !nextSession.has(session.classId))
      nextSession.set(session.classId, session.startsAt);

  const myClasses = new Set((classes.data ?? []).map((item) => item.id));
  const taughtByMe = (teaching.data ?? []).filter(
    (session) => session.status === "COMPLETED" && session.teacherId === user?.id,
  );
  const months = Array.from({ length: TEACHING_MONTHS }, (_, index) =>
    monthsBack(today, TEACHING_MONTHS - 1 - index).slice(0, 7),
  );
  const perMonth = months.map((month) => {
    const list = taughtByMe.filter((session) => vietnamMonth(session.startsAt) === month);
    return {
      month,
      total: list.length,
      substitute: list.filter((session) => !myClasses.has(session.classId)).length,
    };
  });
  const inRange = (from: string, to: string) =>
    taughtByMe.filter((session) => {
      const day = vietnamDay(session.startsAt);
      return day >= from && day <= to;
    });
  const taughtThisMonth = inRange(monthFrom, today);
  const taughtPrevMonth = inRange(prevMonth.fromDate, prevMonth.toDate);
  const substituteThisMonth = taughtThisMonth.filter((session) => !myClasses.has(session.classId)).length;
  const weeks = (attendance.data?.trend ?? []).filter((point) => point.attendancePercent !== null);
  const attendanceNow = monthStats.data?.summary.attendancePercent ?? null;

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan giảng dạy"
        actions={
          <Button render={<Link href={ROUTES.TEACHER.ASSIGNMENT_NEW} />}>
            Tạo bài tập / kiểm tra
          </Button>
        }
      />

      <KpiRow>
        <KpiCard
          label="Buổi hôm nay"
          tip="Buổi được phân công hôm nay, không tính buổi đã hủy."
          value={todaySessions.length}
          sub={
            todaySessions.length
              ? `${todaySessions.filter((item) => item.status === "COMPLETED").length} xong${nextToday ? ` · tiếp theo ${clock.format(new Date(nextToday.startsAt))}` : ""}`
              : "Không có buổi"
          }
          isLoading={recent.isPending}
          isError={recent.isError}
          onRetry={() => void recent.refetch()}
        />
        <KpiCard
          label="Chưa điểm danh"
          tip={`Buổi đã kết thúc nhưng chưa chốt điểm danh, trong ${LOOKBACK_DAYS} ngày gần đây.`}
          value={unmarked.length}
          sub={unmarked[0] ? `cũ nhất ${unmarked[0].class.name} · ${dm(vietnamDay(unmarked[0].startsAt))}` : undefined}
          warn={unmarked.length > 0}
          isLoading={recent.isPending}
          isError={recent.isError}
          onRetry={() => void recent.refetch()}
        />
        <KpiCard
          label="Bài chưa chấm"
          tip="Lần nộp mới nhất của học sinh chưa có bản chấm."
          value={toGrade.length}
          sub={oldestGradingDays === null ? undefined : `cũ nhất ${oldestGradingDays} ngày`}
          warn={oldestGradingDays !== null && oldestGradingDays > STALE_GRADING_DAYS}
          isLoading={workspaces.isPending}
          isError={workspaces.isError}
          onRetry={() => void workspaces.refetch()}
        />
        <KpiCard
          label="Buổi đã dạy tháng này"
          tip={`Buổi bạn dạy đã chốt điểm danh từ ${dm(monthFrom)}, gồm cả dạy thay; so với ${dm(prevMonth.fromDate)}–${dm(prevMonth.toDate)}.`}
          value={taughtThisMonth.length}
          delta={teaching.data ? compareCounts(taughtThisMonth.length, taughtPrevMonth.length) : undefined}
          base="cùng kỳ tháng trước"
          sub={substituteThisMonth ? `gồm ${substituteThisMonth} buổi dạy thay` : undefined}
          isLoading={teaching.isPending}
          isError={teaching.isError}
          onRetry={() => void teaching.refetch()}
        />
        <KpiCard
          label="Chuyên cần lớp tôi"
          tip="Lượt có mặt hoặc nghỉ có phép trên lượt phải điểm danh, các buổi đã chốt trong tháng."
          value={percentText(attendanceNow === null ? null : attendanceNow / 100, 1)}
          delta={comparePoints(attendanceNow, prevMonthStats.data?.summary.attendancePercent)}
          base={prevMonthStats.data ? "cùng kỳ tháng trước" : undefined}
          isLoading={monthStats.isPending}
          isError={monthStats.isError}
          onRetry={() => void monthStats.refetch()}
        />
      </KpiRow>

      <AttentionStrip
        isLoading={recent.isPending || workspaces.isPending}
        items={[
          { key: "unmarked", label: "buổi quá giờ chưa điểm danh", count: unmarked.length, href: ROUTES.TEACHER.SCHEDULE, warn: true },
          { key: "stale-grading", label: `bài chờ chấm quá ${STALE_GRADING_DAYS} ngày`, count: staleGrading, href: `${ROUTES.TEACHER.ASSIGNMENTS}?filter=need-grading`, warn: true },
          { key: "grading", label: "bài chờ chấm", count: toGrade.length - staleGrading, href: `${ROUTES.TEACHER.ASSIGNMENTS}?filter=need-grading` },
          { key: "follow-ups", label: "bài tập cần làm tiếp", count: followUps.length, href: ROUTES.TEACHER.ASSIGNMENTS },
          { key: "review", label: "giáo trình chờ bạn duyệt", count: toReview.length, href: ROUTES.TEACHER.CURRICULUM },
        ]}
      />

      <MonthlyTestReminder classes={missingTests} today={today} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Panel
          title="Hôm nay"
          actions={
            <Button variant="link" size="sm" render={<Link href={ROUTES.TEACHER.SCHEDULE} />}>
              Lịch dạy & điểm danh
            </Button>
          }
        >
          {recent.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : recent.isError ? (
            <PanelError onRetry={() => void recent.refetch()} />
          ) : !timeline.length ? (
            <p className="text-sm text-muted-foreground">Hôm nay không có buổi được phân công</p>
          ) : (
            <>
            {hiddenOverdue > 0 && (
              <Link
                href={ROUTES.TEACHER.SCHEDULE}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
              >
                +{hiddenOverdue} buổi cũ hơn chưa điểm danh ›
              </Link>
            )}
            <ul className="divide-y divide-border">
              {timeline.map((session) => {
                const isToday = vietnamDay(session.startsAt) === today;
                const ended = Date.parse(session.endsAt) <= now;
                return (
                  <li key={session.id} className="flex items-center gap-3 py-2.5 text-sm first:pt-0">
                    <div className="w-14 shrink-0 tabular-nums">
                      <p className="font-semibold">{isToday ? clock.format(new Date(session.startsAt)) : dm(vietnamDay(session.startsAt))}</p>
                      <p className="text-xs text-muted-foreground">{clock.format(new Date(session.endsAt))}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{session.class.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{session.lesson?.title ?? "Buổi học"}</p>
                    </div>
                    {session.status === "COMPLETED" ? (
                      <Badge variant="success">Đã điểm danh</Badge>
                    ) : (
                      <Button
                        size="xs"
                        variant={ended ? "default" : "outline"}
                        render={
                          <Link href={`${ROUTES.TEACHER.SCHEDULE}?${new URLSearchParams({ view: "list", session: session.id })}`} />
                        }
                      >
                        {ended ? (isToday ? "Điểm danh" : "Điểm danh bù") : "Mở buổi"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            </>
          )}
        </Panel>
        <Panel
          title="Cần chấm"
          tip="Gộp theo bài; nút Chấm mở bài nộp chờ lâu nhất."
          actions={
            <Button variant="link" size="sm" render={<Link href={`${ROUTES.TEACHER.ASSIGNMENTS}?filter=need-grading`} />}>
              Xem tất cả
            </Button>
          }
        >
          {workspaces.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : workspaces.isError ? (
            <PanelError onRetry={() => void workspaces.refetch()} />
          ) : !gradingGroups.length ? (
            <p className="text-sm text-muted-foreground">Không có bài chờ chấm</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead className="text-right">Chờ chấm</TableHead>
                    <TableHead>Cũ nhất</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingGroups.slice(0, 6).map((group) => {
                    const age = ageInDays(group.oldest.submittedAt, now);
                    return (
                      <TableRow key={group.assignment.id}>
                        <TableCell className="max-w-64 truncate font-medium">{group.assignment.title}</TableCell>
                        <TableCell className="text-muted-foreground">{group.className}</TableCell>
                        <TableCell className="text-right tabular-nums">{group.count}</TableCell>
                        <TableCell>
                          <Badge variant={age > STALE_GRADING_DAYS ? "warning" : "neutral"} title={displayMoment(group.oldest.submittedAt)}>
                            {age === 0 ? "Hôm nay" : `${age} ngày`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            render={<Link href={`${ROUTES.TEACHER.GRADING_DETAIL(group.oldest.id)}?assignmentId=${group.assignment.id}`} />}
                          >
                            Chấm
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Lớp của tôi"
        tip={`Chuyên cần, điểm và bài chưa công bố tính trên ${ATTENDANCE_WEEKS} tuần gần nhất; tiến độ là bài đã dạy trên tổng bài của giáo trình đang dùng.`}
      >
        {classes.isPending ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : classes.isError ? (
          <PanelError onRetry={() => void classes.refetch()} />
        ) : !classes.data?.length ? (
          <p className="text-sm text-muted-foreground">Chưa có lớp được phân công</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lớp</TableHead>
                  <TableHead className="text-right">Sĩ số</TableHead>
                  <TableHead className="w-48">Chuyên cần</TableHead>
                  <TableHead className="text-right">Điểm TB</TableHead>
                  <TableHead className="text-right">Bài chưa công bố</TableHead>
                  <TableHead className="w-56">Tiến độ giáo trình</TableHead>
                  <TableHead>Buổi tới</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.data.map((classroom) => {
                  const metric = metricByClass.get(classroom.id);
                  const rate = metric?.attendancePercent ?? null;
                  const step = progress.get(classroom.id);
                  const next = nextSession.get(classroom.id);
                  return (
                    <TableRow key={classroom.id}>
                      <TableCell className="font-medium">{classroom.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {classroom.rosterCount ?? 0}/{classroom.capacity}
                      </TableCell>
                      <TableCell>
                        {rate === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                              <div
                                className={cn("h-1.5 rounded-full", rate < LOW_ATTENDANCE ? "bg-amber-500" : "bg-primary")}
                                style={{ width: `${Math.min(100, rate)}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "w-14 text-right text-xs tabular-nums",
                                rate < LOW_ATTENDANCE && "font-semibold text-amber-700 dark:text-amber-400",
                              )}
                            >
                              {percentText(rate / 100, 1)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {scoreText(toTenScale(metric?.averageScore))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{metric?.unpublishedSubmissions ?? "—"}</TableCell>
                      <TableCell>
                        {step?.unit ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${step.total ? Math.min(100, (step.taught / step.total) * 100) : 0}%` }}
                              />
                            </div>
                            <span className="w-16 text-right text-xs tabular-nums">
                              {step.taught}/{step.total} bài
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa có giáo trình</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {next ? `${dm(vietnamDay(next))} ${clock.format(new Date(next))}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Buổi đã dạy theo tháng"
          tip={`${TEACHING_MONTHS} tháng gần nhất, buổi đã chốt điểm danh, gồm dạy thay. Tháng đang chạy vẽ nét đứt.`}
        >
          {teaching.isPending ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : teaching.isError ? (
            <PanelError onRetry={() => void teaching.refetch()} />
          ) : (
            <ColumnChart
              ariaLabel={`Buổi đã dạy theo tháng, ${TEACHING_MONTHS} tháng gần nhất`}
              valueLabel="Buổi đã dạy"
              format={(value) => `${value} buổi`}
              partialKey={today.slice(0, 7)}
              data={perMonth.map((point) => ({
                key: point.month,
                label: `T${Number(point.month.slice(5, 7))}`,
                title: `Tháng ${Number(point.month.slice(5, 7))}/${point.month.slice(0, 4)}${point.substitute ? ` · ${point.substitute} dạy thay` : ""}`,
                value: point.total,
              }))}
            />
          )}
        </Panel>
        <Panel title="Chuyên cần theo tuần" tip="Tỉ lệ có mặt theo tuần, buổi đã chốt điểm danh của lớp bạn.">
          {attendance.isPending ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : attendance.isError ? (
            <PanelError onRetry={() => void attendance.refetch()} />
          ) : !weeks.length ? (
            <p className="text-sm text-muted-foreground">Chưa có buổi đã chốt điểm danh</p>
          ) : (
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
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Panel title="Bài tập cần làm tiếp" tip="Nháp chưa giao, hết hạn chưa đóng, chưa gửi điểm hoặc đáp án.">
          {workspaces.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : workspaces.isError ? (
            <PanelError onRetry={() => void workspaces.refetch()} />
          ) : !followUps.length ? (
            <p className="text-sm text-muted-foreground">Không có bài tập chờ bạn làm tiếp</p>
          ) : (
            <ul className="divide-y divide-border">
              {followUps.slice(0, 5).map(({ item, step, position }) => (
                <li key={item.assignment.id}>
                  <Link
                    href={`${ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(item.assignment.id)}?step=${step.key}`}
                    className="block py-2.5 text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block font-medium">{item.assignment.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.className} · Bước {position}/5: {step.title}
                      {step.summary ? ` · ${step.summary}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title="Chờ bạn duyệt nội dung"
          actions={
            <Button variant="link" size="sm" render={<Link href={ROUTES.TEACHER.CURRICULUM} />}>
              Giáo trình
            </Button>
          }
        >
          {units.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : units.isError ? (
            <PanelError onRetry={() => void units.refetch()} />
          ) : !toReview.length ? (
            <p className="text-sm text-muted-foreground">Không có giáo trình chờ duyệt nội dung</p>
          ) : (
            <ul className="divide-y divide-border">
              {toReview.slice(0, 5).map((unit) => (
                <li key={unit.id}>
                  <Link
                    href={ROUTES.TEACHER.CURRICULUM_UNIT(unit.id)}
                    className="block py-2.5 text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block font-medium">{unit.title}</span>
                    <span className="text-xs text-muted-foreground">{unit._count?.lessons ?? 0} bài · gửi duyệt</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageContainer>
  );
}
