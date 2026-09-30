"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Calendar01Icon,
  CheckmarkSquare01Icon,
  Edit02Icon,
  Location01Icon,
  RefreshIcon,
  Search01Icon,
  TeacherIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { DateText } from "@/components/shared/display/date-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ROUTES } from "@/constants/routes"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { ChangeClassTeacherDialog } from "@/features/classes/components/change-class-teacher-dialog"
import { useClassDetail } from "@/features/classes/hooks/use-classes"
import type { ClassDetail, ClassSessionRow } from "@/features/classes/selectors"

const TABS = [
  { value: "students", label: CLASS_MSG.TAB_STUDENTS },
  { value: "sessions", label: CLASS_MSG.TAB_SESSIONS },
  { value: "teachers", label: CLASS_MSG.TAB_TEACHERS },
  { value: "history", label: CLASS_MSG.TAB_HISTORY },
] as const

const SESSION_FILTERS = ["all", "marked", "today", "upcoming"] as const
type SessionFilter = (typeof SESSION_FILTERS)[number]

export interface ClassDetailViewProps {
  classId: string
}

function ClassDetailView({ classId }: ClassDetailViewProps) {
  const detail = useClassDetail(classId)
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("sessions"))

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={detail.isPending}
        isError={detail.isError}
        error={detail.error}
        onRetry={() => detail.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {detail.data === null ? (
          <ErrorState
            title={CLASS_MSG.NOT_FOUND_TITLE}
            message={CLASS_MSG.NOT_FOUND_DESC}
          />
        ) : (
          detail.data && (
            <div className="space-y-6">
              <ClassHero detail={detail.data} onRefetch={() => detail.refetch()} />

              <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                <TabsList className="h-10 rounded-full bg-muted/60 p-1">
                  {TABS.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
                    >
                      {item.label}
                      {item.value === "sessions" && (
                        <Badge variant="secondary" className="ml-1.5 rounded-full">
                          {detail.data?.sessions.length}
                        </Badge>
                      )}
                      {item.value === "students" && (
                        <Badge variant="secondary" className="ml-1.5 rounded-full">
                          {detail.data?.students.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {tab === "sessions" && <SessionsTab detail={detail.data} />}
              {tab === "students" && <StudentsTab detail={detail.data} />}
              {tab === "teachers" && (
                <EmptyState
                  icon={<HugeiconsIcon icon={TeacherIcon} />}
                  title={CLASS_MSG.TAB_TEACHERS}
                  description={CLASS_MSG.TEACHERS_TAB_EMPTY}
                />
              )}
              {tab === "history" && (
                <EmptyState
                  icon={<HugeiconsIcon icon={RefreshIcon} />}
                  title={CLASS_MSG.TAB_HISTORY}
                  description={CLASS_MSG.HISTORY_TAB_EMPTY}
                />
              )}
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function ClassHero({
  detail,
  onRefetch,
}: {
  detail: ClassDetail
  onRefetch: () => void
}) {
  const { classRecord, program } = detail
  const [isChangeTeacherOpen, setIsChangeTeacherOpen] = React.useState(false)
  const progressPercent =
    detail.totalLessons === 0
      ? 0
      : Math.round((detail.completedLessons / detail.totalLessons) * 100)

  return (
    <div className="space-y-4">
      <PageHeader
        title={classRecord.name}
        description={CLASS_MSG.DETAIL_DESC(program?.name ?? "—", CLASS_MSG.DETAIL_TERM)}
        backHref={ROUTES.MANAGER.CLASSES}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Lớp học & Lịch" },
          { label: CLASS_MSG.LIST_TITLE, href: ROUTES.MANAGER.CLASSES },
          { label: classRecord.name },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={RefreshIcon} />}
              onClick={() => setIsChangeTeacherOpen(true)}
            >
              {classRecord.teacherId
                ? CLASS_MSG.ACTION_CHANGE_TEACHER
                : CLASS_MSG.ACTION_ASSIGN_TEACHER}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Edit02Icon} />}
              onClick={() => toast.success(CLASS_MSG.ACTION_EDIT)}
            >
              {CLASS_MSG.ACTION_EDIT}
            </Button>
            <RowActions
              items={[
                {
                  id: "close",
                  label: CLASS_MSG.ACTION_CLOSE,
                  danger: true,
                  onClick: () => toast.success(CLASS_MSG.ACTION_CLOSE),
                },
              ]}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SubjectTag code={detail.subjectCode} />
        <Badge variant="secondary" className="rounded-full">
          {STUDENT_MSG.GRADE_LABEL(classRecord.grade)}
        </Badge>
        <Badge variant="success" className="rounded-full">
          {CLASS_MSG.BADGE_ACTIVE}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={Calendar01Icon}
          label={CLASS_MSG.INFO_SCHEDULE}
          value={classRecord.weekdays.join(" - ")}
        >
          <ScheduleText
            time={`${classRecord.startTime}–${classRecord.endTime}`}
            className="text-xs"
          />
        </InfoCard>

        <InfoCard
          icon={TeacherIcon}
          label={CLASS_MSG.INFO_TEACHER}
          value={detail.teacherName ?? CLASS_MSG.NO_TEACHER}
        >
          <span className="text-xs text-muted-foreground">
            {program?.name ?? ""}
          </span>
        </InfoCard>

        <InfoCard
          icon={Location01Icon}
          label={CLASS_MSG.INFO_ROOM}
          value={classRecord.room}
        >
          <ProgressStat
            value={detail.enrolled}
            max={classRecord.capacity}
            description={`${detail.enrolled}/${classRecord.capacity}`}
            color={detail.isFull ? "danger" : "default"}
          />
        </InfoCard>

        <InfoCard
          icon={CheckmarkSquare01Icon}
          label={CLASS_MSG.INFO_PROGRESS}
          value={CLASS_MSG.INFO_PROGRESS_VALUE(
            progressPercent,
            detail.completedLessons,
            detail.totalLessons
          )}
        >
          <span className="text-xs text-muted-foreground">
            {CLASS_MSG.INFO_REMAINING(detail.totalLessons - detail.completedLessons)}
          </span>
        </InfoCard>
      </div>

      <ChangeClassTeacherDialog
        key={`${classRecord.id}-${classRecord.teacherId ? "change" : "assign"}`}
        detail={detail}
        open={isChangeTeacherOpen}
        onOpenChange={(open) => {
          setIsChangeTeacherOpen(open)
          if (!open) onRefetch()
        }}
      />
    </div>
  )
}

function InfoCard({
  icon,
  label,
  value,
  children,
}: {
  icon: typeof Calendar01Icon
  label: string
  value: string
  children?: React.ReactNode
}) {
  return (
    <Card size="sm" className="gap-2">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-3.5 text-primary" />
        {label}
      </p>
      <p className="truncate font-heading text-base font-semibold text-foreground">
        {value}
      </p>
      {children}
    </Card>
  )
}

function SessionsTab({ detail }: { detail: ClassDetail }) {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<SessionFilter>("all")

  const counts = React.useMemo(
    () => ({
      all: detail.sessions.length,
      marked: detail.sessions.filter((item) => item.state === "marked").length,
      today: detail.sessions.filter((item) => item.isToday).length,
      upcoming: detail.sessions.filter((item) => item.state === "upcoming").length,
    }),
    [detail.sessions]
  )

  const filtered = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return detail.sessions.filter((row) => {
      if (filter === "marked" && row.state !== "marked") return false
      if (filter === "today" && !row.isToday) return false
      if (filter === "upcoming" && row.state !== "upcoming") return false
      if (!keyword) return true

      return (
        row.lessonTitle.toLowerCase().includes(keyword) ||
        row.session.id.toLowerCase().includes(keyword)
      )
    })
  }, [detail.sessions, filter, search])

  const filterLabel: Record<SessionFilter, string> = {
    all: CLASS_MSG.SESSION_FILTER_ALL(counts.all),
    marked: CLASS_MSG.SESSION_FILTER_MARKED(counts.marked),
    today: CLASS_MSG.SESSION_FILTER_TODAY(counts.today),
    upcoming: CLASS_MSG.SESSION_FILTER_UPCOMING(counts.upcoming),
  }

  return (
    <Card className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={CLASS_MSG.SESSION_SEARCH_PLACEHOLDER}
            prefixIcon={<HugeiconsIcon icon={Search01Icon} />}
          />
        </div>

        <div className="flex gap-2">
          <ExportButton
            variant="outline"
            size="sm"
            className="rounded-full"
            label={CLASS_MSG.SESSION_EXPORT}
            onExport={() => {
              toast.success(CLASS_MSG.EXPORT_SUCCESS)
            }}
          />
          <Button
            size="sm"
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={Add01Icon} />}
            onClick={() => toast.success(CLASS_MSG.SESSION_ADD)}
          >
            {CLASS_MSG.SESSION_ADD}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SESSION_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors outline-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              filter === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {filterLabel[item]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState variant="no-result" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{CLASS_MSG.COL_SESSION}</TableHead>
              <TableHead>{CLASS_MSG.COL_DATE}</TableHead>
              <TableHead>{CLASS_MSG.COL_LESSON}</TableHead>
              <TableHead>{CLASS_MSG.COL_SESSION_TEACHER}</TableHead>
              <TableHead>{CLASS_MSG.COL_STATUS}</TableHead>
              <TableHead>{CLASS_MSG.COL_MAKEUP}</TableHead>
              <TableHead>{CLASS_MSG.COL_SESSION_ACTIONS}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <SessionRow key={row.session.id} row={row} />
            ))}
          </TableBody>
        </Table>
      )}

      <p className="border-t border-border pt-3 text-xs text-muted-foreground">
        {CLASS_MSG.SESSION_SUMMARY(counts.marked, counts.all)}
      </p>
    </Card>
  )
}

function SessionRow({ row }: { row: ClassSessionRow }) {
  const stateBadge =
    row.state === "marked"
      ? { label: CLASS_MSG.SESSION_MARKED, variant: "success" as const }
      : row.state === "unmarked"
        ? { label: CLASS_MSG.SESSION_UNMARKED, variant: "warning" as const }
        : { label: CLASS_MSG.SESSION_UPCOMING, variant: "info" as const }

  return (
    <TableRow className={cn(row.isToday && "bg-primary/5")}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {row.session.kind === "monthly_test" ? row.label : CLASS_MSG.SESSION_NUMBER(row.order)}
          </span>
          {row.session.kind === "monthly_test" && (
            <StatusBadge category="sessionKind" status="monthly_test" />
          )}
          {row.isToday && (
            <Badge variant="default" className="rounded-full">
              {CLASS_MSG.SESSION_TODAY_BADGE}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <DateText value={row.session.date} />
        <span className="block text-xs text-muted-foreground">
          {row.session.startTime}–{row.session.endTime}
        </span>
      </TableCell>
      <TableCell>
        <p className="text-sm text-foreground">{row.lessonTitle}</p>
      </TableCell>
      <TableCell>
        {row.teacherName ? (
          <UserCell name={row.teacherName} />
        ) : (
          <Badge variant="danger" className="rounded-full">
            {CLASS_MSG.NO_TEACHER}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={stateBadge.variant} className="rounded-full">
          {stateBadge.label}
        </Badge>
      </TableCell>
      <TableCell>
        {row.makeupCount > 0 ? (
          <Badge variant="info" className="rounded-full">
            {CLASS_MSG.SESSION_MAKEUP_COUNT(row.makeupCount)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {row.state === "unmarked" ? (
          <Button
            size="sm"
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
            onClick={() => toast.success(CLASS_MSG.SESSION_TAKE_ATTENDANCE)}
          >
            {CLASS_MSG.SESSION_TAKE_ATTENDANCE}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => toast.success(CLASS_MSG.SESSION_VIEW)}
          >
            {CLASS_MSG.SESSION_VIEW}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

function StudentsTab({ detail }: { detail: ClassDetail }) {
  if (detail.students.length === 0) {
    return (
      <EmptyState
        icon={<HugeiconsIcon icon={UserGroupIcon} />}
        title={CLASS_MSG.TAB_STUDENTS}
        description={CLASS_MSG.STUDENTS_TAB_EMPTY}
      />
    )
  }

  return (
    <Card className="gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{STUDENT_MSG.COL_STUDENT}</TableHead>
            <TableHead>{STUDENT_MSG.COL_STATUS}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <UserCell
                  name={student.name}
                  sub={`${STUDENT_MSG.GRADE_LABEL(student.grade)} · ${student.code}`}
                />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="rounded-full">
                  {student.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export { ClassDetailView }
