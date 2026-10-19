"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Invoice01Icon,
  MoneyReceive01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { registrationApi } from "@/features/registration-flow/api";
import { money } from "@/features/registration-flow/calendar";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";
import {
  readPayments,
  readPendingRegistrations,
  vietnamDay,
} from "../staff-summary";
import { DashboardStatCard } from "./dashboard-stat-card";
import { ColumnChart, HorizontalBars } from "./column-chart";

const CHART_DAYS = 14;

/**
 * Dashboard Nhân viên: việc cần làm trong ngày. Chỉ đọc từ API Nhân viên được gọi
 * (đăng ký, biên lai, buổi học, học bù chờ xếp, lớp); không dùng `academic/analytics`.
 */
export function LiveStaffDashboard() {
  const today = todayInVietnam();
  const from = addCalendarDays(today, -(CHART_DAYS - 1));
  const pending = useLiveQuery(["staff-dashboard", "pending"], (signal) =>
    readPendingRegistrations(signal),
  );
  const payments = useLiveQuery(
    ["staff-dashboard", "payments", from, today],
    (signal) => readPayments(from, today, signal),
  );
  const sessions = useLiveQuery(
    ["staff-dashboard", "sessions", today],
    (signal) => academicApi.sessions({ fromDate: today, toDate: today }, signal),
  );
  // Chỉ buổi vắng đã ghi nhận (buổi đã chốt), không tính buổi tương lai được xếp bù trước.
  const makeups = useLiveQuery(["staff-dashboard", "makeups"], (signal) =>
    academicApi.recordedMakeupSources(undefined, signal),
  );
  const makeupCount = makeups.data?.length;
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });

  const todayPayments = (payments.data?.items ?? []).filter(
    (item) => vietnamDay(item.confirmedAt) === today,
  );
  const byDay = new Map<string, number>();
  for (const item of payments.data?.items ?? []) {
    const day = vietnamDay(item.confirmedAt);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(item.amount));
  }
  const days = Array.from({ length: CHART_DAYS }, (_, index) =>
    addCalendarDays(from, index),
  );
  const activeSessions = (sessions.data ?? []).filter(
    (session) => session.status !== "CANCELLED",
  );
  const openSeats = (classes.data ?? [])
    .filter((item) => item.isActive !== false && item.isOpen)
    .map((item) => ({
      item,
      free: Math.max(0, item.capacity - (item.rosterCount ?? 0)),
    }))
    .filter(({ free }) => free > 0)
    .sort((a, b) => b.free - a.free)
    .slice(0, 8);
  const stat = (value: number | undefined, isPending: boolean) =>
    isPending ? "…" : value === undefined ? "—" : value;

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Dashboard"
        description="Việc trong ngày: đơn chờ thu phí, biên lai hôm nay, buổi học và học bù cần xếp."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Đơn chờ thu phí"
          value={stat(pending.data?.count, pending.isPending)}
          note={
            pending.data
              ? `Dự kiến ${money(pending.data.amount)}`
              : "Đơn đăng ký chưa thu tiền"
          }
          icon={<HugeiconsIcon icon={Invoice01Icon} />}
        />
        <DashboardStatCard
          label="Đã thu hôm nay"
          value={
            payments.isPending
              ? "…"
              : payments.data
                ? money(
                    todayPayments.reduce(
                      (sum, item) => sum + Number(item.amount),
                      0,
                    ),
                  )
                : "—"
          }
          note={`${todayPayments.length} biên lai`}
          icon={<HugeiconsIcon icon={MoneyReceive01Icon} />}
        />
        <DashboardStatCard
          label="Chờ xếp học bù"
          value={makeups.isPending ? "…" : (makeupCount ?? "—")}
          note="Buổi vắng chưa có buổi học bù"
          icon={<HugeiconsIcon icon={RepeatIcon} />}
        />
        <DashboardStatCard
          label="Buổi học hôm nay"
          value={stat(
            sessions.data ? activeSessions.length : undefined,
            sessions.isPending,
          )}
          note={
            sessions.data
              ? `${activeSessions.filter((s) => s.status === "COMPLETED").length} đã chốt điểm danh`
              : "Theo lịch các lớp"
          }
          icon={<HugeiconsIcon icon={Calendar03Icon} />}
        />
      </div>
      <ApiFeedback error={pending.error ?? payments.error} />

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Đơn chờ thu phí</CardTitle>
                <CardDescription>5 đơn mới nhất chưa thu tiền.</CardDescription>
              </div>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.STAFF.PAYMENTS} />}
              >
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            <AsyncBoundary
              isLoading={pending.isPending}
              isError={pending.isError}
              error={pending.error}
              onRetry={() => void pending.refetch()}
              data={pending.data?.items}
              emptyProps={{ title: "Không có đơn chờ thu" }}
            >
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Lớp</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.data?.items.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.studentFullName}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {order.parentEmail}
                          </span>
                        </TableCell>
                        <TableCell>{order.class?.name ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money(order.quotedAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            render={
                              <Link
                                href={`${ROUTES.STAFF.PAYMENTS}?${new URLSearchParams({ registrationId: order.id })}`}
                              />
                            }
                          >
                            Thu phí
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
            <CardTitle>Học phí thu {CHART_DAYS} ngày</CardTitle>
            <CardDescription>
              Tổng {payments.data ? money(payments.data.totalAmount) : "…"} từ
              biên lai đã xác nhận.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <AsyncBoundary
              isLoading={payments.isPending}
              isError={payments.isError}
              error={payments.error}
              onRetry={() => void payments.refetch()}
            >
              <ColumnChart
                ariaLabel={`Học phí thu theo ngày, ${CHART_DAYS} ngày gần nhất`}
                valueLabel="Học phí"
                format={money}
                labelEvery={2}
                data={days.map((day) => ({
                  key: day,
                  label: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
                  title: `Ngày ${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`,
                  value: byDay.get(day) ?? 0,
                }))}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Học bù chờ xếp</CardTitle>
                <CardDescription>Buổi vắng chưa có buổi học bù.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3">
            <AsyncBoundary
              isLoading={makeups.isPending}
              isError={makeups.isError}
              error={makeups.error}
              onRetry={() => void makeups.refetch()}
              data={makeups.data}
              emptyProps={{ title: "Không có buổi chờ học bù" }}
            >
              <ul className="divide-y divide-border">
                {makeups.data?.slice(0, 5).map((source) => (
                  <li
                    key={source.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">
                        {source.enrollment.studentProfile?.fullName ??
                          "Học sinh"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {source.session.class.name} ·{" "}
                        {displayMoment(source.session.startsAt)}
                      </p>
                    </div>
                    {source.enrollment.studentProfile && (
                      <Button
                        size="xs"
                        variant="outline"
                        render={
                          <Link
                            href={ROUTES.STAFF.STUDENT_ACTION({
                              studentId: source.enrollment.studentProfile.id,
                              action: "makeup",
                              sessionId: source.session.id,
                            })}
                          />
                        }
                      >
                        Xếp học bù
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {(makeups.data?.length ?? 0) > 5 && (
                <p className="text-xs text-muted-foreground">
                  Tổng {makeupCount} buổi chờ xếp.{" "}
                  <Link
                    href={`${ROUTES.STAFF.STUDENTS}?quick=pending-makeup`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Xem theo học sinh
                  </Link>
                </p>
              )}
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Chỗ trống theo lớp</CardTitle>
                <CardDescription>
                  Lớp đang mở đăng ký còn nhiều chỗ nhất, để tư vấn phụ huynh.
                </CardDescription>
              </div>
              <Button
                variant="link"
                size="sm"
                render={<Link href={ROUTES.STAFF.CLASSES} />}
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
              data={openSeats}
              emptyProps={{ title: "Không còn lớp trống chỗ" }}
            >
              <HorizontalBars
                format={(value) => `${value} chỗ trống`}
                rows={openSeats.map(({ item, free }) => ({
                  key: item.id,
                  label: item.name,
                  value: free,
                  note: `${item.rosterCount ?? 0}/${item.capacity}`,
                }))}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
