"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ScheduleCalendar,
  type CalendarGroupBy,
  type CalendarViewMode,
} from "@/components/shared/calendar/schedule-calendar"
import { SessionDrawer } from "@/components/shared/calendar/session-drawer"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { SCHEDULE_MSG } from "@/constants/messages/events/schedule"
import { TEACHER_SCHEDULE_MSG } from "@/constants/messages/events/teacher-portal"
import { TEACHER_ABSENCE_MSG } from "@/constants/messages/events/teacher-absence"
import { ROUTES } from "@/constants/routes"
import { CURRENT_TEACHER_ID, MOCK_TODAY } from "@/mocks/data/catalog"
import { getClassRows } from "@/features/classes/selectors"
import { getSessionDetail } from "@/features/schedule/selectors"
import { useSchedule } from "@/features/schedule/hooks/use-schedule"
import { ReportAbsenceDialog } from "@/features/schedule/components/report-absence-dialog"
import { useMyPendingAbsenceSessionIds } from "@/features/work-credits/hooks/use-work-credits"
import { isCalendarDate, yesterdayInVietnam } from "@/lib/calendar-date"

const ALL_VALUE = "all"

function TeacherScheduleView() {
  const router = useRouter()

  const [classId, setClassId] = useQueryState(
    "classId",
    parseAsString.withDefault(ALL_VALUE),
  )
  const [date, setDate] = useQueryState(
    "date",
    parseAsString.withDefault(yesterdayInVietnam()),
  )
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("week"),
  )
  const [groupBy, setGroupBy] = useQueryState(
    "groupBy",
    parseAsString.withDefault("time"),
  )
  const [selectedSessionId, setSelectedSessionId] = useQueryState(
    "session",
    parseAsString.withDefault(""),
  )

  const classItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: TEACHER_SCHEDULE_MSG.FILTER_ALL_CLASSES,
      ...Object.fromEntries(
        getClassRows({ teacherId: CURRENT_TEACHER_ID }).map((row) => [
          row.classRecord.id,
          row.classRecord.name,
        ]),
      ),
    }),
    [],
  )

  const filters = React.useMemo(
    () => ({
      teacherId: CURRENT_TEACHER_ID,
      classId: classId === ALL_VALUE ? undefined : classId,
    }),
    [classId],
  )

  const selectedDate = isCalendarDate(date) ? date : yesterdayInVietnam()
  const schedule = useSchedule(filters, selectedDate)
  const pendingAbsenceIds = useMyPendingAbsenceSessionIds(CURRENT_TEACHER_ID)
  const [reportSessionId, setReportSessionId] = React.useState<string | null>(
    null,
  )

  const sessionDetail = React.useMemo(
    () => (selectedSessionId ? getSessionDetail(selectedSessionId) : null),
    [selectedSessionId],
  )

  const reportSessionDetail = React.useMemo(() => {
    const detail = reportSessionId ? getSessionDetail(reportSessionId) : null
    return detail
      ? {
          id: detail.id,
          title: detail.title,
          date: detail.date,
          time: detail.time,
        }
      : null
  }, [reportSessionId])

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_SCHEDULE_MSG.TITLE}
        description={TEACHER_SCHEDULE_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: TEACHER_SCHEDULE_MSG.TITLE },
        ]}
      />

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertDescription>
          {TEACHER_ABSENCE_MSG.SCHEDULE_FIXED_NOTE}
        </AlertDescription>
      </Alert>

      <Card className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={classItems}
            value={classId}
            onValueChange={(next) =>
              setClassId(next === ALL_VALUE ? null : String(next))
            }
          >
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder={classItems[ALL_VALUE]} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(classItems).map(([itemValue, label]) => (
                <SelectItem key={itemValue} value={itemValue}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {schedule.data && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {SCHEDULE_MSG.TOTAL_SESSIONS(
                  schedule.data.summary.weekSessionCount,
                )}
              </Badge>
              {schedule.data.summary.needsCoordination > 0 && (
                <Badge variant="danger" className="rounded-full">
                  <HugeiconsIcon icon={Alert01Icon} className="size-3" />
                  {SCHEDULE_MSG.NEEDS_COORDINATION(
                    schedule.data.summary.needsCoordination,
                  )}
                </Badge>
              )}
            </div>
          )}
        </div>

        <AsyncBoundary
          isLoading={schedule.isPending}
          isError={schedule.isError}
          error={schedule.error}
          onRetry={() => schedule.refetch()}
          skeleton={<SkeletonCardList />}
          isEmpty={schedule.data?.events.length === 0}
          emptyProps={{
            title: SCHEDULE_MSG.EMPTY_TITLE,
            description: SCHEDULE_MSG.EMPTY_DESC,
          }}
        >
          {schedule.data && (
            <ScheduleCalendar
              events={schedule.data.events}
              date={selectedDate}
              onDateChange={(next) => void setDate(next)}
              view={view as CalendarViewMode}
              onViewChange={(next) => setView(next === "week" ? null : next)}
              groupBy={groupBy as CalendarGroupBy}
              onGroupByChange={(next) =>
                setGroupBy(next === "time" ? null : next)
              }
              onEventClick={(event) => setSelectedSessionId(event.id)}
            />
          )}
        </AsyncBoundary>
      </Card>

      <SessionDrawer
        open={Boolean(sessionDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null)
        }}
        session={
          sessionDetail
            ? {
                id: sessionDetail.id,
                title: sessionDetail.title,
                subject: sessionDetail.subject,
                date: sessionDetail.date,
                time: sessionDetail.time,
                room: sessionDetail.room,
                teacherName: sessionDetail.teacherName,
                status: sessionDetail.status,
                totalStudents: sessionDetail.totalStudents,
                attendedCount: sessionDetail.attendedCount,
                absentStudents: sessionDetail.absentStudents,
                onTakeAttendance: () =>
                  router.push(
                    ROUTES.TEACHER.ATTENDANCE_SESSION(sessionDetail.id),
                  ),
                onViewClassDetail: () =>
                  router.push(
                    ROUTES.TEACHER.CLASS_DETAIL(sessionDetail.classId),
                  ),
                // Chỉ báo nghỉ được buổi của mình chưa diễn ra, chưa điểm danh, chưa hủy, chưa báo.
                notice: pendingAbsenceIds.data?.includes(sessionDetail.id)
                  ? TEACHER_ABSENCE_MSG.REPORTED_BADGE
                  : undefined,
                onReportAbsence:
                  sessionDetail.teacherId === CURRENT_TEACHER_ID &&
                  sessionDetail.date >= MOCK_TODAY &&
                  !sessionDetail.isMarked &&
                  !sessionDetail.isCancelled &&
                  pendingAbsenceIds.data &&
                  !pendingAbsenceIds.data.includes(sessionDetail.id)
                    ? () => setReportSessionId(sessionDetail.id)
                    : undefined,
              }
            : null
        }
      />

      <ReportAbsenceDialog
        session={reportSessionDetail}
        teacherId={CURRENT_TEACHER_ID}
        onClose={() => setReportSessionId(null)}
      />
    </PageContainer>
  )
}

export { TeacherScheduleView }
