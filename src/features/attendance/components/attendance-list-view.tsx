"use client"

import * as React from "react"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
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
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { TEACHER_ATTENDANCE_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import { CURRENT_TEACHER_ID } from "@/mocks/data/catalog"
import { useTodayAttendance } from "@/features/attendance/hooks/use-attendance"
import type { AttendanceSessionRow } from "@/features/attendance/selectors"

function TeacherAttendanceListView() {
  const attendance = useTodayAttendance(CURRENT_TEACHER_ID)
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("today"))

  const rows = React.useMemo(() => attendance.data ?? [], [attendance.data])
  const unmarkedCount = rows.filter((row) => !row.isMarked).length
  const markedCount = rows.filter((row) => row.isMarked).length

  const filtered = React.useMemo(() => {
    if (status === "unmarked") return rows.filter((row) => !row.isMarked)
    if (status === "marked") return rows.filter((row) => row.isMarked)
    return rows
  }, [rows, status])

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_ATTENDANCE_MSG.LIST_TITLE}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: TEACHER_ATTENDANCE_MSG.LIST_TITLE },
        ]}
      />

      <Card className="gap-4">
        <StatusTabs
          paramKey="status"
          defaultValue="today"
          options={[
            { value: "today", label: TEACHER_ATTENDANCE_MSG.TAB_TODAY(rows.length) },
            {
              value: "unmarked",
              label: TEACHER_ATTENDANCE_MSG.TAB_UNMARKED(unmarkedCount),
            },
            { value: "marked", label: `${TEACHER_ATTENDANCE_MSG.TAB_MARKED} (${markedCount})` },
          ]}
          onChange={(value) => setStatus(value === "today" ? null : value)}
        />

        <AsyncBoundary
          isLoading={attendance.isPending}
          isError={attendance.isError}
          error={attendance.error}
          onRetry={() => attendance.refetch()}
          skeleton={<SkeletonTable rows={3} />}
        >
          {filtered.length === 0 ? (
            <EmptyState variant="no-data" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_TIME}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_CLASS}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_LESSON}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_ROOM}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_CAPACITY}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_STATUS}</TableHead>
                  <TableHead>{TEACHER_ATTENDANCE_MSG.COL_ACTION}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <AttendanceRow key={row.session.id} row={row} />
                ))}
              </TableBody>
            </Table>
          )}
        </AsyncBoundary>
      </Card>
    </PageContainer>
  )
}

function AttendanceRow({ row }: { row: AttendanceSessionRow }) {
  return (
    <TableRow>
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
      <TableCell className="text-sm text-muted-foreground">{row.room}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.enrolled}/{row.capacity}
      </TableCell>
      <TableCell>
        <Badge variant={row.isMarked ? "success" : "warning"} className="rounded-full">
          {row.isMarked
            ? TEACHER_ATTENDANCE_MSG.STATUS_MARKED
            : TEACHER_ATTENDANCE_MSG.STATUS_UNMARKED}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={row.isMarked ? "ghost" : "default"}
          className="rounded-full"
          render={<Link href={ROUTES.TEACHER.ATTENDANCE_SESSION(row.session.id)} />}
        >
          {row.isMarked
            ? TEACHER_ATTENDANCE_MSG.ACTION_VIEW_AGAIN
            : TEACHER_ATTENDANCE_MSG.ACTION_TAKE_ATTENDANCE}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export { TeacherAttendanceListView }
