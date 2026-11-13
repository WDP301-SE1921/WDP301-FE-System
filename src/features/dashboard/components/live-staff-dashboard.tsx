"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ROUTES } from "@/constants/routes";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { registrationApi } from "@/features/registration-flow/api";
import { money } from "@/features/registration-flow/calendar";
import { useCurrentUser } from "@/hooks/use-current-role";
import { useCurrentTime } from "@/hooks/use-current-time";
import { addCalendarDays, todayInVietnam } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import {
  compareCounts,
  dailyTotals,
  expiringEnrollments,
  makeupAge,
  makeupAging,
  toAmount,
} from "../metrics";
import { readPayments, readPendingRegistrations, vietnamDay } from "../staff-summary";
import { ColumnChart } from "./column-chart";
import {
  KpiCard,
  KpiRow,
  Panel,
  PanelError,
  RankList,
  shortMoney,
} from "./dashboard-ui";

const CHART_DAYS = 14;
/** Đơn chờ thu quá số ngày này thì tô cam. */
const STALE_ORDER_DAYS = 3;
const STALE_MAKEUP_DAYS = 14;
const QUEUE = ["pending", "makeup", "leave", "expiring"] as const;
const clock = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const daysBetween = (from: string, to: string) =>
  Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86400000));
const dm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * Dashboard Nhân viên — canvas "Dashboard 4 vai trò", artboard Nhân viên.
 * Chỉ đọc API Nhân viên được gọi (đăng ký, biên lai, ghi danh, buổi học, học bù, đơn nghỉ, lớp);
 * không dùng `academic/analytics`.
 */
export function LiveStaffDashboard() {
  const user = useCurrentUser();
  const now = useCurrentTime();
  const today = todayInVietnam();
  const from = addCalendarDays(today, -(CHART_DAYS - 1));
  const [{ queue, subject }, setQuery] = useQueryStates({
    queue: parseAsStringLiteral(QUEUE).withDefault("pending"),
    subject: parseAsString.withDefault("all"),
  });
  const pending = useLiveQuery(["staff-dashboard", "pending"], (signal) =>
    readPendingRegistrations(signal),
  );
  const payments = useLiveQuery(["staff-dashboard", "payments", from, today], (signal) =>
    readPayments(from, today, signal),
  );
  const sessions = useLiveQuery(["staff-dashboard", "sessions", today], (signal) =>
    academicApi.sessions({ fromDate: today, toDate: today }, signal),
  );
  // Chỉ buổi vắng đã ghi nhận (buổi đã chốt), không tính buổi tương lai được xếp bù trước.
  const makeups = useLiveQuery(["staff-dashboard", "makeups"], (signal) =>
    academicApi.recordedMakeupSources(undefined, signal),
  );
  const leaves = useLiveQuery(["staff-dashboard", "leaves"], (signal) =>
    academicApi.leaves({ status: "PENDING" }, signal),
  );
  const enrollments = useLiveQuery(["staff-dashboard", "enrollments"], (signal) =>
    academicApi.enrollments(signal),
  );
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });

  // ---- Số liệu ----
  const orders = [...(pending.data?.items ?? [])].sort((a, b) =>
    (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  );
  const oldestOrderDays = orders[0]?.createdAt ? daysBetween(orders[0].createdAt, new Date(now).toISOString()) : null;
  const mine = (payments.data?.items ?? []).filter((item) => item.confirmedByManager.id === user?.id);
  const myDaily = dailyTotals(mine, from, CHART_DAYS);
  const myToday = myDaily.at(-1)?.value ?? 0;
  const lastWeek = myDaily.slice(-8, -1).filter((day) => day.value > 0);
  const myAverage = lastWeek.length
    ? lastWeek.reduce((sum, day) => sum + day.value, 0) / lastWeek.length
    : null;
  const myTodayReceipts = mine.filter((item) => vietnamDay(item.confirmedAt) === today);
  const sources = [...(makeups.data ?? [])].sort((a, b) =>
    a.session.startsAt.localeCompare(b.session.startsAt),
  );
  const aging = makeups.data ? makeupAging(makeups.data, today) : [];
  const agingMax = Math.max(1, ...aging.map((bucket) => bucket.count));
  const staleMakeups = sources.filter((source) => makeupAge(source, today) > STALE_MAKEUP_DAYS).length;
  const expiring =
    enrollments.data && classes.data
      ? expiringEnrollments(enrollments.data, classes.data, today, 7)
      : [];
  const todaySessions = (sessions.data ?? [])
    .filter((session) => session.status !== "CANCELLED")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const slots = new Map<string, typeof todaySessions>();
  for (const session of todaySessions) {
    const key = `${clock.format(new Date(session.startsAt))}–${clock.format(new Date(session.endsAt))}`;
    slots.set(key, [...(slots.get(key) ?? []), session]);
  }
  const subjects = [
    ...new Set((classes.data ?? []).map((item) => item.program.subject).filter(Boolean)),
  ].sort();
  const openSeats = (classes.data ?? [])
    .filter((item) => item.isActive !== false && item.isOpen)
    .filter((item) => subject === "all" || item.program.subject === subject)
    .map((item) => ({
      item,
      filled: item.rosterCount ?? 0,
      free: Math.max(0, item.capacity - (item.rosterCount ?? 0)),
    }))
    .filter(({ free }) => free > 0)
    .sort((a, b) => b.free - a.free)
    .slice(0, 6);

  const queueCount = {
    pending: pending.data?.count,
    makeup: makeups.data?.length,
    leave: leaves.data?.length,
    expiring: enrollments.data && classes.data ? expiring.length : undefined,
  };

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Việc hôm nay"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" render={<Link href={`${ROUTES.STAFF.STUDENTS}?quick=pending-makeup`} />}>
              Xếp học bù
            </Button>
            <Button render={<Link href={ROUTES.STAFF.ENROLLMENT_NEW} />}>Đăng ký mới</Button>
          </div>
        }
      />

      <KpiRow>
        <KpiCard
          label="Chờ thu phí"
          tip="Đơn đăng ký chưa thu tiền của cả trung tâm và tổng tiền dự kiến."
          value={pending.data?.count ?? "—"}
          sub={
            pending.data
              ? `${money(pending.data.amount)}${oldestOrderDays === null ? "" : ` · cũ nhất ${oldestOrderDays} ngày`}`
              : undefined
          }
          warn={oldestOrderDays !== null && oldestOrderDays > STALE_ORDER_DAYS}
          isLoading={pending.isPending}
          isError={pending.isError}
          onRetry={() => void pending.refetch()}
        />
        <KpiCard
          label="Tôi đã thu hôm nay"
          tip="Biên lai bạn xác nhận hôm nay, so với trung bình các ngày có thu trong 7 ngày trước."
          value={shortMoney(myToday)}
          delta={myAverage === null ? undefined : compareCounts(myToday, myAverage, { smallBase: 1 })}
          base={myAverage === null ? undefined : `TB 7 ngày ${shortMoney(myAverage)}`}
          sub={`${myTodayReceipts.length} biên lai`}
          isLoading={payments.isPending}
          isError={payments.isError}
          onRetry={() => void payments.refetch()}
        />
        <KpiCard
          label="Học bù chờ xếp"
          tip="Buổi vắng đã ghi nhận chưa có buổi học bù."
          value={makeups.data?.length ?? "—"}
          sub={makeups.data ? `${staleMakeups} chờ quá ${STALE_MAKEUP_DAYS} ngày` : undefined}
          warn={staleMakeups > 0}
          isLoading={makeups.isPending}
          isError={makeups.isError}
          onRetry={() => void makeups.refetch()}
        />
        <KpiCard
          label="Đơn nghỉ chờ duyệt"
          tip="Đơn xin nghỉ của phụ huynh đang chờ xử lý."
          value={leaves.data?.length ?? "—"}
          isLoading={leaves.isPending}
          isError={leaves.isError}
          onRetry={() => void leaves.refetch()}
        />
        <KpiCard
          label="Gói hết hạn 7 ngày"
          tip="Ghi danh đang học hết hạn trong 7 ngày tới và chưa có gói nối tiếp cùng lớp."
          value={queueCount.expiring ?? "—"}
          sub={
            expiring.length
              ? `gia hạn dự kiến ${shortMoney(expiring.reduce((sum, row) => sum + (row.estimate ?? 0), 0))}`
              : undefined
          }
          isLoading={enrollments.isPending || classes.isPending}
          isError={enrollments.isError || classes.isError}
          onRetry={() => void Promise.all([enrollments.refetch(), classes.refetch()])}
        />
      </KpiRow>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Hàng việc" tip="Sắp theo thời gian chờ, việc chờ lâu nhất ở trên.">
          <Tabs value={queue} onValueChange={(value) => void setQuery({ queue: value as (typeof QUEUE)[number] })}>
            <TabsList aria-label="Loại việc" className="flex-wrap">
              {(
                [
                  ["pending", "Chờ thu"],
                  ["makeup", "Chờ xếp bù"],
                  ["leave", "Chờ duyệt nghỉ"],
                  ["expiring", "Sắp hết hạn"],
                ] as const
              ).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  {label}
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{queueCount[key] ?? "…"}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="max-h-112 overflow-auto rounded-xl border border-border">
            {queue === "pending" &&
              (pending.isPending ? (
                <Skeleton className="m-3 h-40 rounded-xl" />
              ) : pending.isError ? (
                <PanelError onRetry={() => void pending.refetch()} />
              ) : !orders.length ? (
                <p className="p-4 text-sm text-muted-foreground">Không có đơn chờ thu</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Lớp</TableHead>
                      <TableHead className="text-right">Gói</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Đã chờ</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const age = order.createdAt ? daysBetween(order.createdAt, new Date(now).toISOString()) : null;
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.studentFullName}
                            <span className="block text-xs font-normal text-muted-foreground">{order.parentEmail}</span>
                          </TableCell>
                          <TableCell>{order.class?.name ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{order.packageMonths} th</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{money(order.quotedAmount)}</TableCell>
                          <TableCell>
                            {age === null ? (
                              "—"
                            ) : (
                              <Badge variant={age > STALE_ORDER_DAYS ? "warning" : "neutral"}>
                                {age === 0 ? "Hôm nay" : `${age} ngày`}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="xs"
                              // Mở thẳng bước "Thu học phí" của wizard ghi danh (Luồng 3).
                              render={<Link href={`${ROUTES.STAFF.ENROLLMENT_NEW}?${new URLSearchParams({ registrationId: order.id })}`} />}
                            >
                              Thu phí
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ))}
            {queue === "makeup" &&
              (makeups.isPending ? (
                <Skeleton className="m-3 h-40 rounded-xl" />
              ) : makeups.isError ? (
                <PanelError onRetry={() => void makeups.refetch()} />
              ) : !sources.length ? (
                <p className="p-4 text-sm text-muted-foreground">Không có buổi chờ học bù</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Buổi vắng</TableHead>
                      <TableHead>Đã chờ</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.slice(0, 50).map((source) => {
                      const age = makeupAge(source, today);
                      return (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.enrollment.studentProfile?.fullName ?? "Học sinh"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {source.session.class.name} · {displayMoment(source.session.startsAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={age > STALE_MAKEUP_DAYS ? "warning" : "neutral"}>{age} ngày</Badge>
                          </TableCell>
                          <TableCell className="text-right">
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ))}
            {queue === "leave" &&
              (leaves.isPending ? (
                <Skeleton className="m-3 h-40 rounded-xl" />
              ) : leaves.isError ? (
                <PanelError onRetry={() => void leaves.refetch()} />
              ) : !leaves.data?.length ? (
                <p className="p-4 text-sm text-muted-foreground">Không có đơn nghỉ chờ duyệt</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Lớp</TableHead>
                      <TableHead>Nghỉ</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...leaves.data]
                      .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
                      .map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{leave.enrollment.studentProfile?.fullName ?? "Học sinh"}</TableCell>
                          <TableCell>{leave.enrollment.class.name}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {leave.kind === "PERIOD_PAUSE"
                              ? `${dm(leave.fromDate.slice(0, 10))} – ${dm(leave.toDate.slice(0, 10))}`
                              : dm(leave.fromDate.slice(0, 10))}
                          </TableCell>
                          <TableCell className="max-w-56 truncate text-muted-foreground">{leave.reason}</TableCell>
                          <TableCell className="text-right">
                            {leave.enrollment.studentProfile && (
                              <Button
                                size="xs"
                                variant="outline"
                                render={
                                  <Link
                                    href={ROUTES.STAFF.STUDENT_ACTION({
                                      studentId: leave.enrollment.studentProfile.id,
                                      action: "leave",
                                      enrollmentId: leave.enrollment.id,
                                    })}
                                  />
                                }
                              >
                                Xử lý
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ))}
            {queue === "expiring" &&
              (enrollments.isPending || classes.isPending ? (
                <Skeleton className="m-3 h-40 rounded-xl" />
              ) : enrollments.isError || classes.isError ? (
                <PanelError onRetry={() => void Promise.all([enrollments.refetch(), classes.refetch()])} />
              ) : !expiring.length ? (
                <p className="p-4 text-sm text-muted-foreground">Không có gói hết hạn trong 7 ngày tới</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học sinh</TableHead>
                      <TableHead>Lớp</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead className="text-right">Gia hạn dự kiến</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
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
                        <TableCell className="text-right tabular-nums">{row.estimate === null ? "—" : money(row.estimate)}</TableCell>
                        <TableCell className="text-right">
                          {row.enrollment.studentProfile && (
                            <Button
                              size="xs"
                              variant="outline"
                              render={
                                <Link
                                  href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                                    studentId: row.enrollment.studentProfile.id,
                                    classId: row.enrollment.classId,
                                  })}
                                />
                              }
                            >
                              Đăng ký tiếp
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ))}
          </div>
        </Panel>

        <Panel
          title="Ca của tôi"
          tip="Biên lai do bạn xác nhận."
          actions={
            <Button variant="link" size="sm" render={<Link href={ROUTES.STAFF.PAYMENTS} />}>
              Biên lai
            </Button>
          }
        >
          {payments.isPending ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : payments.isError ? (
            <PanelError onRetry={() => void payments.refetch()} />
          ) : (
            <>
              <div className="flex gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Hôm nay</p>
                  <p className="text-xl font-semibold tabular-nums">{shortMoney(myToday)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Biên lai</p>
                  <p className="text-xl font-semibold tabular-nums">{myTodayReceipts.length}</p>
                </div>
              </div>
              {myTodayReceipts.length ? (
                <ul className="divide-y divide-border">
                  {myTodayReceipts.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.registrationOrder.studentFullName}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {clock.format(new Date(item.confirmedAt))} · {item.receiptNumber}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">{money(toAmount(item.amount))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa thu biên lai nào hôm nay</p>
              )}
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-sm text-muted-foreground">Tôi thu {CHART_DAYS} ngày</p>
                <ColumnChart
                  ariaLabel={`Tiền bạn thu theo ngày, ${CHART_DAYS} ngày gần nhất`}
                  valueLabel="Đã thu"
                  format={money}
                  labelEvery={2}
                  data={myDaily.map((day) => ({
                    key: day.day,
                    // Khối hẹp: trục chỉ ghi ngày, tháng nằm trong tooltip/bảng.
                    label: day.day.slice(8, 10),
                    title: `Ngày ${day.day.split("-").reverse().join("/")}`,
                    value: day.value,
                  }))}
                />
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <Panel title="Học bù theo thời gian chờ" tip="Số ngày kể từ buổi vắng.">
          {makeups.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : makeups.isError ? (
            <PanelError onRetry={() => void makeups.refetch()} />
          ) : (
            <>
              <RankList
                rows={aging.map((bucket) => ({
                  key: bucket.key,
                  label: bucket.label,
                  value: String(bucket.count),
                  pct: (bucket.count / agingMax) * 100,
                  warn: bucket.key === "15+" && bucket.count > 0,
                }))}
              />
              {!!sources.length && (
                <Button variant="link" size="sm" className="self-start px-0" onClick={() => void setQuery({ queue: "makeup" })}>
                  Xếp từ buổi chờ lâu nhất
                </Button>
              )}
            </>
          )}
        </Panel>
        <Panel
          title="Lịch hôm nay"
          actions={
            sessions.data ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {todaySessions.length} buổi · {todaySessions.filter((session) => session.status === "COMPLETED").length} đã điểm danh
              </span>
            ) : null
          }
        >
          {sessions.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : sessions.isError ? (
            <PanelError onRetry={() => void sessions.refetch()} />
          ) : !todaySessions.length ? (
            <p className="text-sm text-muted-foreground">Hôm nay không có buổi học</p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
              {[...slots.entries()].map(([slot, list]) => (
                <div key={slot} className="space-y-2">
                  <p className="text-sm font-semibold tabular-nums">{slot}</p>
                  <ul className="space-y-2">
                    {list.map((session) => {
                      const ended = Date.parse(session.endsAt) <= now;
                      return (
                        <li key={session.id} className="flex items-center justify-between gap-3 border-l-2 border-border pl-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{session.class.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{session.teacher?.displayName ?? "—"}</p>
                          </div>
                          {session.status === "COMPLETED" ? (
                            <Badge variant="success">Đã điểm danh</Badge>
                          ) : ended ? (
                            <Badge variant="warning">Chưa điểm danh</Badge>
                          ) : Date.parse(session.startsAt) <= now ? (
                            <Badge variant="info">Đang học</Badge>
                          ) : (
                            <Badge variant="neutral">Sắp tới</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          title="Chỗ trống để tư vấn"
          actions={
            <Button variant="link" size="sm" render={<Link href={ROUTES.STAFF.CLASSES} />}>
              Lớp học
            </Button>
          }
        >
          {subjects.length > 1 && (
            // Nút gọn xuống dòng được: số môn không cố định nên không dùng TabsList cao cố định.
            <div role="group" aria-label="Lọc theo môn" className="flex flex-wrap gap-1.5">
              {["all", ...subjects].map((name) => (
                <Button
                  key={name}
                  size="xs"
                  variant={subject === name ? "default" : "outline"}
                  aria-pressed={subject === name}
                  onClick={() => void setQuery({ subject: name })}
                >
                  {name === "all" ? "Tất cả" : name}
                </Button>
              ))}
            </div>
          )}
          {classes.isPending ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : classes.isError ? (
            <PanelError onRetry={() => void classes.refetch()} />
          ) : !openSeats.length ? (
            <p className="text-sm text-muted-foreground">Không còn lớp trống chỗ</p>
          ) : (
            <ul className="space-y-3">
              {openSeats.map(({ item, filled, free }) => (
                <li key={item.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{item.name}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">còn {free}</span>
                      <span className="text-muted-foreground"> · {filled}/{item.capacity}</span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className={cn("h-1 rounded-full bg-primary")}
                      style={{ width: `${item.capacity ? (filled / item.capacity) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageContainer>
  );
}
