"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  Invoice01Icon,
  Mail01Icon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { AttendanceSummary } from "@/components/shared/display/attendance-summary"
import { DateText } from "@/components/shared/display/date-text"
import { DescriptionList } from "@/components/shared/display/description-list"
import { DetailHeader } from "@/components/shared/display/detail-header"
import { MoneyText } from "@/components/shared/display/money-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { Timeline } from "@/components/shared/display/timeline"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { ROUTES } from "@/constants/routes"
import { useRoleAccess } from "@/hooks/use-current-role"
import { formatDate } from "@/lib/format"
import { findAttendanceByStudent } from "@/mocks/data/attendance"
import {
  findClass,
  findClassSession,
  findProgram,
  findSubject,
  findTeacher,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { findAuditLogsByStudent } from "@/mocks/data/payments"
import { useStudent } from "@/features/students/hooks/use-students"
import { getAttendanceBreakdown, type StudentRow } from "@/features/students/selectors"

const TABS = [
  { value: "overview", label: STUDENT_MSG.TAB_OVERVIEW },
  { value: "schedule", label: STUDENT_MSG.TAB_SCHEDULE },
  { value: "attendance", label: STUDENT_MSG.TAB_ATTENDANCE },
  { value: "payments", label: STUDENT_MSG.TAB_PAYMENTS },
  { value: "history", label: STUDENT_MSG.TAB_HISTORY },
] as const

const ALL_VALUE = "all"

export interface StudentDetailViewProps {
  studentProfileId: string
}

function StudentDetailView({ studentProfileId }: StudentDetailViewProps) {
  const router = useRouter()
  const student = useStudent(studentProfileId)
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("overview"))

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={student.isPending}
        isError={student.isError}
        error={student.error}
        onRetry={() => student.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {student.data === null ? (
          <ErrorState
            title={STUDENT_MSG.NOT_FOUND_TITLE}
            message={STUDENT_MSG.NOT_FOUND_DESC}
          />
        ) : (
          student.data && (
            <div className="space-y-6">
              <PageHeader
                title={STUDENT_MSG.DETAIL_TITLE}
                description={STUDENT_MSG.DETAIL_DESC}
                backHref={ROUTES.MANAGER.STUDENTS}
                breadcrumbs={[
                  { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
                  { label: STUDENT_MSG.LIST_TITLE, href: ROUTES.MANAGER.STUDENTS },
                  { label: student.data.student.name },
                ]}
              />

              <StudentHero row={student.data} router={router} />

              <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                <TabsList className="h-10 rounded-full bg-muted/60 p-1">
                  {TABS.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {tab === "overview" && <OverviewTab row={student.data} />}
              {tab === "attendance" && <AttendanceTab row={student.data} />}
              {tab === "history" && <HistoryTab row={student.data} />}
              {tab === "schedule" && (
                <EmptyState
                  icon={<HugeiconsIcon icon={Calendar01Icon} />}
                  title={STUDENT_MSG.TAB_SCHEDULE}
                  description={STUDENT_MSG.SCHEDULE_TAB_EMPTY}
                />
              )}
              {tab === "payments" && (
                <EmptyState
                  icon={<HugeiconsIcon icon={Invoice01Icon} />}
                  title={STUDENT_MSG.TAB_PAYMENTS}
                  description={STUDENT_MSG.PAYMENTS_TAB_EMPTY}
                />
              )}
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function StudentHero({
  row,
  router,
}: {
  row: StudentRow
  router: ReturnType<typeof useRouter>
}) {
  const { canAccess } = useRoleAccess()
  const canEnroll = canAccess(ROUTES.STAFF.ENROLLMENT_NEW)
  const canManageAbsences = canAccess(ROUTES.MANAGER.MAKEUP)
  const activeEnrollments = row.enrollments.filter((item) => item.status !== "dropped")

  return (
    <div className="space-y-4">
      <DetailHeader
        name={row.student.name}
        code={row.student.code}
        statusLabel={undefined}
        meta={[
          {
            icon: <HugeiconsIcon icon={UserIcon} />,
            label: STUDENT_MSG.GRADE_LABEL(row.student.grade),
          },
          {
            icon: <HugeiconsIcon icon={Mail01Icon} />,
            label: row.parent?.email ?? "—",
          },
          {
            icon: <HugeiconsIcon icon={Clock01Icon} />,
            label: row.parent?.phone ?? "—",
          },
        ]}
        actions={
          <>
            {canEnroll && (
              <Button
                className="rounded-full"
                render={
                  <Link
                    href={ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                      parentId: row.student.parentAccountId,
                      studentId: row.student.id,
                    })}
                  />
                }
                leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
              >
                {STUDENT_MSG.ACTION_ADD_SUBJECT}
              </Button>
            )}
            {canManageAbsences && (
              <>
                <Button
                  variant="outline"
                  className="rounded-full"
                  render={<Link href={ROUTES.MANAGER.LONG_LEAVE} />}
                >
                  {STUDENT_MSG.ACTION_LONG_LEAVE}
                </Button>
                <RowActions
                  items={[
                    {
                      id: "drop-subject",
                      label: STUDENT_MSG.ACTION_DROP_SUBJECT,
                      onClick: () => router.push(ROUTES.MANAGER.WITHDRAW),
                    },
                    {
                      id: "withdraw",
                      label: STUDENT_MSG.ACTION_WITHDRAW,
                      danger: true,
                      onClick: () => router.push(ROUTES.MANAGER.WITHDRAW),
                    },
                  ]}
                />
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm" className="gap-1">
          <p className="text-xs text-muted-foreground">{STUDENT_MSG.COL_SUBJECTS}</p>
          <p className="font-heading text-xl font-bold text-foreground tabular-nums">
            {activeEnrollments.length}
          </p>
        </Card>
        <Card size="sm" className="gap-1">
          <p className="text-xs text-muted-foreground">{STUDENT_MSG.COL_ATTENDANCE}</p>
          <p className="font-heading text-xl font-bold text-foreground tabular-nums">
            {row.attendance.rate}%
          </p>
        </Card>
        <Card size="sm" className="gap-1">
          <p className="text-xs text-muted-foreground">
            {STUDENT_MSG.META_PACKAGE_EXPIRY}
          </p>
          <p className="font-heading text-xl font-bold text-foreground">
            {row.packageEndDate ? formatDate(row.packageEndDate) : "—"}
          </p>
        </Card>
      </div>
    </div>
  )
}

function OverviewTab({ row }: { row: StudentRow }) {
  const enrollments = row.enrollments.filter((item) => item.status !== "dropped")

  if (enrollments.length === 0) {
    return <EmptyState variant="no-data" />
  }

  return (
    <SectionCard
      title={STUDENT_MSG.ENROLLMENT_SECTION_TITLE}
      description={STUDENT_MSG.ENROLLMENT_SECTION_DESC}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {enrollments.map((enrollment) => {
          const classRecord = findClass(enrollment.classId)
          const program = findProgram(classRecord?.programId ?? "")
          const subject = findSubject(enrollment.subjectId)
          const teacher = findTeacher(classRecord?.teacherId)

          return (
            <Card key={enrollment.id} className="gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  {subject && <SubjectTag code={subject.code} />}
                  <p className="font-heading text-base font-semibold text-foreground">
                    {classRecord?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{program?.name}</p>
                </div>
                <StatusBadge category="enrollment" status={enrollment.status} />
              </div>

              <ScheduleText
                days={classRecord?.weekdays}
                time={`${classRecord?.startTime}–${classRecord?.endTime}`}
                room={classRecord?.room}
              />

              <DescriptionList
                cols={2}
                items={[
                  {
                    label: STUDENT_MSG.ENROLLMENT_TEACHER,
                    value: teacher?.name ?? "—",
                  },
                  {
                    label: STUDENT_MSG.ENROLLMENT_ROOM,
                    value: classRecord?.room ?? "—",
                  },
                ]}
              />

              <ProgressStat
                value={enrollment.completedLessons}
                max={program?.totalLessons ?? 1}
                label="Tiến độ chương trình"
                description={STUDENT_MSG.ENROLLMENT_PROGRESS(
                  enrollment.completedLessons,
                  program?.totalLessons ?? 0
                )}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  {STUDENT_MSG.ENROLLMENT_PACKAGE(enrollment.months)} ·{" "}
                  {formatDate(enrollment.startDate)} – {formatDate(enrollment.endDate)}
                </p>
                <MoneyText
                  amount={enrollment.tuitionAmount}
                  className="text-sm font-semibold"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  render={<Link href={ROUTES.MANAGER.MAKEUP} />}
                >
                  {STUDENT_MSG.ACTION_MAKEUP}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  render={<Link href={ROUTES.MANAGER.CHANGE_CLASS} />}
                >
                  {STUDENT_MSG.ACTION_CHANGE_SCHEDULE}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive"
                  render={<Link href={ROUTES.MANAGER.WITHDRAW} />}
                >
                  {STUDENT_MSG.ACTION_DROP_SUBJECT}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </SectionCard>
  )
}

function AttendanceTab({ row }: { row: StudentRow }) {
  const [classId, setClassId] = React.useState<string>(ALL_VALUE)

  const classItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: STUDENT_MSG.ATTENDANCE_FILTER_ALL,
      ...Object.fromEntries(
        row.enrollments.map((item) => [
          item.classId,
          findClass(item.classId)?.name ?? item.classId,
        ])
      ),
    }),
    [row.enrollments]
  )

  const breakdown = getAttendanceBreakdown(
    row.student.id,
    classId === ALL_VALUE ? undefined : classId
  )

  const records = findAttendanceByStudent(row.student.id)
    .filter(
      (record) =>
        classId === ALL_VALUE ||
        findClassSession(record.classSessionId)?.classId === classId
    )
    .sort((a, b) => {
      const dateA = findClassSession(a.classSessionId)?.date ?? ""
      const dateB = findClassSession(b.classSessionId)?.date ?? ""
      return dateB.localeCompare(dateA)
    })

  return (
    <SectionCard
      title={STUDENT_MSG.ATTENDANCE_SECTION_TITLE}
      action={
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {STUDENT_MSG.ATTENDANCE_RATE_LABEL}
          </span>
          <Badge variant="success" className="rounded-full tabular-nums">
            {breakdown.rate}%
          </Badge>
          <Select
            items={classItems}
            value={classId}
            onValueChange={(value) => setClassId(String(value))}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder={STUDENT_MSG.ATTENDANCE_FILTER_ALL} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(classItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="space-y-4">
        <AttendanceSummary
          present={breakdown.present}
          absent={breakdown.absent}
          makeup={breakdown.madeUp}
          permittedLeave={breakdown.excused}
          total={breakdown.total}
        />

        {records.length === 0 ? (
          <EmptyState variant="no-data" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{STUDENT_MSG.COL_DATE}</TableHead>
                <TableHead>{STUDENT_MSG.COL_CLASS}</TableHead>
                <TableHead>{STUDENT_MSG.COL_LESSON}</TableHead>
                <TableHead>{STUDENT_MSG.COL_STATUS}</TableHead>
                <TableHead>{STUDENT_MSG.COL_NOTE}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const session = findClassSession(record.classSessionId)

                return (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">
                      <DateText value={session?.date} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {findClass(session?.classId ?? "")?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session ? resolveLessonTitle(session.lessonId) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge category="attendance" status={record.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.note ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </SectionCard>
  )
}

function HistoryTab({ row }: { row: StudentRow }) {
  const logs = findAuditLogsByStudent(row.student.id)

  if (logs.length === 0) {
    return <EmptyState variant="no-data" />
  }

  return (
    <SectionCard
      title={STUDENT_MSG.HISTORY_SECTION_TITLE}
      description={STUDENT_MSG.HISTORY_SECTION_DESC}
    >
      <Timeline
        items={logs.map((log) => ({
          id: log.id,
          label: log.label,
          description: `${log.description} · ${log.actorName}`,
          timestamp: log.createdAt,
          variant: log.variant,
          icon: <HugeiconsIcon icon={CheckmarkSquare01Icon} />,
        }))}
      />
    </SectionCard>
  )
}

export { StudentDetailView }
