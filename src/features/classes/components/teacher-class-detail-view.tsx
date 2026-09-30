"use client"

import * as React from "react"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  CheckmarkSquare01Icon,
  Location01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceSummary } from "@/components/shared/display/attendance-summary"
import { DateText } from "@/components/shared/display/date-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import { AttendanceBarChart } from "@/features/dashboard/components/attendance-bar-chart"
import { getAttendanceBreakdown } from "@/features/students/selectors"
import {
  getClassAverageAttendanceRate,
  getClassWeeklyAttendance,
} from "@/features/classes/selectors"
import { useClassDetail } from "@/features/classes/hooks/use-classes"
import type { ClassDetail, ClassSessionRow } from "@/features/classes/selectors"
import type { StudentProfile } from "@/types/student"

export interface TeacherClassDetailViewProps {
  classId: string
}

function TeacherClassDetailView({ classId }: TeacherClassDetailViewProps) {
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
            title={TEACHER_CLASS_MSG.NOT_FOUND_TITLE}
            message={TEACHER_CLASS_MSG.NOT_FOUND_DESC}
          />
        ) : (
          detail.data && (
            <div className="space-y-6">
              <ClassHero detail={detail.data} />

              <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                <TabsList className="h-10 rounded-full bg-muted/60 p-1">
                  <TabsTrigger value="students" className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs">
                    {TEACHER_CLASS_MSG.TAB_STUDENTS}
                    <Badge variant="secondary" className="ml-1.5 rounded-full">
                      {detail.data.students.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs">
                    {TEACHER_CLASS_MSG.TAB_SESSIONS}
                    <Badge variant="secondary" className="ml-1.5 rounded-full">
                      {detail.data.sessions.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs">
                    {TEACHER_CLASS_MSG.TAB_ATTENDANCE_RATE}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {tab === "students" && <StudentsTab detail={detail.data} />}
              {tab === "sessions" && <SessionsTab detail={detail.data} />}
              {tab === "attendance" && <AttendanceRateTab detail={detail.data} />}
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function ClassHero({ detail }: { detail: ClassDetail }) {
  const { classRecord, program } = detail
  const progressPercent =
    detail.totalLessons === 0
      ? 0
      : Math.round((detail.completedLessons / detail.totalLessons) * 100)
  const averageRate = getClassAverageAttendanceRate(classRecord.id)

  return (
    <div className="space-y-4">
      <PageHeader
        title={classRecord.name}
        description={program?.name}
        backHref={ROUTES.TEACHER.CLASSES}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: TEACHER_CLASS_MSG.DETAIL_BACK, href: ROUTES.TEACHER.CLASSES },
          { label: classRecord.name },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SubjectTag code={detail.subjectCode} />
        <Badge variant="secondary" className="rounded-full">
          {STUDENT_MSG.GRADE_LABEL(classRecord.grade)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Calendar01Icon} label="Lịch cố định" value={classRecord.weekdays.join(" - ")}>
          <ScheduleText time={`${classRecord.startTime}–${classRecord.endTime}`} className="text-xs" />
        </InfoCard>

        <InfoCard icon={Location01Icon} label="Phòng học & Sĩ số" value={classRecord.room}>
          <ProgressStat
            value={detail.enrolled}
            max={classRecord.capacity}
            description={`${detail.enrolled}/${classRecord.capacity}`}
            color={detail.isFull ? "danger" : "default"}
          />
        </InfoCard>

        <InfoCard
          icon={CheckmarkSquare01Icon}
          label="Tiến độ khóa"
          value={`${progressPercent}% (${detail.completedLessons}/${detail.totalLessons} buổi)`}
        >
          <span className="text-xs text-muted-foreground">
            Còn lại {detail.totalLessons - detail.completedLessons} buổi học
          </span>
        </InfoCard>

        <InfoCard
          icon={UserMultiple02Icon}
          label={TEACHER_CLASS_MSG.CARD_ATTENDANCE_RATE}
          value={`${averageRate}%`}
        >
          <span className="text-xs text-muted-foreground">Trung bình cả lớp</span>
        </InfoCard>
      </div>
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
      <p className="truncate font-heading text-base font-semibold text-foreground">{value}</p>
      {children}
    </Card>
  )
}

function StudentsTab({ detail }: { detail: ClassDetail }) {
  return (
    <Card className="gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{TEACHER_CLASS_MSG.COL_STUDENT}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.COL_ATTENDANCE_RATE}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.COL_AVG_SCORE}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.COL_STATUS}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.students.map((student) => {
            const breakdown = getAttendanceBreakdown(student.id, detail.classRecord.id)

            return (
              <TableRow key={student.id}>
                <TableCell>
                  <UserCell name={student.name} sub={student.code} />
                </TableCell>
                <TableCell className="w-40">
                  <ProgressStat value={breakdown.rate} description={`${breakdown.rate}%`} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {TEACHER_CLASS_MSG.AVG_SCORE_UNAVAILABLE}
                </TableCell>
                <TableCell>
                  <StatusBadge category="student" status={student.status} />
                </TableCell>
                <TableCell>
                  <StudentQuickView student={student} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

function StudentQuickView({ student }: { student: StudentProfile }) {
  const breakdown = getAttendanceBreakdown(student.id)
  const initials = student.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="rounded-full">
            Xem nhanh
          </Button>
        }
      />
      <PopoverContent>
        <div className="flex items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">
              {student.code} · {TEACHER_CLASS_MSG.QUICKVIEW_GRADE_LABEL(student.grade)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <AttendanceSummary
            present={breakdown.present}
            absent={breakdown.absent}
            makeup={breakdown.madeUp}
            permittedLeave={breakdown.excused}
            total={breakdown.total}
            compact
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SessionsTab({ detail }: { detail: ClassDetail }) {
  return (
    <Card className="gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{TEACHER_CLASS_MSG.SESSION_COL_SESSION}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.SESSION_COL_DATE}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.SESSION_COL_LESSON}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.SESSION_COL_STATUS}</TableHead>
            <TableHead>{TEACHER_CLASS_MSG.SESSION_COL_ACTION}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.sessions.map((row) => (
            <SessionRow key={row.session.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function SessionRow({ row }: { row: ClassSessionRow }) {
  return (
    <TableRow>
      <TableCell className="text-sm font-medium">{row.label}</TableCell>
      <TableCell className="whitespace-nowrap">
        <DateText value={row.session.date} />
      </TableCell>
      <TableCell className="text-sm">{row.lessonTitle}</TableCell>
      <TableCell>
        <Badge variant={row.state === "marked" ? "success" : "warning"} className="rounded-full">
          {row.state === "marked"
            ? TEACHER_CLASS_MSG.SESSION_MARKED
            : TEACHER_CLASS_MSG.SESSION_UNMARKED}
        </Badge>
      </TableCell>
      <TableCell>
        {row.state === "unmarked" ? (
          <Button
            size="sm"
            className="rounded-full"
            render={<Link href={ROUTES.TEACHER.ATTENDANCE_SESSION(row.session.id)} />}
          >
            {TEACHER_CLASS_MSG.ACTION_TAKE_ATTENDANCE}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            render={<Link href={ROUTES.TEACHER.ATTENDANCE_SESSION(row.session.id)} />}
          >
            {TEACHER_CLASS_MSG.ACTION_VIEW}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

function AttendanceRateTab({ detail }: { detail: ClassDetail }) {
  const weekly = getClassWeeklyAttendance(detail.classRecord.id)

  return (
    <div className="space-y-4">
      <Card className="gap-4">
        <p className="font-heading text-sm font-semibold text-foreground">
          {TEACHER_CLASS_MSG.WEEKLY_CHART_TITLE}
        </p>
        <AttendanceBarChart data={weekly} />
      </Card>

      <Card className="gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{TEACHER_CLASS_MSG.COL_STUDENT}</TableHead>
              <TableHead>{TEACHER_CLASS_MSG.COL_ATTENDANCE_RATE}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.students.map((student) => {
              const breakdown = getAttendanceBreakdown(student.id, detail.classRecord.id)
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <UserCell name={student.name} sub={student.code} />
                  </TableCell>
                  <TableCell className="w-48">
                    <ProgressStat value={breakdown.rate} description={`${breakdown.rate}%`} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export { TeacherClassDetailView }
