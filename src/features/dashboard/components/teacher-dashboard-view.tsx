"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  Clock01Icon,
  Task01Icon,
  TeacherIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonKpiGrid } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { TEACHER_DASHBOARD_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import { formatDate } from "@/lib/format"
import { CURRENT_TEACHER_ID, MOCK_TODAY } from "@/mocks/data/catalog"
import {
  PendingTaskList,
  type PendingTaskItem,
} from "@/features/dashboard/components/pending-task-list"
import { useTeacherDashboard } from "@/features/dashboard/hooks/use-teacher-dashboard"
import type { TeacherPendingCounts } from "@/features/dashboard/teacher-selectors"

function TeacherDashboardView() {
  const dashboard = useTeacherDashboard(CURRENT_TEACHER_ID)

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_DASHBOARD_MSG.TITLE}
        description={TEACHER_DASHBOARD_MSG.DESC(
          formatDate(MOCK_TODAY, "EEEE, dd/MM/yyyy")
        )}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: TEACHER_DASHBOARD_MSG.TITLE },
        ]}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title={TEACHER_DASHBOARD_MSG.KPI_SESSIONS_TODAY}
                value={dashboard.data.todaySessions.length}
                color="blue"
                icon={<HugeiconsIcon icon={Clock01Icon} />}
              />
              <KpiCard
                title={TEACHER_DASHBOARD_MSG.KPI_CLASSES}
                value={dashboard.data.classCount}
                color="purple"
                icon={<HugeiconsIcon icon={TeacherIcon} />}
              />
              <KpiCard
                title={TEACHER_DASHBOARD_MSG.KPI_PENDING_GRADING}
                value={dashboard.data.tasks.ungradedSubmissions}
                color="green"
                icon={<HugeiconsIcon icon={Task01Icon} />}
              />
              <KpiCard
                title={TEACHER_DASHBOARD_MSG.KPI_PENDING_AI}
                value={dashboard.data.tasks.pendingAiReview}
                color="amber"
                icon={<HugeiconsIcon icon={Alert01Icon} />}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title={TEACHER_DASHBOARD_MSG.TODAY_SESSIONS_TITLE}
              >
                {dashboard.data.todaySessions.length === 0 ? (
                  <EmptyState
                    title={TEACHER_DASHBOARD_MSG.TODAY_SESSIONS_EMPTY_TITLE}
                    description={TEACHER_DASHBOARD_MSG.TODAY_SESSIONS_EMPTY_DESC}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_TIME}</TableHead>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_CLASS}</TableHead>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_LESSON}</TableHead>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_ROOM}</TableHead>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_STUDENTS}</TableHead>
                        <TableHead>{TEACHER_DASHBOARD_MSG.COL_STATUS}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.data.todaySessions.map((row) => (
                        <TableRow key={row.session.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {row.session.startTime}–{row.session.endTime}
                          </TableCell>
                          <TableCell>
                            <SubjectTag code={row.subjectCode} />
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {row.classRecord.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{row.lessonTitle}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.room}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.enrolled}/{row.capacity}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.isMarked ? "success" : "warning"}
                              className="rounded-full"
                            >
                              {row.isMarked
                                ? TEACHER_DASHBOARD_MSG.ATTENDANCE_MARKED
                                : TEACHER_DASHBOARD_MSG.ATTENDANCE_UNMARKED}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!row.isMarked && (
                              <Button
                                size="sm"
                                className="rounded-full"
                                render={
                                  <Link
                                    href={ROUTES.TEACHER.ATTENDANCE_SESSION(row.session.id)}
                                  />
                                }
                              >
                                {TEACHER_DASHBOARD_MSG.ACTION_TAKE_ATTENDANCE}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>

              <SectionCard title={TEACHER_DASHBOARD_MSG.TASKS_TITLE}>
                <PendingTaskList items={buildTaskItems(dashboard.data.tasks)} />
              </SectionCard>
            </div>

            <SectionCard title={TEACHER_DASHBOARD_MSG.RECENT_SUBMISSIONS_TITLE}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{TEACHER_DASHBOARD_MSG.COL_STUDENT}</TableHead>
                    <TableHead>{TEACHER_DASHBOARD_MSG.COL_CLASS}</TableHead>
                    <TableHead>{TEACHER_DASHBOARD_MSG.COL_ASSIGNMENT}</TableHead>
                    <TableHead>{TEACHER_DASHBOARD_MSG.COL_SUBMITTED_AT}</TableHead>
                    <TableHead>{TEACHER_DASHBOARD_MSG.COL_STATUS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.data.recentSubmissions.map((row) => (
                    <TableRow key={row.submission.id}>
                      <TableCell className="text-sm font-medium">
                        {row.studentName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.className}
                      </TableCell>
                      <TableCell className="text-sm">{row.assignmentName}</TableCell>
                      <TableCell>
                        <DateText value={row.submission.submittedAt} format="datetime" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge category="submission" status={row.submission.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </div>
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function buildTaskItems(tasks: TeacherPendingCounts): PendingTaskItem[] {
  return [
    {
      id: "pending-ai",
      icon: Alert01Icon,
      label: TEACHER_DASHBOARD_MSG.TASK_PENDING_AI,
      description: TEACHER_DASHBOARD_MSG.TASK_PENDING_AI_DESC,
      count: tasks.pendingAiReview,
      tone: "warning",
      href: ROUTES.TEACHER.GRADING,
    },
    {
      id: "unmarked-sessions",
      icon: Clock01Icon,
      label: TEACHER_DASHBOARD_MSG.TASK_UNMARKED,
      description: TEACHER_DASHBOARD_MSG.TASK_UNMARKED_DESC,
      count: tasks.unmarkedSessionsToday,
      tone: "danger",
      href: ROUTES.TEACHER.ATTENDANCE,
    },
    {
      id: "due-soon",
      icon: Task01Icon,
      label: TEACHER_DASHBOARD_MSG.TASK_DUE_SOON,
      description: TEACHER_DASHBOARD_MSG.TASK_DUE_SOON_DESC,
      count: tasks.assignmentsDueSoon,
      tone: "warning",
      href: ROUTES.TEACHER.ASSIGNMENTS,
    },
  ]
}

export { TeacherDashboardView }
