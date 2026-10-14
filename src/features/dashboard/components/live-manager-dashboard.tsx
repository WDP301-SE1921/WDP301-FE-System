"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  ChartColumnIcon,
  Clock01Icon,
  Download01Icon,
  Invoice01Icon,
  Mortarboard01Icon,
  SchoolIcon,
  StarIcon,
  TeacherIcon,
  UserGroupIcon,
  Task01Icon,
  FlashIcon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { dateRangeSchema } from "@/lib/validators/web-workflows";
import { useCurrentTime } from "@/hooks/use-current-time";
import { auditActionLabel } from "@/constants/audit-events";
import { ROUTES } from "@/constants/routes";
import { dashboardApi } from "../api";
import { DashboardStatCard } from "./dashboard-stat-card";
import {
  ActivityChart,
  StudentDistributionChart,
  RevenueChart,
} from "./dashboard-charts";
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
function PanelTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: IconSvgElement;
}) {
  return (
    <CardTitle className="flex min-w-0 items-center gap-3 text-xl leading-6">
      <span className="dashboard-panel-icon flex size-9 shrink-0 items-center justify-center rounded-xl">
        <HugeiconsIcon icon={icon} className="size-5" />
      </span>
      {children}
    </CardTitle>
  );
}

export function LiveManagerDashboard() {
  const now = useCurrentTime();
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
  const activity = useLiveQuery(
    ["dashboard-activity", selectedFilters],
    (signal) =>
      directoryApi.auditLogs(
        {
          page: 1,
          limit: 100,
          from: selectedFilters.from,
          to: selectedFilters.to,
        },
        signal,
      ),
    range.success,
  );
  const sessions = useLiveQuery(["dashboard-sessions", today], (signal) =>
    academicApi.sessions({ fromDate: today, toDate: today }, signal),
  );
  const exportAction = useMutation({
    mutationFn: () => dashboardApi.export(selectedFilters),
  });
  const todaySessions = (sessions.data ?? [])
    .filter((item) => item.status !== "CANCELLED")
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const upcoming = todaySessions.find(
    (item) => Date.parse(item.startsAt) > now,
  );
  const cards = summary.data
    ? [
        {
          label: "Doanh thu học phí đã nhận",
          value: money(summary.data.tuition.confirmedAmount),
          note: "Học phí đã xác nhận trong kỳ",
          icon: UserGroupIcon,
          tone: "orange" as const,
          trend: analytics.data?.trend.map((point) => point.confirmedRevenue),
        },
        {
          label: "Khoản thu trong kỳ",
          value: summary.data.tuition.paymentCount,
          note: "Số lượt xác nhận thanh toán",
          icon: Calendar03Icon,
          tone: "amber" as const,
        },
        {
          label: "Học sinh đang học",
          value: summary.data.counts.studyingStudents,
          note: "Có ghi danh còn hiệu lực",
          icon: Mortarboard01Icon,
          tone: "green" as const,
        },
        {
          label: "Hồ sơ học sinh hoạt động",
          value: summary.data.counts.activeStudents,
          note: "Hồ sơ hiện tại của trung tâm",
          icon: StarIcon,
          tone: "purple" as const,
        },
        {
          label: "Giáo viên hoạt động",
          value: summary.data.counts.activeTeachers,
          note: "Tài khoản đang hoạt động",
          icon: TeacherIcon,
          tone: "teal" as const,
        },
        {
          label: "Lớp học đang mở",
          value:
            classes.data?.filter(
              (item) => item.isOpen && item.isActive !== false,
            ).length ?? "—",
          note: classes.isError
            ? "Chưa tải được lớp. Thử lại bên dưới."
            : "Lớp hoạt động, mở đăng ký",
          icon: SchoolIcon,
          tone: "blue" as const,
        },
      ]
    : [];

  return (
    <PageContainer
      maxWidth="full"
      className="dashboard-content space-y-4 lg:px-7 lg:pt-5"
    >
      <PageHeader
        title="Tổng quan hoạt động"
        description="Thống kê và tình hình hoạt động của trung tâm trong kỳ đã chọn"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-11 bg-card px-4"
                    leftIcon={
                      <HugeiconsIcon icon={Calendar03Icon} className="size-5" />
                    }
                    rightIcon={
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="ml-3 size-4"
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
              className="h-11 px-5"
              disabled={!range.success}
              isLoading={exportAction.isPending}
              onClick={() => exportAction.mutate()}
              leftIcon={
                <HugeiconsIcon icon={Download01Icon} className="size-5" />
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))}
            </div>
          }
        >
          <div
            data-dashboard-kpis
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {cards.map((card) => (
              <DashboardStatCard
                key={card.label}
                {...card}
                icon={<HugeiconsIcon icon={card.icon} />}
              />
            ))}
          </div>
        </AsyncBoundary>
      )}
      {classes.isError && (
        <AsyncBoundary
          isLoading={false}
          isError
          error={classes.error}
          onRetry={() => void classes.refetch()}
        >
          {null}
        </AsyncBoundary>
      )}
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Card className="min-w-0 gap-4 p-5">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <PanelTitle icon={ChartColumnIcon}>
              Doanh thu & Buổi học theo tháng
            </PanelTitle>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-chart-1" />
                Doanh thu (VND)
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-chart-2" />
                Buổi hoàn thành
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!rangeError && (
              <AsyncBoundary
                isLoading={analytics.isPending}
                isError={analytics.isError}
                error={analytics.error}
                onRetry={() => void analytics.refetch()}
                skeleton={<Skeleton className="h-52 rounded-xl" />}
              >
                {analytics.data && (
                  <RevenueChart points={analytics.data.trend} bucket="MONTH" />
                )}
              </AsyncBoundary>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-4 p-5">
          <CardHeader>
            <PanelTitle icon={UserGroupIcon}>
              Phân bố học sinh theo khối
            </PanelTitle>
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
              {students.data && (
                <StudentDistributionChart
                  students={students.data.filter(
                    (student) => student.status === "ACTIVE",
                  )}
                />
              )}
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="min-w-0 gap-4 p-5">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-xl">Hoạt động gần đây</CardTitle>
            <Button
              variant="link"
              size="xs"
              render={<Link href={ROUTES.MANAGER.AUDIT_LOGS} />}
              rightIcon={
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
              }
            >
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent>
            {!rangeError && (
              <AsyncBoundary
                isLoading={activity.isPending}
                isError={activity.isError}
                error={activity.error}
                onRetry={() => void activity.refetch()}
                data={activity.data?.items}
                emptyProps={{ title: "Chưa có hoạt động trong kỳ" }}
              >
                <ol className="divide-y divide-border">
                  {activity.data?.items.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 py-3 first:pt-0"
                    >
                      <span className="dashboard-panel-icon flex size-7 shrink-0 items-center justify-center rounded-full">
                        <HugeiconsIcon icon={Task01Icon} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-5">
                          {auditActionLabel(item.action)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.actor?.displayName ??
                            item.actor?.email ??
                            "Hệ thống"}
                        </p>
                      </div>
                      <time
                        dateTime={item.createdAt}
                        className="shrink-0 text-[10px] text-muted-foreground"
                      >
                        {displayMoment(item.createdAt)}
                      </time>
                    </li>
                  ))}
                </ol>
              </AsyncBoundary>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-4 p-5">
          <CardHeader>
            <PanelTitle icon={ChartColumnIcon}>
              Thống kê theo loại hoạt động
            </PanelTitle>
          </CardHeader>
          <CardContent>
            {!rangeError && (
              <AsyncBoundary
                isLoading={activity.isPending}
                isError={activity.isError}
                error={activity.error}
                onRetry={() => void activity.refetch()}
              >
                {activity.data && (
                  <ActivityChart
                    actions={activity.data.items.map((item) => item.action)}
                    total={activity.data.total}
                  />
                )}
              </AsyncBoundary>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-4 p-5">
          <CardHeader>
            <PanelTitle icon={FlashIcon}>Thông tin nhanh</PanelTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <AsyncBoundary
              isLoading={sessions.isPending}
              isError={sessions.isError}
              error={sessions.error}
              onRetry={() => void sessions.refetch()}
            >
              <dl className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-3">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      className="size-4 text-primary"
                    />
                    Lịch học hôm nay
                  </dt>
                  <dd className="font-semibold">{todaySessions.length} buổi</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-3">
                    <HugeiconsIcon
                      icon={Invoice01Icon}
                      className="size-4 text-primary"
                    />
                    Đã hoàn thành
                  </dt>
                  <dd className="font-semibold">
                    {
                      todaySessions.filter(
                        (session) => session.status === "COMPLETED",
                      ).length
                    }{" "}
                    buổi
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-3">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      className="size-4 text-primary"
                    />
                    Buổi học sắp tới
                  </dt>
                  <dd className="max-w-36 text-right">
                    <p className="font-semibold">
                      {upcoming
                        ? new Intl.DateTimeFormat("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(upcoming.startsAt))
                        : "Chưa có"}
                    </p>
                    {upcoming && (
                      <p className="truncate text-[10px] text-muted-foreground">
                        {upcoming.class.name}
                      </p>
                    )}
                  </dd>
                </div>
              </dl>
            </AsyncBoundary>
            <Button
              className="mt-auto w-full"
              render={
                <Link href={`${ROUTES.MANAGER.SCHEDULE}?date=${today}`} />
              }
              rightIcon={<HugeiconsIcon icon={ArrowRight01Icon} />}
            >
              Xem lịch chi tiết
            </Button>
          </CardContent>
        </Card>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Học phí theo kỳ đã chọn; hồ sơ và tài khoản là số hiện tại. Biểu đồ
        doanh thu/buổi hoàn thành hiển thị sáu tháng kết thúc trong kỳ.
      </p>
    </PageContainer>
  );
}
