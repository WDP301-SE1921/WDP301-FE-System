"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  Invoice01Icon,
  Mail01Icon,
  Task01Icon,
  TeacherIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonKpiGrid } from "@/components/shared/feedback/skeleton-presets"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { MoneyText } from "@/components/shared/display/money-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { DASHBOARD_MSG } from "@/constants/messages/events/dashboard"
import { ROLES, type WebRole } from "@/constants/roles"
import { ROUTES } from "@/constants/routes"
import { useRoleAccess } from "@/hooks/use-current-role"
import { formatDate, formatMoney } from "@/lib/format"
import { MOCK_TODAY } from "@/mocks/data/catalog"
import { AttendanceBarChart } from "@/features/dashboard/components/attendance-bar-chart"
import {
  PendingTaskList,
  type PendingTaskItem,
} from "@/features/dashboard/components/pending-task-list"
import { useDashboard, type DashboardData } from "@/features/dashboard/hooks/use-dashboard"
import type {
  PendingTaskCounts,
  TodaySessionRow,
} from "@/features/dashboard/selectors"

const ATTENDANCE_BADGE: Record<
  TodaySessionRow["attendanceState"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  marked: { label: DASHBOARD_MSG.ATTENDANCE_MARKED, variant: "success" },
  unmarked: { label: DASHBOARD_MSG.ATTENDANCE_UNMARKED, variant: "warning" },
  no_teacher: { label: DASHBOARD_MSG.ATTENDANCE_NO_TEACHER, variant: "danger" },
}

export interface DashboardViewProps {
  /** Admin / quản lý trung tâm thấy thêm KPI kinh doanh; nhân viên chỉ thấy khối vận hành. */
  role: WebRole
}

function DashboardView({ role }: DashboardViewProps) {
  const dashboard = useDashboard()
  const { canAccess } = useRoleAccess()
  const isBusinessRole = role === ROLES.ADMIN || role === ROLES.CENTER_MANAGER

  return (
    <PageContainer>
      <PageHeader
        title={DASHBOARD_MSG.TITLE}
        description={DASHBOARD_MSG.DESC(formatDate(MOCK_TODAY, "EEEE, dd/MM/yyyy"))}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: DASHBOARD_MSG.TITLE },
        ]}
        actions={
          <ExportButton
            variant="outline"
            className="rounded-full"
            label={DASHBOARD_MSG.EXPORT_REPORT}
            onExport={() => {
              toast.success(DASHBOARD_MSG.EXPORT_SUCCESS)
            }}
          />
        }
      />

      <AsyncBoundary
        isLoading={dashboard.isPending}
        isError={dashboard.isError}
        error={dashboard.error}
        onRetry={() => dashboard.refetch()}
        skeleton={<SkeletonKpiGrid />}
      >
        {dashboard.data && (
          <div className="space-y-6">
            {isBusinessRole && <BusinessKpiRow business={dashboard.data.business} />}

            {/* Hàng 1 — KPI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title={DASHBOARD_MSG.KPI_ACTIVE_STUDENTS}
                value={dashboard.data.activeStudentCount}
                sub={DASHBOARD_MSG.KPI_ACTIVE_STUDENTS_SUB}
                trend="up"
                trendLabel="+12 tháng này"
                color="blue"
                icon={<HugeiconsIcon icon={UserIcon} />}
              />
              <KpiCard
                title={DASHBOARD_MSG.KPI_OPEN_CLASSES}
                value={dashboard.data.openClassCount}
                sub={DASHBOARD_MSG.KPI_OPEN_CLASSES_SUB(dashboard.data.subjectCount)}
                color="purple"
                icon={<HugeiconsIcon icon={TeacherIcon} />}
              />
              <KpiCard
                title={DASHBOARD_MSG.KPI_PAYMENTS_TODAY}
                value={DASHBOARD_MSG.KPI_TRANSACTIONS(
                  dashboard.data.paymentsToday.length
                )}
                sub={DASHBOARD_MSG.KPI_PAYMENTS_TODAY_SUB}
                color="green"
                icon={<HugeiconsIcon icon={Invoice01Icon} />}
              />
              <KpiCard
                title={DASHBOARD_MSG.KPI_ATTENDANCE_RATE}
                value={`${dashboard.data.weeklyAverage}%`}
                sub={DASHBOARD_MSG.KPI_ATTENDANCE_RATE_SUB(
                  BUSINESS_RULES.ATTENDANCE_RATE_TARGET
                )}
                trend={
                  dashboard.data.weeklyAverage >= BUSINESS_RULES.ATTENDANCE_RATE_TARGET
                    ? "up"
                    : "down"
                }
                trendLabel={`${dashboard.data.weeklyAverage}% trung bình tuần`}
                color="amber"
                icon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
              />
            </div>

            {/* Hàng 2 — Buổi học hôm nay + Việc cần xử lý */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title={DASHBOARD_MSG.TODAY_SESSIONS_TITLE}
                description={DASHBOARD_MSG.TODAY_SESSIONS_COUNT(
                  dashboard.data.todaySessions.length
                )}
                action={
                  <Badge variant="info" className="rounded-full">
                    {DASHBOARD_MSG.TODAY_SESSIONS_LIVE}
                  </Badge>
                }
              >
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{DASHBOARD_MSG.COL_TIME}</TableHead>
                        <TableHead>{DASHBOARD_MSG.COL_CLASS}</TableHead>
                        <TableHead>{DASHBOARD_MSG.COL_LESSON}</TableHead>
                        <TableHead>{DASHBOARD_MSG.COL_TEACHER}</TableHead>
                        <TableHead>{DASHBOARD_MSG.COL_ROOM}</TableHead>
                        <TableHead>{DASHBOARD_MSG.COL_ATTENDANCE}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.data.todaySessions.map((session) => {
                        const badge = ATTENDANCE_BADGE[session.attendanceState]

                        return (
                          <TableRow key={session.id}>
                            <TableCell className="whitespace-nowrap">
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <HugeiconsIcon
                                  icon={Clock01Icon}
                                  className="size-3.5"
                                />
                                {session.timeRange}
                              </span>
                            </TableCell>
                            <TableCell>
                              <SubjectTag code={session.subjectCode} />
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {session.className}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {session.lessonTitle}
                            </TableCell>
                            <TableCell className="text-sm">
                              {session.teacherName ?? (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {session.room}
                            </TableCell>
                            <TableCell>
                              <Badge variant={badge.variant} className="rounded-full">
                                {badge.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      {DASHBOARD_MSG.TODAY_SESSIONS_FOOTER}
                    </p>
                    <Link
                      href={ROUTES.MANAGER.SCHEDULE}
                      className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {DASHBOARD_MSG.VIEW_FULL_SCHEDULE}
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </Link>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={DASHBOARD_MSG.TASKS_TITLE}
                action={
                  <span className="text-xs text-muted-foreground">
                    {DASHBOARD_MSG.TASKS_COUNT(
                      Object.values(dashboard.data.tasks).reduce(
                        (sum, count) => sum + count,
                        0
                      )
                    )}
                  </span>
                }
              >
                <PendingTaskList
                  items={buildTaskItems(dashboard.data.tasks).filter((item) => canAccess(item.href))}
                />
              </SectionCard>
            </div>

            {/* Hàng 3 — Thanh toán gần đây + Biểu đồ */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard
                title={DASHBOARD_MSG.RECENT_PAYMENTS_TITLE}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="rounded-full">
                      {DASHBOARD_MSG.RECENT_PAYMENTS_BADGE}
                    </Badge>
                    <Link
                      href={ROUTES.MANAGER.PAYMENTS}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {DASHBOARD_MSG.RECENT_PAYMENTS_VIEW_ALL}
                    </Link>
                  </div>
                }
              >
                <div className="space-y-3">
                  <ul className="divide-y divide-border">
                    {dashboard.data.recentPayments.map((row) => (
                      <li
                        key={row.payment.id}
                        className="flex items-center gap-3 py-3 first:pt-0"
                      >
                        <UserCell
                          name={row.studentName}
                          sub={`${row.className} · ${DASHBOARD_MSG.PAYMENT_MONTHS(row.months)}`}
                          className="min-w-0 flex-1"
                        />
                        <div className="shrink-0 text-right">
                          <MoneyText
                            amount={row.payment.amount}
                            className="block text-sm font-semibold"
                          />
                          <DateText
                            value={row.payment.confirmedAt}
                            format="relative"
                            className="text-xs text-muted-foreground"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    {DASHBOARD_MSG.RECENT_PAYMENTS_FOOTER}
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title={DASHBOARD_MSG.WEEKLY_CHART_TITLE}
                description={DASHBOARD_MSG.WEEKLY_CHART_DESC}
                action={
                  <div className="text-right">
                    <p className="font-heading text-xl font-bold text-foreground tabular-nums">
                      {dashboard.data.weeklyAverage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {DASHBOARD_MSG.WEEKLY_CHART_AVERAGE}
                    </p>
                  </div>
                }
              >
                <AttendanceBarChart data={dashboard.data.weeklyAttendance} />
              </SectionCard>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function BusinessKpiRow({ business }: { business: DashboardData["business"] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={DASHBOARD_MSG.KPI_MONTHLY_REVENUE}
        value={formatMoney(business.monthlyRevenue)}
        sub={DASHBOARD_MSG.KPI_MONTHLY_REVENUE_SUB(business.monthPaymentCount)}
        color="green"
        icon={<HugeiconsIcon icon={Invoice01Icon} />}
      />
      <KpiCard
        title={DASHBOARD_MSG.KPI_ACTIVE_STUDENTS}
        value={business.activeStudentCount}
        sub={DASHBOARD_MSG.KPI_ACTIVE_STUDENTS_SUB}
        color="blue"
        icon={<HugeiconsIcon icon={UserIcon} />}
      />
      <KpiCard
        title={DASHBOARD_MSG.KPI_ACTIVE_TEACHERS}
        value={business.activeTeacherCount}
        sub={DASHBOARD_MSG.KPI_ACTIVE_TEACHERS_SUB}
        color="purple"
        icon={<HugeiconsIcon icon={TeacherIcon} />}
      />
      <KpiCard
        title={DASHBOARD_MSG.KPI_ACTIVE_STAFF}
        value={business.activeStaffCount}
        sub={DASHBOARD_MSG.KPI_ACTIVE_STAFF_SUB}
        color="amber"
        icon={<HugeiconsIcon icon={UserGroupIcon} />}
      />
    </div>
  )
}

function buildTaskItems(tasks: PendingTaskCounts): PendingTaskItem[] {
  return [
    {
      id: "failed-emails",
      icon: Mail01Icon,
      label: DASHBOARD_MSG.TASK_FAILED_EMAILS,
      description: DASHBOARD_MSG.TASK_FAILED_EMAILS_DESC,
      count: tasks.failedEmails,
      tone: "danger",
      href: ROUTES.MANAGER.EMAIL_LOGS,
    },
    {
      id: "expiring-packages",
      icon: Invoice01Icon,
      label: DASHBOARD_MSG.TASK_EXPIRING_PACKAGES,
      description: DASHBOARD_MSG.TASK_EXPIRING_PACKAGES_DESC,
      count: tasks.expiringPackages,
      tone: "warning",
      href: ROUTES.MANAGER.STUDENTS,
    },
    {
      id: "no-teacher",
      icon: UserGroupIcon,
      label: DASHBOARD_MSG.TASK_NO_TEACHER,
      description: DASHBOARD_MSG.TASK_NO_TEACHER_DESC,
      count: tasks.sessionsWithoutTeacher,
      tone: "danger",
      href: ROUTES.MANAGER.TEACHER_SUBSTITUTES,
    },
    {
      id: "ending-leaves",
      icon: Task01Icon,
      label: DASHBOARD_MSG.TASK_ENDING_LEAVES,
      description: DASHBOARD_MSG.TASK_ENDING_LEAVES_DESC,
      count: tasks.endingLongLeaves,
      tone: "info",
      href: ROUTES.MANAGER.LONG_LEAVE,
    },
  ]
}

export { DashboardView }
