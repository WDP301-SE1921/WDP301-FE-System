"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Download01Icon,
  Invoice01Icon,
  Mortarboard01Icon,
  SchoolIcon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { directoryApi } from "@/features/directory/api";
import { registrationApi } from "@/features/registration-flow/api";
import { money, todayInVietnam } from "@/features/registration-flow/calendar";
import { curriculumApi } from "@/features/curriculum/api";
import { addCalendarDays, calendarWeekStart } from "@/lib/calendar-date";
import { dateRangeSchema } from "@/lib/validators/web-workflows";
import { auditActionLabel } from "@/constants/audit-events";
import { ROUTES } from "@/constants/routes";
import { dashboardApi } from "../api";
import { DashboardStatCard } from "./dashboard-stat-card";
import { ColumnChart, HorizontalBars } from "./column-chart";
import type { AnalyticsFilters } from "../types";

const dashboardRangeSchema = dateRangeSchema.refine(
  (value) =>
    Date.parse(value.toDate) - Date.parse(value.fromDate) < 366 * 86400000,
  { path: ["toDate"], message: "Chọn khoảng thống kê tối đa 366 ngày." },
);

function monthEnd(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
function sixMonthStart(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 6, 1)).toISOString().slice(0, 10);
}
function monthLabel(period: string) {
  const [year, month] = period.split("-");
  return { short: `T${Number(month)}`, full: `Tháng ${Number(month)}/${year}` };
}
const percent = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** Dashboard Quản lý (artboard QL-Dashboard). Chỉ đọc API sẵn có; % và lấp chỗ tính ở FE. */
export function LiveManagerDashboard() {
  const today = todayInVietnam();
  const [{ fromDate, toDate }, setRange] = useQueryStates({
    fromDate: parseAsString.withDefault(`${today.slice(0, 8)}01`),
    toDate: parseAsString.withDefault(monthEnd(today)),
  });
  const range = dashboardRangeSchema.safeParse({ fromDate, toDate });
  const rangeError = range.success ? undefined : range.error.issues[0]?.message;
  const selectedFilters: AnalyticsFilters = {
    from: `${fromDate}T00:00:00.000+07:00`,
    to: `${toDate}T23:59:59.999+07:00`,
    bucket: "MONTH",
  };
  const historyFilters: AnalyticsFilters = {
    ...selectedFilters,
    from: `${sixMonthStart(range.success ? toDate : today)}T00:00:00.000+07:00`,
  };
  const weekStart = calendarWeekStart(today);
  const summary = useLiveQuery(
    ["manager-dashboard", fromDate, toDate],
    (signal) => directoryApi.dashboard({ fromDate, toDate }, signal),
    range.success,
  );
  const classes = useLiveQuery(["dashboard-classes"], () =>
    registrationApi.classes(),
  );
  const students = useLiveQuery(["dashboard-students"], directoryApi.students);
  const analytics = useLiveQuery(
    ["dashboard-monthly-analytics", historyFilters],
    (signal) => dashboardApi.analytics(historyFilters, signal),
    range.success,
  );
  const activity = useLiveQuery(["dashboard-activity"], (signal) =>
    directoryApi.auditLogs({ page: 1, limit: 5 }, signal),
  );
  const weekSessions = useLiveQuery(
    ["dashboard-sessions", weekStart],
    (signal) =>
      academicApi.sessions(
        { fromDate: weekStart, toDate: addCalendarDays(weekStart, 6) },
        signal,
      ),
  );
  const failedEmails = useLiveQuery(["dashboard-failed-emails"], (signal) =>
    academicApi.emailDeliveries(1, 1, signal, "FAILED"),
  );
  const units = useLiveQuery(["dashboard-curriculum-units"], (signal) =>
    curriculumApi.units(undefined, signal),
  );
  const exportAction = useMutation({
    mutationFn: () => dashboardApi.export(selectedFilters),
  });

  const trend = analytics.data?.trend ?? [];
  const current = trend.at(-1)?.confirmedRevenue;
  const previous = trend.at(-2)?.confirmedRevenue;
  const change =
    current !== undefined && previous ? (current - previous) / previous : null;
  const activeClasses = (classes.data ?? []).filter(
    (item) => item.isActive !== false,
  );
  const openClasses = activeClasses.filter((item) => item.isOpen);
  const sessionsThisWeek = (weekSessions.data ?? []).filter(
    (item) => item.status !== "CANCELLED",
  );
  const byGrade = new Map<number, number>();
  for (const student of students.data ?? [])
    if (student.status === "ACTIVE")
      byGrade.set(student.grade, (byGrade.get(student.grade) ?? 0) + 1);
  const fill = activeClasses
    .filter((item) => item.capacity > 0 && item.rosterCount !== undefined)
    .map((item) => ({
      item,
      ratio: (item.rosterCount ?? 0) / item.capacity,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  // Cần chú ý: chỉ hiện dòng có dữ liệu thật; dòng nào API lỗi thì bỏ.
  const unassigned = activeClasses.filter((item) => !item.teacherId).length;
  const programsInUse = new Map(
    activeClasses.map((item) => [item.programId, item.program.name]),
  );
  const withNextTerm = new Set(
    (units.data ?? [])
      .filter(
        (unit) => unit.status !== "ARCHIVED" && unit.fromDate.slice(0, 10) > today,
      )
      .map((unit) => unit.programId),
  );
  const missingNextTerm = [...programsInUse.keys()].filter(
    (id) => !withNextTerm.has(id),
  ).length;
  const awaitingApproval = (units.data ?? []).filter(
    (unit) => unit.status === "PENDING_REVIEW" && !!unit.technicalReviewedAt,
  ).length;
  const attention = [
    failedEmails.data && {
      key: "emails",
      label: "Email gửi lỗi",
      count: failedEmails.data.total,
      href: `${ROUTES.MANAGER.NOTIFICATIONS}?emailStatus=FAILED`,
    },
    classes.data && {
      key: "teachers",
      label: "Lớp chưa có giáo viên",
      count: unassigned,
      href: ROUTES.MANAGER.CLASSES_UNASSIGNED,
    },
    classes.data &&
      units.data && {
        key: "next-term",
        label: "Khóa đang có lớp chưa có giáo trình kỳ sau",
        count: missingNextTerm,
        href: `${ROUTES.MANAGER.CURRICULUM}?tab=programs`,
      },
    units.data && {
      key: "approval",
      label: "Giáo trình chờ bạn duyệt",
      count: awaitingApproval,
      href: `${ROUTES.MANAGER.CURRICULUM}?tab=programs&programFilter=review`,
    },
  ].filter((row) => !!row);

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan hoạt động"
        description="Học phí, học sinh, lớp và việc cần xử lý của trung tâm."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    leftIcon={
                      <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                    }
                    rightIcon={
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="ml-2 size-4"
                      />
                    }
                  />
                }
              >
                {fromDate.split("-").reverse().join("/")} –{" "}
                {toDate.split("-").reverse().join("/")}
              </PopoverTrigger>
              <PopoverContent
                align="end"
                aria-label="Chọn kỳ thống kê"
                className="w-80 space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="dashboard-from">Từ ngày</Label>
                  <Input
                    id="dashboard-from"
                    type="date"
                    value={fromDate}
                    onChange={(event) =>
                      void setRange({ fromDate: event.target.value })
                    }
                    aria-invalid={!!rangeError}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-to">Đến ngày</Label>
                  <Input
                    id="dashboard-to"
                    type="date"
                    value={toDate}
                    onChange={(event) =>
                      void setRange({ toDate: event.target.value })
                    }
                    aria-invalid={!!rangeError}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    void setRange({
                      fromDate: `${today.slice(0, 8)}01`,
                      toDate: monthEnd(today),
                    })
                  }
                >
                  Tháng này
                </Button>
                {rangeError && (
                  <p className="text-sm text-destructive" role="alert">
                    {rangeError}
                  </p>
                )}
              </PopoverContent>
            </Popover>
            <Button
              disabled={!range.success}
              isLoading={exportAction.isPending}
              onClick={() => exportAction.mutate()}
              leftIcon={
                <HugeiconsIcon icon={Download01Icon} className="size-4" />
              }
            >
              Xuất báo cáo
            </Button>
          </div>
        }
      />
      <ApiFeedback error={exportAction.error} />
      {rangeError ? (
        <p className="text-sm text-destructive" role="alert">
          {rangeError}
        </p>
      ) : (
        <AsyncBoundary
          isLoading={summary.isPending}
          isError={summary.isError}
          error={summary.error}
          onRetry={() => void summary.refetch()}
          skeleton={
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))}
            </div>
          }
        >
          {summary.data && (
            <div
              data-dashboard-kpis
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <DashboardStatCard
                label="Học phí đã nhận"
                value={money(summary.data.tuition.confirmedAmount)}
                note={
                  change === null
                    ? `${summary.data.tuition.paymentCount} lượt thanh toán trong kỳ`
                    : `${change >= 0 ? "+" : ""}${percent.format(change)} so với tháng trước`
                }
                icon={<HugeiconsIcon icon={Invoice01Icon} />}
              />
              <DashboardStatCard
                label="Học sinh đang học"
                value={`${summary.data.counts.studyingStudents} / ${summary.data.counts.activeStudents}`}
                note="Đang có ghi danh / hồ sơ đang hoạt động"
                icon={<HugeiconsIcon icon={Mortarboard01Icon} />}
              />
              <DashboardStatCard
                label="Lớp đang mở"
                value={classes.data ? openClasses.length : "—"}
                note={
                  classes.data
                    ? `Trên ${activeClasses.length} lớp đang hoạt động`
                    : "Chưa tải được lớp"
                }
                icon={<HugeiconsIcon icon={SchoolIcon} />}
              />
              <DashboardStatCard
                label="Buổi học tuần này"
                value={weekSessions.data ? sessionsThisWeek.length : "—"}
                note={
                  weekSessions.data
                    ? `${sessionsThisWeek.filter((item) => item.status === "COMPLETED").length} buổi đã chốt điểm danh`
                    : "Chưa tải được lịch"
                }
                icon={<HugeiconsIcon icon={Calendar03Icon} />}
              />
            </div>
          )}
        </AsyncBoundary>
      )}

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Học phí theo tháng</CardTitle>
            <CardDescription>
              Học phí đã xác nhận, sáu tháng kết thúc trong kỳ đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {!rangeError && (
              <AsyncBoundary
                isLoading={analytics.isPending}
                isError={analytics.isError}
                error={analytics.error}
                onRetry={() => void analytics.refetch()}
                skeleton={<Skeleton className="h-52 rounded-xl" />}
              >
                <ColumnChart
                  ariaLabel="Học phí đã xác nhận theo tháng"
                  valueLabel="Học phí"
                  format={money}
                  data={trend.map((point) => ({
                    key: point.period,
                    label: monthLabel(point.period).short,
                    title: monthLabel(point.period).full,
                    value: point.confirmedRevenue,
                  }))}
                />
              </AsyncBoundary>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Học sinh theo khối</CardTitle>
            <CardDescription>Hồ sơ học sinh đang hoạt động.</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={students.isPending}
              isError={students.isError}
              error={students.error}
              onRetry={() => void students.refetch()}
              data={students.data}
              emptyProps={{ title: "Chưa có hồ sơ học sinh" }}
            >
              <HorizontalBars
                format={(value) => `${value} học sinh`}
                rows={[...byGrade.entries()]
                  .sort(([a], [b]) => a - b)
                  .map(([grade, count]) => ({
                    key: String(grade),
                    label: `Khối ${grade}`,
                    value: count,
                  }))}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Lấp chỗ theo lớp</CardTitle>
                <CardDescription>Học sinh đang học / sức chứa.</CardDescription>
              </div>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.MANAGER.CLASSES} />}
              >
                Lớp học
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={classes.isPending}
              isError={classes.isError}
              error={classes.error}
              onRetry={() => void classes.refetch()}
              data={fill}
              emptyProps={{ title: "Chưa có lớp đang hoạt động" }}
            >
              <HorizontalBars
                max={100}
                format={(value) => `${Math.round(value)}%`}
                rows={fill.slice(0, 8).map(({ item, ratio }) => ({
                  key: item.id,
                  label: item.name,
                  value: ratio * 100,
                  note: `${item.rosterCount}/${item.capacity}`,
                }))}
              />
              {fill.length > 8 && (
                <p className="pt-3 text-xs text-muted-foreground">
                  Hiện 8 lớp đầy nhất trên {fill.length} lớp.
                </p>
              )}
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Cần chú ý</CardTitle>
            <CardDescription>Bấm để mở màn xử lý.</CardDescription>
          </CardHeader>
          <CardContent>
            {attention.length ? (
              <ul className="divide-y divide-border">
                {attention.map((row) => (
                  <li key={row.key}>
                    <Link
                      href={row.href}
                      className="flex items-center justify-between gap-3 rounded-xl py-3 text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>{row.label}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant={row.count ? "warning" : "outline"}>
                          {row.count}
                        </Badge>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="size-4 text-muted-foreground"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {failedEmails.isPending || classes.isPending || units.isPending
                  ? "Đang tải…"
                  : "Chưa tải được số liệu cần chú ý."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Hoạt động gần đây</CardTitle>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.MANAGER.AUDIT_LOGS} />}
              >
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={activity.isPending}
              isError={activity.isError}
              error={activity.error}
              onRetry={() => void activity.refetch()}
              data={activity.data?.items}
              emptyProps={{ title: "Chưa có hoạt động" }}
            >
              <ol className="divide-y divide-border">
                {activity.data?.items.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="leading-5">
                        {auditActionLabel(item.action)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.actor?.displayName ??
                          item.actor?.email ??
                          "Hệ thống"}
                      </p>
                    </div>
                    <time
                      dateTime={item.createdAt}
                      className="shrink-0 text-xs text-muted-foreground tabular-nums"
                    >
                      {displayMoment(item.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Học phí theo kỳ đã chọn; số học sinh, lớp và tài khoản là số hiện tại.
      </p>
    </PageContainer>
  );
}
