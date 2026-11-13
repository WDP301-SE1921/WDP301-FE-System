"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Calendar03Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { dashboardApi } from "../api";
import {
  compareCounts,
  comparePoints,
  dailyTotals,
  elapsedEnd,
  expiringEnrollments,
  groupRevenue,
  makeupAging,
  previousRange,
  roomHeatmap,
  scoreText,
  sumAmount,
  toTenScale,
  toAmount,
  topPayers,
  WEEKDAY_LABELS,
} from "../metrics";
import { readPayments, vietnamDay } from "../staff-summary";
import { ColumnChart } from "./column-chart";
import {
  AttentionStrip,
  Initials,
  KpiCard,
  KpiRow,
  Panel,
  PanelError,
  RankList,
  percentText,
  shortMoney,
} from "./dashboard-ui";
import { RunningOutClassesCard } from "./running-out-classes-card";
import type { AnalyticsFilters } from "../types";

const dashboardRangeSchema = dateRangeSchema.refine(
  (value) =>
    Date.parse(value.toDate) - Date.parse(value.fromDate) < 366 * 86400000,
  { path: ["toDate"], message: "Chọn khoảng thống kê tối đa 366 ngày." },
);

/** Ngưỡng cảnh báo (canvas §2.1). */
const LOW_FILL = 0.5;
const LOW_ATTENDANCE = 85;
/** Lớp cần ít nhất chừng này lượt điểm danh thì mới xét chuyên cần thấp. */
const MIN_ATTENDANCE_BASE = 10;

const MIX = ["subject", "grade", "package", "class"] as const;
const RANK = ["fill", "attendance", "score", "revenue"] as const;
const WINDOW = ["7", "14", "30"] as const;
const VIEW = ["month", "day"] as const;

function monthEnd(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
function monthsBack(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 - months, 1)).toISOString().slice(0, 10);
}
function quarterStart(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, Math.floor((month - 1) / 3) * 3, 1))
    .toISOString()
    .slice(0, 10);
}
const dm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const filtersFor = (
  fromDate: string,
  toDate: string,
  bucket: AnalyticsFilters["bucket"],
): AnalyticsFilters => ({
  from: `${fromDate}T00:00:00.000+07:00`,
  to: `${toDate}T23:59:59.999+07:00`,
  bucket,
});

/** Dashboard Quản lý — canvas "Dashboard 4 vai trò", artboard Quản lý. Chỉ API có sẵn. */
export function LiveManagerDashboard() {
  const today = todayInVietnam();
  const [query, setQuery] = useQueryStates({
    fromDate: parseAsString.withDefault(`${today.slice(0, 8)}01`),
    toDate: parseAsString.withDefault(monthEnd(today)),
    view: parseAsStringLiteral(VIEW).withDefault("month"),
    mix: parseAsStringLiteral(MIX).withDefault("subject"),
    rank: parseAsStringLiteral(RANK).withDefault("fill"),
    expiring: parseAsStringLiteral(WINDOW).withDefault("7"),
  });
  const { fromDate, toDate } = query;
  const range = dashboardRangeSchema.safeParse({ fromDate, toDate });
  const rangeError = range.success ? undefined : range.error.issues[0]?.message;
  const ok = range.success;
  const endDay = elapsedEnd(toDate, today);
  const prev = previousRange(fromDate, endDay);
  const prevLabel = `${dm(prev.fromDate)}–${dm(prev.toDate)}`;
  const weekStart = calendarWeekStart(today);

  const summary = useLiveQuery(
    ["manager-dashboard", fromDate, toDate],
    (signal) => directoryApi.dashboard({ fromDate, toDate }, signal),
    ok,
  );
  const payments = useLiveQuery(
    ["manager-dashboard-payments", fromDate, endDay],
    (signal) => readPayments(fromDate, endDay, signal),
    ok && fromDate <= endDay,
  );
  const prevPayments = useLiveQuery(
    ["manager-dashboard-payments", prev.fromDate, prev.toDate],
    (signal) => readPayments(prev.fromDate, prev.toDate, signal),
    ok && fromDate <= endDay,
  );
  const analytics = useLiveQuery(
    ["manager-dashboard-analytics", fromDate, toDate],
    (signal) => dashboardApi.analytics(filtersFor(fromDate, toDate, "MONTH"), signal),
    ok,
  );
  const prevAnalytics = useLiveQuery(
    ["manager-dashboard-analytics", prev.fromDate, prev.toDate],
    (signal) =>
      dashboardApi.analytics(filtersFor(prev.fromDate, prev.toDate, "MONTH"), signal),
    ok && fromDate <= endDay,
  );
  const history = useLiveQuery(
    ["manager-dashboard-history", today.slice(0, 7)],
    (signal) =>
      dashboardApi.analytics(
        filtersFor(monthsBack(today, 11), monthEnd(today), "MONTH"),
        signal,
      ),
  );
  const classes = useLiveQuery(["dashboard-classes"], () => registrationApi.classes());
  const units = useLiveQuery(["dashboard-curriculum-units"], (signal) =>
    curriculumApi.units(undefined, signal),
  );
  const failedEmails = useLiveQuery(["dashboard-failed-emails"], (signal) =>
    academicApi.emailDeliveries(1, 1, signal, "FAILED"),
  );
  const activity = useLiveQuery(["dashboard-activity"], (signal) =>
    directoryApi.auditLogs({ page: 1, limit: 5 }, signal),
  );
  const enrollments = useLiveQuery(["dashboard-enrollments"], (signal) =>
    academicApi.enrollments(signal),
  );
  const rangeSessions = useLiveQuery(
    ["dashboard-range-sessions", fromDate, endDay],
    (signal) => academicApi.sessions({ fromDate, toDate: endDay }, signal),
    ok && fromDate <= endDay,
  );
  const weekSessions = useLiveQuery(["dashboard-sessions", weekStart], (signal) =>
    academicApi.sessions({ fromDate: weekStart, toDate: addCalendarDays(weekStart, 6) }, signal),
  );
  const rooms = useLiveQuery(["dashboard-rooms"], (signal) => registrationApi.rooms(signal));
  const makeups = useLiveQuery(["dashboard-makeups"], (signal) =>
    academicApi.recordedMakeupSources(undefined, signal),
  );
  const leaves = useLiveQuery(["dashboard-pending-leaves"], (signal) =>
    academicApi.leaves({ status: "PENDING" }, signal),
  );
  const exportAction = useMutation({
    mutationFn: () => dashboardApi.export(filtersFor(fromDate, toDate, "MONTH")),
  });

  // ---- Số liệu ----
  const items = payments.data?.items ?? [];
  const revenue = sumAmount(items);
  const prevRevenue = prevPayments.data ? sumAmount(prevPayments.data.items) : undefined;
  const attendanceNow = analytics.data?.summary.attendancePercent ?? null;
  const scoreNow = toTenScale(analytics.data?.summary.averageScore);
  const activeClasses = (classes.data ?? []).filter((item) => item.isActive !== false);
  const seats = activeClasses.reduce((sum, item) => sum + item.capacity, 0);
  const roster = activeClasses.reduce((sum, item) => sum + (item.rosterCount ?? 0), 0);
  const metricByClass = new Map(
    (analytics.data?.classes ?? []).map((metric) => [metric.classId, metric]),
  );
  const revenueByClass = new Map(
    groupRevenue(items, (item) => ({
      key: item.registrationOrder.class.id,
      label: item.registrationOrder.class.name,
    })).map((row) => [row.key, row.value]),
  );
  const classRows = activeClasses.map((item) => {
    const metric = metricByClass.get(item.id);
    const fill = item.capacity ? (item.rosterCount ?? 0) / item.capacity : 0;
    const attendance =
      metric && metric.attendanceRequired >= MIN_ATTENDANCE_BASE
        ? metric.attendancePercent
        : null;
    return {
      item,
      fill,
      attendance,
      score: toTenScale(metric?.averageScore),
      revenue: revenueByClass.get(item.id) ?? 0,
      lowFill: item.isOpen && fill < LOW_FILL,
      lowAttendance: attendance !== null && attendance < LOW_ATTENDANCE,
    };
  });
  const lowFillCount = classRows.filter((row) => row.lowFill).length;
  const lowAttendanceCount = classRows.filter((row) => row.lowAttendance).length;
  const windowDays = Number(query.expiring);
  const expiring =
    enrollments.data && classes.data
      ? expiringEnrollments(enrollments.data, classes.data, today, windowDays)
      : [];
  const expiring7 =
    enrollments.data && classes.data
      ? expiringEnrollments(enrollments.data, classes.data, today, 7).length
      : 0;
  const unassigned = activeClasses.filter((item) => !item.teacherId).length;
  const programsInUse = new Set(activeClasses.map((item) => item.programId));
  const withNextTerm = new Set(
    (units.data ?? [])
      .filter((unit) => unit.status !== "ARCHIVED" && unit.fromDate.slice(0, 10) > today)
      .map((unit) => unit.programId),
  );
  const missingNextTerm = [...programsInUse].filter((id) => !withNextTerm.has(id)).length;
  const awaitingApproval = (units.data ?? []).filter(
    (unit) => unit.status === "PENDING_REVIEW" && !!unit.technicalReviewedAt,
  ).length;

  const sessionsInRange = rangeSessions.data ?? [];
  const classTeacher = new Map(activeClasses.map((item) => [item.id, item.teacherId]));
  const teacherRows = (() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        classes: Set<string>;
        taught: number;
        substitute: number;
        required: number;
        satisfied: number;
        scoreSum: number;
        scoreCount: number;
        unpublished: number;
      }
    >();
    const row = (id: string, name: string) => {
      const existing = map.get(id);
      if (existing) return existing;
      const created = {
        id,
        name,
        classes: new Set<string>(),
        taught: 0,
        substitute: 0,
        required: 0,
        satisfied: 0,
        scoreSum: 0,
        scoreCount: 0,
        unpublished: 0,
      };
      map.set(id, created);
      return created;
    };
    for (const item of activeClasses) {
      if (!item.teacherId) continue;
      const target = row(item.teacherId, item.teacher?.displayName ?? item.teacher?.email ?? "Giáo viên");
      target.classes.add(item.id);
      const metric = metricByClass.get(item.id);
      if (metric) {
        target.required += metric.attendanceRequired;
        target.satisfied += metric.attendanceSatisfied;
        if (metric.averageScore !== null) {
          target.scoreSum += metric.averageScore * metric.publishedGrades;
          target.scoreCount += metric.publishedGrades;
        }
        target.unpublished += metric.unpublishedSubmissions;
      }
    }
    for (const session of sessionsInRange) {
      if (session.status !== "COMPLETED") continue;
      const target = row(session.teacherId, session.teacher?.displayName ?? "Giáo viên");
      target.taught += 1;
      if (classTeacher.get(session.classId) !== session.teacherId) target.substitute += 1;
    }
    return [...map.values()].sort((a, b) => b.taught - a.taught);
  })();

  const trend = history.data?.trend ?? [];
  const peak = trend.reduce<(typeof trend)[number] | null>(
    (best, point) => (!best || point.confirmedRevenue > best.confirmedRevenue ? point : best),
    null,
  );
  const low = trend
    // Bỏ tháng đang chạy và tháng chưa có thu (trung tâm chưa hoạt động) để "thấp nhất" có nghĩa.
    .filter((point) => point.period !== today.slice(0, 7) && point.confirmedRevenue > 0)
    .reduce<(typeof trend)[number] | null>(
      (best, point) => (!best || point.confirmedRevenue < best.confirmedRevenue ? point : best),
      null,
    );
  const days = Math.max(
    1,
    Math.round((Date.parse(endDay) - Date.parse(fromDate)) / 86400000) + 1,
  );
  const daily = dailyTotals(items, fromDate, days);

  const mixRows = groupRevenue(items, (item) => {
    const order = item.registrationOrder;
    if (query.mix === "subject")
      return order.class.program
        ? { key: order.class.program.subject, label: order.class.program.subject }
        : null;
    if (query.mix === "grade")
      return order.studentGrade
        ? { key: String(order.studentGrade), label: `Khối ${order.studentGrade}` }
        : null;
    if (query.mix === "package")
      return order.packageMonths
        ? { key: String(order.packageMonths), label: `Gói ${order.packageMonths} tháng` }
        : null;
    return { key: order.class.id, label: order.class.name };
  });
  const collectors = groupRevenue(items, (item) => ({
    key: item.confirmedByManager.id,
    label: item.confirmedByManager.displayName ?? item.confirmedByManager.email,
  }));
  const payers = topPayers(items);
  const todayCollected = new Map<string, number>();
  for (const item of items)
    if (vietnamDay(item.confirmedAt) === today)
      todayCollected.set(
        item.confirmedByManager.id,
        (todayCollected.get(item.confirmedByManager.id) ?? 0) + toAmount(item.amount),
      );

  const rankKey = query.rank;
  const sortedClasses = [...classRows]
    .filter((row) => (rankKey === "attendance" ? row.attendance !== null : rankKey === "score" ? row.score !== null : true))
    .sort((a, b) => {
      const pick = (row: (typeof classRows)[number]) =>
        rankKey === "fill" ? row.fill : rankKey === "attendance" ? (row.attendance ?? 0) : rankKey === "score" ? (row.score ?? 0) : row.revenue;
      return pick(b) - pick(a);
    });
  const topClasses = sortedClasses.length > 8 ? sortedClasses.slice(0, 4) : sortedClasses;
  const bottomClasses = sortedClasses.length > 8 ? sortedClasses.slice(-4) : [];
  const hiddenClasses = Math.max(0, sortedClasses.length - topClasses.length - bottomClasses.length);

  const activeRooms = (rooms.data ?? []).filter((room) => room.isActive !== false).length;
  const heat =
    weekSessions.data && classes.data
      ? roomHeatmap(weekSessions.data, classes.data, activeRooms)
      : [];
  const aging = makeups.data ? makeupAging(makeups.data, today) : [];
  const agingMax = Math.max(1, ...aging.map((bucket) => bucket.count));
  const cancelled = sessionsInRange.filter((session) => session.status === "CANCELLED").length;

  const setPreset = (from: string, to: string) => void setQuery({ fromDate: from, toDate: to });
  const presets = [
    { key: "today", label: "Hôm nay", from: today, to: today },
    { key: "7d", label: "7 ngày", from: addCalendarDays(today, -6), to: today },
    { key: "month", label: "Tháng này", from: `${today.slice(0, 8)}01`, to: monthEnd(today) },
    { key: "quarter", label: "Quý này", from: quarterStart(today), to: today },
  ];
  const activePreset = presets.find((preset) => preset.from === fromDate && preset.to === toDate)?.key ?? "custom";

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={activePreset}
              onValueChange={(value) => {
                const preset = presets.find((item) => item.key === value);
                if (preset) setPreset(preset.from, preset.to);
              }}
            >
              <TabsList aria-label="Kỳ thống kê">
                {presets.map((preset) => (
                  <TabsTrigger key={preset.key} value={preset.key}>
                    {preset.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    leftIcon={<HugeiconsIcon icon={Calendar03Icon} className="size-4" />}
                    rightIcon={<HugeiconsIcon icon={ArrowDown01Icon} className="ml-1 size-4" />}
                  />
                }
              >
                <span className="tabular-nums">
                  {fromDate.split("-").reverse().join("/")} – {toDate.split("-").reverse().join("/")}
                </span>
              </PopoverTrigger>
              <PopoverContent align="end" aria-label="Chọn kỳ thống kê" className="w-80 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-from">Từ ngày</Label>
                  <Input
                    id="dashboard-from"
                    type="date"
                    value={fromDate}
                    onChange={(event) => void setQuery({ fromDate: event.target.value })}
                    aria-invalid={!!rangeError}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-to">Đến ngày</Label>
                  <Input
                    id="dashboard-to"
                    type="date"
                    value={toDate}
                    onChange={(event) => void setQuery({ toDate: event.target.value })}
                    aria-invalid={!!rangeError}
                  />
                </div>
                {rangeError && (
                  <p className="text-sm text-destructive" role="alert">
                    {rangeError}
                  </p>
                )}
              </PopoverContent>
            </Popover>
            <Button
              disabled={!ok}
              isLoading={exportAction.isPending}
              onClick={() => exportAction.mutate()}
              leftIcon={<HugeiconsIcon icon={Download01Icon} className="size-4" />}
            >
              Xuất Excel
            </Button>
          </div>
        }
      />
      <ApiFeedback error={exportAction.error} />
      {rangeError && (
        <p className="text-sm text-destructive" role="alert">
          {rangeError}
        </p>
      )}

      <KpiRow>
        <KpiCard
          label="Doanh thu đã thu"
          tip={`Tổng biên lai đã xác nhận từ ${dm(fromDate)} đến ${dm(endDay)}, so với ${prevLabel}.`}
          value={shortMoney(revenue)}
          delta={prevRevenue === undefined ? undefined : compareCounts(revenue, prevRevenue, { smallBase: 1 })}
          base={prevRevenue === undefined ? undefined : `so ${prevLabel}`}
          sub={`${items.length} biên lai`}
          isLoading={payments.isPending}
          isError={payments.isError}
          onRetry={() => void payments.refetch()}
        />
        <KpiCard
          label="Học sinh đang học"
          tip="Học sinh có ghi danh còn hiệu lực hôm nay, trên tổng hồ sơ đang hoạt động. Số hiện tại, không theo kỳ."
          value={summary.data?.counts.studyingStudents ?? "—"}
          sub={summary.data ? `trên ${summary.data.counts.activeStudents} hồ sơ · hiện tại` : undefined}
          isLoading={summary.isPending}
          isError={summary.isError}
          onRetry={() => void summary.refetch()}
        />
        <KpiCard
          label="Chuyên cần"
          tip="Lượt có mặt hoặc nghỉ có phép trên lượt phải điểm danh của các buổi đã chốt trong kỳ."
          value={percentText(attendanceNow === null ? null : attendanceNow / 100, 1)}
          delta={comparePoints(analytics.data?.summary.attendancePercent, prevAnalytics.data?.summary.attendancePercent)}
          base={prevAnalytics.data ? `so ${prevLabel}` : undefined}
          isLoading={analytics.isPending}
          isError={analytics.isError}
          onRetry={() => void analytics.refetch()}
        />
        <KpiCard
          label="Lấp chỗ"
          tip="Học sinh đang trong danh sách lớp trên tổng sức chứa các lớp đang hoạt động. Số hiện tại."
          value={percentText(seats ? roster / seats : null)}
          sub={classes.data ? `${roster} / ${seats} chỗ · hiện tại` : undefined}
          isLoading={classes.isPending}
          isError={classes.isError}
          onRetry={() => void classes.refetch()}
        />
        <KpiCard
          label="Điểm trung bình"
          tip="Điểm trung bình các bài đã công bố trong kỳ."
          value={scoreText(scoreNow)}
          delta={comparePoints(scoreNow, toTenScale(prevAnalytics.data?.summary.averageScore), "")}
          sub={analytics.data ? `${analytics.data.summary.publishedGrades} bài đã công bố` : undefined}
          isLoading={analytics.isPending}
          isError={analytics.isError}
          onRetry={() => void analytics.refetch()}
        />
      </KpiRow>

      <AttentionStrip
        isLoading={classes.isPending || enrollments.isPending}
        items={[
          {
            key: "expiring",
            label: "gói hết hạn trong 7 ngày",
            count: expiring7,
            href: `${ROUTES.MANAGER.DASHBOARD}?expiring=7#goi-sap-het-han`,
            warn: expiring7 >= 10,
          },
          { key: "low-fill", label: "lớp lấp dưới 50%", count: lowFillCount, href: `${ROUTES.MANAGER.DASHBOARD}?rank=fill#xep-hang-lop`, warn: true },
          { key: "low-attendance", label: "lớp chuyên cần dưới 85%", count: lowAttendanceCount, href: `${ROUTES.MANAGER.DASHBOARD}?rank=attendance#xep-hang-lop`, warn: true },
          { key: "teachers", label: "lớp chưa có giáo viên", count: unassigned, href: ROUTES.MANAGER.CLASSES_UNASSIGNED, warn: true },
          { key: "emails", label: "email gửi lỗi", count: failedEmails.data?.total ?? 0, href: `${ROUTES.MANAGER.NOTIFICATIONS}?emailStatus=FAILED` },
          { key: "approval", label: "giáo trình chờ bạn duyệt", count: awaitingApproval, href: `${ROUTES.MANAGER.CURRICULUM}?tab=programs&programFilter=review` },
          { key: "next-term", label: "khóa chưa có giáo trình kỳ sau", count: units.data ? missingNextTerm : 0, href: `${ROUTES.MANAGER.CURRICULUM}?tab=programs` },
        ]}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Doanh thu"
          tip="Theo tháng: 12 tháng gần nhất, tháng đang chạy vẽ nét đứt. Theo ngày: các ngày trong kỳ đã chọn."
          actions={
            <>
              {query.view === "month" && peak && low && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Cao nhất T{Number(peak.period.slice(5, 7))} {shortMoney(peak.confirmedRevenue)} · Thấp nhất T
                  {Number(low.period.slice(5, 7))} {shortMoney(low.confirmedRevenue)}
                </span>
              )}
              <Tabs value={query.view} onValueChange={(value) => void setQuery({ view: value as (typeof VIEW)[number] })}>
                <TabsList aria-label="Kiểu xem doanh thu">
                  <TabsTrigger value="month">Tháng</TabsTrigger>
                  <TabsTrigger value="day">Ngày</TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          }
        >
          {query.view === "month" ? (
            history.isPending ? (
              <Skeleton className="h-52 rounded-xl" />
            ) : history.isError ? (
              <PanelError onRetry={() => void history.refetch()} />
            ) : (
              <ColumnChart
                ariaLabel="Doanh thu đã thu theo tháng, 12 tháng gần nhất"
                valueLabel="Doanh thu"
                format={money}
                partialKey={today.slice(0, 7)}
                data={trend.map((point) => ({
                  key: point.period,
                  label: `T${Number(point.period.slice(5, 7))}`,
                  title: `Tháng ${Number(point.period.slice(5, 7))}/${point.period.slice(0, 4)}${point.period === today.slice(0, 7) ? " (đang chạy)" : ""}`,
                  value: point.confirmedRevenue,
                }))}
              />
            )
          ) : payments.isPending ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : (
            <ColumnChart
              ariaLabel="Doanh thu đã thu theo ngày trong kỳ"
              valueLabel="Doanh thu"
              format={money}
              labelEvery={days > 16 ? 3 : days > 8 ? 2 : 1}
              data={daily.map((point) => ({
                key: point.day,
                label: dm(point.day),
                title: `Ngày ${point.day.split("-").reverse().join("/")}`,
                value: point.value,
              }))}
            />
          )}
        </Panel>
        <Panel
          title="Cơ cấu doanh thu"
          tip="Chia doanh thu của kỳ theo môn, khối của học sinh, gói tháng hoặc lớp."
          actions={
            <Tabs value={query.mix} onValueChange={(value) => void setQuery({ mix: value as (typeof MIX)[number] })}>
              <TabsList aria-label="Chia theo">
                <TabsTrigger value="subject">Môn</TabsTrigger>
                <TabsTrigger value="grade">Khối</TabsTrigger>
                <TabsTrigger value="package">Gói</TabsTrigger>
                <TabsTrigger value="class">Lớp</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {payments.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1">
              <RankList
                empty="Chưa có biên lai trong kỳ"
                rows={mixRows.slice(0, 12).map((row) => ({
                  key: row.key,
                  label: row.label,
                  value: `${shortMoney(row.value)} · ${percentText(row.share)}`,
                  pct: (row.value / (mixRows[0]?.value || 1)) * 100,
                  meta: `${row.count} biên lai`,
                }))}
              />
            </div>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Lịch sử thanh toán"
          tip="Biên lai đã xác nhận trong kỳ, mới nhất trước."
          actions={<span className="text-xs tabular-nums text-muted-foreground">{items.length} biên lai · {money(revenue)}</span>}
        >
          {payments.isPending ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : !items.length ? (
            <p className="text-sm text-muted-foreground">Chưa có biên lai trong kỳ</p>
          ) : (
            <div className="max-h-96 overflow-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian · biên lai</TableHead>
                    <TableHead>Học sinh · phụ huynh</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead className="text-right">Gói</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Nhân viên thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.slice(0, 50).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="block tabular-nums">{displayMoment(item.confirmedAt)}</span>
                        <span
                          className="block max-w-36 truncate text-xs tabular-nums text-muted-foreground"
                          title={item.receiptNumber}
                        >
                          {item.receiptNumber}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-56">
                        <span className="block truncate font-medium">{item.registrationOrder.studentFullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.registrationOrder.parentEmail}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">{item.registrationOrder.class.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.registrationOrder.packageMonths ? `${item.registrationOrder.packageMonths} th` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(item.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {item.confirmedByManager.displayName ?? item.confirmedByManager.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {items.length > 50 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Hiện 50 biên lai mới nhất; bản đầy đủ trong file Excel.
                </p>
              )}
            </div>
          )}
        </Panel>
        <Panel title="Phụ huynh đóng nhiều nhất" tip="Gộp theo email phụ huynh trên biên lai của kỳ.">
          {payments.isPending ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : !payers.length ? (
            <p className="text-sm text-muted-foreground">Chưa có biên lai trong kỳ</p>
          ) : (
            <ol className="space-y-3">
              {payers.map((payer, index) => (
                <li key={payer.email} className="flex items-center gap-3">
                  <span className="w-4 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                  <Initials name={payer.email} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{payer.email}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{shortMoney(payer.total)}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-1 rounded-full bg-primary" style={{ width: `${(payer.total / payers[0].total) * 100}%` }} />
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {payer.students} con · {payer.classes} lớp · {payer.receipts} biên lai · gần nhất {dm(vietnamDay(payer.lastAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div id="goi-sap-het-han" className="min-w-0 scroll-mt-24">
          <Panel
            title="Gói sắp hết hạn"
            tip="Ghi danh đang học có ngày kết thúc trong khoảng đã chọn và chưa có gói nối tiếp cùng lớp. Gia hạn dự kiến = học phí tháng của lớp × số tháng gói cũ."
            actions={
              <Tabs value={query.expiring} onValueChange={(value) => void setQuery({ expiring: value as (typeof WINDOW)[number] })}>
                <TabsList aria-label="Trong vòng">
                  <TabsTrigger value="7">7 ngày</TabsTrigger>
                  <TabsTrigger value="14">14 ngày</TabsTrigger>
                  <TabsTrigger value="30">30 ngày</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            {enrollments.isPending || classes.isPending ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : enrollments.isError ? (
              <PanelError onRetry={() => void enrollments.refetch()} />
            ) : (
              <>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Học sinh</p>
                    <p className="text-xl font-semibold tabular-nums">{expiring.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gia hạn dự kiến</p>
                    <p className="text-xl font-semibold tabular-nums">
                      {shortMoney(expiring.reduce((sum, row) => sum + (row.estimate ?? 0), 0))}
                    </p>
                  </div>
                </div>
                {expiring.length ? (
                  <div className="max-h-80 overflow-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Học sinh</TableHead>
                          <TableHead>Lớp</TableHead>
                          <TableHead>Hết hạn</TableHead>
                          <TableHead className="text-right">Gói</TableHead>
                          <TableHead className="text-right">Gia hạn dự kiến</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiring.map((row) => (
                          <TableRow key={row.enrollment.id}>
                            <TableCell className="font-medium">{row.enrollment.studentProfile?.fullName ?? "Học sinh"}</TableCell>
                            <TableCell>{row.enrollment.class.name}</TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {dm(row.endDate)}{" "}
                              <Badge variant={row.daysLeft <= 3 ? "warning" : "neutral"}>
                                {row.daysLeft === 0 ? "hôm nay" : `còn ${row.daysLeft} ngày`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.enrollment.packageMonths} th</TableCell>
                            <TableCell className="text-right tabular-nums">{row.estimate === null ? "—" : money(row.estimate)}</TableCell>
                            <TableCell className="text-right">
                              {row.enrollment.studentProfile && (
                                <Button size="xs" variant="outline" render={<Link href={ROUTES.MANAGER.STUDENT_DETAIL(row.enrollment.studentProfile.id)} />}>
                                  Hồ sơ
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có gói hết hạn trong {windowDays} ngày tới</p>
                )}
              </>
            )}
          </Panel>
        </div>
        <Panel title="Thu theo nhân viên" tip="Biên lai trong kỳ theo người xác nhận thu.">
          {payments.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : (
            <>
              <RankList
                empty="Chưa có biên lai trong kỳ"
                rows={collectors.map((row) => ({
                  key: row.key,
                  label: row.label,
                  value: shortMoney(row.value),
                  pct: (row.value / (collectors[0]?.value || 1)) * 100,
                  meta: `${row.count} biên lai · hôm nay ${shortMoney(todayCollected.get(row.key) ?? 0)}`,
                }))}
              />
              {!!items.length && (
                <p className="border-t border-border pt-3 text-xs tabular-nums text-muted-foreground">
                  Trung bình {shortMoney(revenue / items.length)} / biên lai
                </p>
              )}
            </>
          )}
        </Panel>
      </div>

      <div id="xep-hang-lop" className="min-w-0 scroll-mt-24">
        <Panel
          title="Xếp hạng lớp"
          tip="Lấp chỗ là số hiện tại; chuyên cần, điểm và doanh thu theo kỳ. Chuyên cần chỉ xét lớp có từ 10 lượt điểm danh."
          actions={
            <Tabs value={query.rank} onValueChange={(value) => void setQuery({ rank: value as (typeof RANK)[number] })}>
              <TabsList aria-label="Xếp theo">
                <TabsTrigger value="fill">Lấp chỗ</TabsTrigger>
                <TabsTrigger value="attendance">Chuyên cần</TabsTrigger>
                <TabsTrigger value="score">Điểm TB</TabsTrigger>
                <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {classes.isPending ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : classes.isError ? (
            <PanelError onRetry={() => void classes.refetch()} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead className="w-56">Lấp chỗ</TableHead>
                    <TableHead className="text-right">Chuyên cần</TableHead>
                    <TableHead className="text-right">Điểm TB</TableHead>
                    <TableHead className="text-right">Doanh thu kỳ</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: bottomClasses.length ? "Cao nhất" : null, rows: topClasses },
                    { label: bottomClasses.length ? `Thấp nhất · ${hiddenClasses} lớp ở giữa ẩn` : null, rows: bottomClasses },
                  ].flatMap((group) => [
                    ...(group.label && group.rows.length
                      ? [
                          <TableRow key={group.label} className="hover:bg-transparent">
                            <TableCell colSpan={7} className="pt-3 text-xs font-medium text-muted-foreground">
                              {group.label}
                            </TableCell>
                          </TableRow>,
                        ]
                      : []),
                    ...group.rows.map((row) => (
                      <TableRow key={row.item.id}>
                        <TableCell className="font-medium">
                          <Link href={ROUTES.MANAGER.CLASS_DETAIL(row.item.id)} className="hover:text-primary">
                            {row.item.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.item.teacher?.displayName ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                              <div
                                className={cn("h-1.5 rounded-full", row.lowFill ? "bg-amber-500" : "bg-primary")}
                                style={{ width: `${Math.min(100, row.fill * 100)}%` }}
                              />
                            </div>
                            <span className="w-24 text-right text-xs tabular-nums">
                              {percentText(row.fill)} · {row.item.rosterCount ?? 0}/{row.item.capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            row.lowAttendance && "font-semibold text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {row.attendance === null ? "—" : percentText(row.attendance / 100, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {scoreText(row.score)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.revenue ? shortMoney(row.revenue) : "—"}</TableCell>
                        <TableCell>
                          {(row.lowFill || row.lowAttendance) && (
                            <Badge variant="warning">
                              {row.lowFill && row.lowAttendance ? "Lấp + chuyên cần" : row.lowFill ? "Lấp < 50%" : "Chuyên cần < 85%"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )),
                  ])}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      </div>

      <RunningOutClassesCard classes={classes} units={units} today={today} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Giáo viên"
          tip="Buổi đã dạy = buổi đã chốt điểm danh trong kỳ do giáo viên đó dạy; dạy thay = buổi của lớp người khác. Chuyên cần và điểm theo các lớp đang phụ trách."
        >
          {classes.isPending || rangeSessions.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : classes.isError || rangeSessions.isError ? (
            <PanelError onRetry={() => void Promise.all([classes.refetch(), rangeSessions.refetch()])} />
          ) : (
            <div className="max-h-96 overflow-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead className="text-right">Lớp</TableHead>
                    <TableHead className="text-right">Buổi đã dạy</TableHead>
                    <TableHead className="text-right">Dạy thay</TableHead>
                    <TableHead className="text-right">Chuyên cần lớp</TableHead>
                    <TableHead className="text-right">Điểm TB</TableHead>
                    <TableHead className="text-right">Bài chưa công bố</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherRows.map((row) => {
                    const attendance = row.required >= MIN_ATTENDANCE_BASE ? (row.satisfied / row.required) * 100 : null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link href={ROUTES.MANAGER.TEACHER_DETAIL(row.id)} className="flex items-center gap-2 font-medium hover:text-primary">
                            <Initials name={row.name} />
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.classes.size}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.taught}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.substitute}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            attendance !== null && attendance < LOW_ATTENDANCE && "font-semibold text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {attendance === null ? "—" : percentText(attendance / 100, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {scoreText(row.scoreCount ? row.scoreSum / row.scoreCount / 10 : null)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.unpublished}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
        <Panel title="Phòng theo khung giờ" tip="Tuần này: số phòng có buổi học trên tổng phòng đang dùng, theo thứ và giờ bắt đầu. Phòng lấy theo lớp.">
          {weekSessions.isPending || rooms.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : weekSessions.isError || rooms.isError ? (
            <PanelError onRetry={() => void Promise.all([weekSessions.refetch(), rooms.refetch()])} />
          ) : !heat.length ? (
            <p className="text-sm text-muted-foreground">Tuần này chưa có buổi học</p>
          ) : (
            <>
              <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] gap-1 text-xs" role="table" aria-label="Mức dùng phòng theo khung giờ">
                <span />
                {WEEKDAY_LABELS.map((day) => (
                  <span key={day} className="text-center text-muted-foreground">
                    {day}
                  </span>
                ))}
                {heat.flatMap((row) => [
                  <span key={row.slot} className="flex items-center tabular-nums text-muted-foreground">
                    {row.slot}
                  </span>,
                  ...row.values.map((value, index) => (
                    <span
                      key={`${row.slot}-${index}`}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg tabular-nums",
                        value === null
                          ? "bg-muted/50 text-muted-foreground"
                          : value >= 1
                            ? "bg-primary font-semibold text-primary-foreground"
                            : value >= 0.75
                              ? "bg-primary/60 font-medium text-foreground"
                              : value >= 0.45
                                ? "bg-primary/25"
                                : "bg-primary/10",
                      )}
                      title={value === null ? "Không có buổi" : `${Math.round(value * 100)}% phòng`}
                    >
                      {value === null ? "—" : value >= 1 ? "đầy" : `${Math.round(value * 100)}%`}
                    </span>
                  )),
                ])}
              </div>
              <p className="text-xs text-muted-foreground">{activeRooms} phòng đang dùng · ô đầy = hết phòng trống</p>
            </>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <Panel title="Học bù chờ xếp" tip="Buổi vắng đã ghi nhận chưa có buổi học bù, chia theo số ngày đã chờ kể từ buổi vắng.">
          {makeups.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : makeups.isError ? (
            <PanelError onRetry={() => void makeups.refetch()} />
          ) : (
            <>
              <p className="text-xl font-semibold tabular-nums">{makeups.data?.length ?? 0}</p>
              <RankList
                rows={aging.map((bucket) => ({
                  key: bucket.key,
                  label: bucket.label,
                  value: String(bucket.count),
                  pct: (bucket.count / agingMax) * 100,
                  warn: bucket.key === "15+" && bucket.count > 0,
                }))}
              />
            </>
          )}
        </Panel>
        <Panel title="Nghỉ & hủy buổi" tip="Đơn nghỉ đang chờ duyệt (hiện tại) và buổi bị hủy trong kỳ.">
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt>Đơn nghỉ chờ duyệt</dt>
              <dd className="font-semibold tabular-nums">{leaves.isPending ? "…" : leaves.isError ? "—" : (leaves.data?.length ?? 0)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt>Buổi hủy trong kỳ</dt>
              <dd className="font-semibold tabular-nums">{rangeSessions.isPending ? "…" : rangeSessions.isError ? "—" : cancelled}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt>Buổi đã chốt trong kỳ</dt>
              <dd className="font-semibold tabular-nums">
                {rangeSessions.isPending ? "…" : rangeSessions.isError ? "—" : sessionsInRange.filter((session) => session.status === "COMPLETED").length}
              </dd>
            </div>
          </dl>
          <Button variant="link" size="sm" className="self-start px-0" render={<Link href={ROUTES.MANAGER.SESSIONS} />}>
            Mở lịch buổi học
          </Button>
        </Panel>
        <Panel
          title="Hoạt động gần đây"
          actions={
            <Button variant="link" size="sm" render={<Link href={ROUTES.MANAGER.AUDIT_LOGS} />}>
              Xem tất cả
            </Button>
          }
        >
          {activity.isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : activity.isError ? (
            <PanelError onRetry={() => void activity.refetch()} />
          ) : (
            <ol className="divide-y divide-border">
              {activity.data?.items.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0 text-sm">
                    <p className="leading-5">{auditActionLabel(item.action)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.actor?.displayName ?? item.actor?.email ?? "Hệ thống"}
                    </p>
                  </div>
                  <time dateTime={item.createdAt} className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {displayMoment(item.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </PageContainer>
  );
}
