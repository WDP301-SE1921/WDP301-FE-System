"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Alert01Icon } from "@hugeicons/core-free-icons"

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
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
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
import { ROUTES } from "@/constants/routes"
import { SUBJECT_MAP } from "@/constants/subjects"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { getRoomOptions, getTeacherOptions } from "@/features/classes/selectors"
import { getSessionDetail } from "@/features/schedule/selectors"
import { useSchedule } from "@/features/schedule/hooks/use-schedule"

const ALL_VALUE = "all"

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: SCHEDULE_MSG.FILTER_ALL_SUBJECTS,
  ...Object.fromEntries(
    MOCK_SUBJECTS.map((subject) => [
      subject.id,
      SUBJECT_MAP[subject.code]?.name ?? subject.name,
    ])
  ),
}

function ScheduleView() {
  const router = useRouter()

  const [teacher, setTeacher] = useQueryState("teacher", parseAsString.withDefault(ALL_VALUE))
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))
  const [room, setRoom] = useQueryState("room", parseAsString.withDefault(ALL_VALUE))
  const [view, setView] = useQueryState("view", parseAsString.withDefault("week"))
  const [groupBy, setGroupBy] = useQueryState("groupBy", parseAsString.withDefault("time"))
  const [selectedSessionId, setSelectedSessionId] = useQueryState(
    "session",
    parseAsString.withDefault("")
  )

  const teacherItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: SCHEDULE_MSG.FILTER_ALL_TEACHERS,
      ...Object.fromEntries(getTeacherOptions().map((o) => [o.value, o.label])),
    }),
    []
  )
  const roomItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: SCHEDULE_MSG.FILTER_ALL_ROOMS,
      ...Object.fromEntries(getRoomOptions().map((item) => [item, item])),
    }),
    []
  )

  const filters = React.useMemo(
    () => ({
      teacherId: teacher === ALL_VALUE ? undefined : teacher,
      subjectId: subject === ALL_VALUE ? undefined : subject,
      room: room === ALL_VALUE ? undefined : room,
    }),
    [teacher, subject, room]
  )

  const schedule = useSchedule(filters)

  const sessionDetail = React.useMemo(
    () => (selectedSessionId ? getSessionDetail(selectedSessionId) : null),
    [selectedSessionId]
  )

  return (
    <PageContainer>
      <PageHeader
        title={SCHEDULE_MSG.TITLE}
        description={SCHEDULE_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Lớp học & Lịch" },
          { label: SCHEDULE_MSG.TITLE },
        ]}
        actions={
          <>
            <Badge variant="info" className="rounded-full">
              {SCHEDULE_MSG.TERM_BADGE}
            </Badge>
            <ExportButton
              variant="outline"
              className="rounded-full"
              label={SCHEDULE_MSG.EXPORT}
              onExport={() => {
                toast.success(SCHEDULE_MSG.EXPORT_SUCCESS)
              }}
            />
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Add01Icon} />}
              onClick={() => toast.success(SCHEDULE_MSG.ADD_SESSION_SUCCESS)}
            >
              {SCHEDULE_MSG.ADD_SESSION}
            </Button>
          </>
        }
      />

      <Card className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            items={teacherItems}
            value={teacher}
            width="w-44"
            onChange={setTeacher}
          />
          <FilterSelect
            items={SUBJECT_ITEMS}
            value={subject}
            width="w-40"
            onChange={setSubject}
          />
          <FilterSelect items={roomItems} value={room} width="w-40" onChange={setRoom} />

          {schedule.data && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {SCHEDULE_MSG.TOTAL_SESSIONS(schedule.data.summary.weekSessionCount)}
              </Badge>
              {schedule.data.summary.needsCoordination > 0 && (
                <Badge variant="danger" className="rounded-full">
                  <HugeiconsIcon icon={Alert01Icon} className="size-3" />
                  {SCHEDULE_MSG.NEEDS_COORDINATION(
                    schedule.data.summary.needsCoordination
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
              view={view as CalendarViewMode}
              onViewChange={(next) => setView(next === "week" ? null : next)}
              groupBy={groupBy as CalendarGroupBy}
              onGroupByChange={(next) => setGroupBy(next === "time" ? null : next)}
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
                onTakeAttendance: () => router.push(ROUTES.TEACHER.ATTENDANCE),
                onRequestReschedule: () =>
                  router.push(ROUTES.MANAGER.TEACHER_SUBSTITUTES),
                onViewClassDetail: () =>
                  router.push(ROUTES.MANAGER.CLASS_DETAIL(sessionDetail.classId)),
              }
            : null
        }
      />
    </PageContainer>
  )
}

function FilterSelect({
  items,
  value,
  width,
  onChange,
}: {
  items: Record<string, string>
  value: string
  width: string
  onChange: (value: string | null) => void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : String(next))}
    >
      <SelectTrigger className={`${width} rounded-xl`}>
        <SelectValue placeholder={items[ALL_VALUE]} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, label]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { ScheduleView }
