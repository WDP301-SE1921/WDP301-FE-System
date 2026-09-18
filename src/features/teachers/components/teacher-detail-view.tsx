"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Clock01Icon,
  Edit02Icon,
  Folder01Icon,
  Mail01Icon,
  RefreshIcon,
  StarIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { ScheduleCalendar } from "@/components/shared/calendar/schedule-calendar"
import { DateText } from "@/components/shared/display/date-text"
import { DetailHeader } from "@/components/shared/display/detail-header"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { ROUTES } from "@/constants/routes"
import { getClassDetail } from "@/features/classes/selectors"
import { getCalendarEvents } from "@/features/schedule/selectors"
import { getSubstituteHistory, type TeacherRow } from "@/features/teachers/selectors"
import { useTeacher } from "@/features/teachers/hooks/use-teachers"

const TABS = [
  { value: "classes", label: TEACHER_MSG.TAB_CLASSES },
  { value: "schedule", label: TEACHER_MSG.TAB_SCHEDULE },
  { value: "substitute", label: TEACHER_MSG.TAB_SUBSTITUTE },
  { value: "review", label: TEACHER_MSG.TAB_REVIEW },
] as const

export interface TeacherDetailViewProps {
  teacherId: string
}

function TeacherDetailView({ teacherId }: TeacherDetailViewProps) {
  const teacher = useTeacher(teacherId)
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("schedule"))

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={teacher.isPending}
        isError={teacher.isError}
        error={teacher.error}
        onRetry={() => teacher.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {teacher.data === null ? (
          <ErrorState
            title={TEACHER_MSG.NOT_FOUND_TITLE}
            message={TEACHER_MSG.NOT_FOUND_DESC}
          />
        ) : (
          teacher.data && (
            <div className="space-y-6">
              <TeacherHero row={teacher.data} />

              <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                <TabsList className="h-10 rounded-full bg-muted/60 p-1">
                  {TABS.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
                    >
                      {item.label}
                      {item.value === "classes" && (
                        <Badge variant="secondary" className="ml-1.5 rounded-full">
                          {teacher.data?.classCount}
                        </Badge>
                      )}
                      {item.value === "substitute" && (
                        <Badge variant="secondary" className="ml-1.5 rounded-full">
                          {teacher.data?.substituteCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {tab === "schedule" && <ScheduleTab row={teacher.data} />}
              {tab === "classes" && <ClassesTab row={teacher.data} />}
              {tab === "substitute" && <SubstituteTab row={teacher.data} />}
              {tab === "review" && (
                <EmptyState
                  icon={<HugeiconsIcon icon={StarIcon} />}
                  title={TEACHER_MSG.TAB_REVIEW}
                  description={TEACHER_MSG.REVIEW_TAB_EMPTY}
                />
              )}
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function TeacherHero({ row }: { row: TeacherRow }) {
  const router = useRouter()
  const { teacher } = row

  return (
    <div className="space-y-4">
      <PageHeader
        title={TEACHER_MSG.LIST_TITLE}
        description={teacher.specialty}
        backHref={ROUTES.MANAGER.TEACHERS}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: TEACHER_MSG.LIST_TITLE, href: ROUTES.MANAGER.TEACHERS },
          { label: teacher.name },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Edit02Icon} />}
              onClick={() => toast.success(TEACHER_MSG.DETAIL_EDIT)}
            >
              {TEACHER_MSG.DETAIL_EDIT}
            </Button>
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Folder01Icon} />}
              onClick={() => router.push(ROUTES.MANAGER.CLASSES)}
            >
              {TEACHER_MSG.DETAIL_ASSIGN}
            </Button>
          </>
        }
      />

      <DetailHeader
        name={teacher.name}
        code={teacher.code}
        statusLabel={teacher.status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
        statusVariant={teacher.status === "active" ? "success" : "danger"}
        meta={[
          { icon: <HugeiconsIcon icon={Mail01Icon} />, label: teacher.email },
          { icon: <HugeiconsIcon icon={Clock01Icon} />, label: teacher.phone },
          {
            icon: <HugeiconsIcon icon={StarIcon} />,
            label: TEACHER_MSG.CANDIDATE_RATING(teacher.rating),
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        {row.subjectCodes.map((code) => (
          <SubjectTag key={code} code={code} />
        ))}
        {teacher.isHeadTeacher && (
          <Badge variant="info" className="rounded-full">
            {TEACHER_MSG.HEAD_TEACHER_BADGE}
          </Badge>
        )}
        <Badge variant="secondary" className="rounded-full">
          {teacher.yearsExperience} năm kinh nghiệm
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Folder01Icon}
          label={TEACHER_MSG.STAT_CLASSES}
          value={TEACHER_MSG.CLASS_COUNT_UNIT(row.classCount)}
          sub={TEACHER_MSG.STUDENT_COUNT_UNIT(row.studentCount)}
        />
        <StatCard
          icon={Calendar01Icon}
          label={TEACHER_MSG.STAT_WORKLOAD}
          value={TEACHER_MSG.SESSION_COUNT_UNIT(row.weeklySessionCount)}
          sub={TEACHER_MSG.SESSION_PER_WEEK}
        />
        <StatCard
          icon={RefreshIcon}
          label={TEACHER_MSG.STAT_SUBSTITUTE}
          value={TEACHER_MSG.STAT_SUBSTITUTE_UNIT(row.substituteCount)}
          sub={TEACHER_MSG.STAT_SUBSTITUTE_SUB}
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: typeof Folder01Icon
  label: string
  value: string
  sub: string
}) {
  return (
    <Card size="sm" className="gap-2">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-3.5 text-primary" />
        {label}
      </p>
      <p className="font-heading text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  )
}

function ScheduleTab({ row }: { row: TeacherRow }) {
  const events = React.useMemo(
    () => getCalendarEvents({ teacherId: row.teacher.id }),
    [row.teacher.id]
  )

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<HugeiconsIcon icon={Calendar01Icon} />}
        title={TEACHER_MSG.TAB_SCHEDULE}
        description={TEACHER_MSG.CLASSES_TAB_EMPTY}
      />
    )
  }

  return (
    <SectionCard
      title={TEACHER_MSG.TAB_SCHEDULE}
      description={TEACHER_MSG.SCHEDULE_TAB_DESC}
    >
      <ScheduleCalendar events={events} />
    </SectionCard>
  )
}

function ClassesTab({ row }: { row: TeacherRow }) {
  if (row.classes.length === 0) {
    return (
      <EmptyState
        icon={<HugeiconsIcon icon={Folder01Icon} />}
        title={TEACHER_MSG.TAB_CLASSES}
        description={TEACHER_MSG.CLASSES_TAB_EMPTY}
      />
    )
  }

  return (
    <SectionCard
      title={TEACHER_MSG.CLASSES_SECTION_TITLE(row.classCount)}
      description={TEACHER_MSG.CLASSES_SECTION_DESC}
      action={
        <Badge variant="secondary" className="rounded-full">
          {TEACHER_MSG.CLASSES_TOTAL_STUDENTS(row.studentCount)}
        </Badge>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {row.classes.map((classRecord) => {
          const detail = getClassDetail(classRecord.id)
          const percent =
            detail && detail.totalLessons > 0
              ? Math.round((detail.completedLessons / detail.totalLessons) * 100)
              : 0
          const seatsLeft = classRecord.capacity - (detail?.enrolled ?? 0)

          return (
            <Card key={classRecord.id} className="gap-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {classRecord.grade >= 9 ? "Luyện thi" : "Cơ bản"}
                </Badge>
                <span className="font-mono text-[0.625rem] text-muted-foreground">
                  {classRecord.id.replace("cls-", "").toUpperCase()}
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold text-foreground">
                  {classRecord.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {detail?.program?.name ?? ""}
                </p>
              </div>

              <ScheduleText
                days={classRecord.weekdays}
                time={`${classRecord.startTime}–${classRecord.endTime}`}
                room={classRecord.room}
                className="text-xs"
              />

              <p className="text-xs text-muted-foreground">
                {TEACHER_MSG.CLASS_SEATS(detail?.enrolled ?? 0, classRecord.capacity)} ·{" "}
                {seatsLeft <= 0
                  ? TEACHER_MSG.CLASS_SEATS_FULL
                  : TEACHER_MSG.CLASS_SEATS_LEFT(seatsLeft)}
              </p>

              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  {TEACHER_MSG.CLASS_PROGRESS}
                </p>
                <ProgressStat
                  value={detail?.completedLessons ?? 0}
                  max={detail?.totalLessons ?? 1}
                  description={TEACHER_MSG.CLASS_PROGRESS_VALUE(
                    detail?.completedLessons ?? 0,
                    detail?.totalLessons ?? 0,
                    percent
                  )}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full"
                render={<Link href={ROUTES.MANAGER.CLASS_DETAIL(classRecord.id)} />}
              >
                {CLASS_MSG.ACTION_VIEW_DETAIL}
              </Button>
            </Card>
          )
        })}
      </div>
    </SectionCard>
  )
}

function SubstituteTab({ row }: { row: TeacherRow }) {
  const history = React.useMemo(
    () =>
      getSubstituteHistory().filter(
        (item) =>
          item.assignment.substituteTeacherId === row.teacher.id ||
          item.assignment.mainTeacherId === row.teacher.id
      ),
    [row.teacher.id]
  )

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<HugeiconsIcon icon={RefreshIcon} />}
        title={TEACHER_MSG.TAB_SUBSTITUTE}
        description={TEACHER_MSG.SUBSTITUTE_TAB_EMPTY}
      />
    )
  }

  return (
    <SectionCard title={TEACHER_MSG.HISTORY_TITLE} description={TEACHER_MSG.HISTORY_DESC}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{TEACHER_MSG.HISTORY_COL_SESSION}</TableHead>
            <TableHead>{TEACHER_MSG.HISTORY_COL_MAIN}</TableHead>
            <TableHead>{TEACHER_MSG.HISTORY_COL_SUBSTITUTE}</TableHead>
            <TableHead>{TEACHER_MSG.HISTORY_COL_REASON}</TableHead>
            <TableHead>{TEACHER_MSG.HISTORY_COL_TIME}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.assignment.id}>
              <TableCell>
                <p className="text-sm font-medium text-foreground">
                  {item.classRecord?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  <DateText value={item.session?.date} /> ·{" "}
                  {CLASS_MSG.SESSION_NUMBER(item.lessonOrder)}
                </p>
              </TableCell>
              <TableCell>
                <UserCell name={item.mainTeacherName ?? "—"} />
              </TableCell>
              <TableCell>
                <UserCell name={item.substituteTeacherName ?? "—"} />
              </TableCell>
              <TableCell className="max-w-48 text-sm text-muted-foreground">
                {item.assignment.reason}
              </TableCell>
              <TableCell>
                <DateText value={item.assignment.assignedAt} format="datetime" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}

export { TeacherDetailView }
