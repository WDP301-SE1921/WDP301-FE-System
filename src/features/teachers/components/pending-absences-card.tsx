"use client"

import * as React from "react"

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
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { TEACHER_ABSENCE_MSG } from "@/constants/messages/events/teacher-absence"
import {
  CancelSessionDialog,
  type CancelSessionTarget,
} from "@/features/teachers/components/cancel-session-dialog"
import { usePendingAbsences } from "@/features/work-credits/hooks/use-work-credits"
import type { TeacherAbsenceRow } from "@/features/work-credits/selectors"

export interface PendingAbsencesCardProps {
  /** Chọn buổi để xếp dạy thay — trang cha cuộn/điền sẵn form dạy thay bên dưới. */
  onAssign: (row: TeacherAbsenceRow) => void
}

/** Báo nghỉ chờ xử lý của giáo viên: xếp dạy thay (form bên dưới) hoặc hủy buổi. */
function PendingAbsencesCard({ onAssign }: PendingAbsencesCardProps) {
  const absences = usePendingAbsences()
  const [cancelTarget, setCancelTarget] = React.useState<CancelSessionTarget | null>(null)
  const rows = absences.data ?? []

  return (
    <SectionCard
      title={TEACHER_ABSENCE_MSG.PENDING_TITLE}
      description={TEACHER_ABSENCE_MSG.PENDING_DESC}
      action={
        rows.length > 0 ? (
          <Badge variant="warning" className="rounded-full">
            {rows.length}
          </Badge>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title={TEACHER_ABSENCE_MSG.PENDING_EMPTY_TITLE}
          description={TEACHER_ABSENCE_MSG.PENDING_EMPTY_DESC}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{TEACHER_ABSENCE_MSG.COL_SESSION}</TableHead>
              <TableHead>{TEACHER_ABSENCE_MSG.COL_TEACHER}</TableHead>
              <TableHead>{TEACHER_ABSENCE_MSG.COL_REASON}</TableHead>
              <TableHead>{TEACHER_ABSENCE_MSG.COL_REPORTED_AT}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SubjectTag code={row.subjectCode} />
                    <span className="text-sm font-medium text-foreground">
                      {row.classRecord?.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {row.sessionLabel} · <DateText value={row.session?.date} />{" "}
                    {row.session ? `${row.session.startTime}–${row.session.endTime}` : ""}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-foreground">{row.teacherName}</TableCell>
                <TableCell className="max-w-56 text-xs text-muted-foreground">
                  {row.report.reason}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  <DateText value={row.report.reportedAt} format="datetime" />
                  {row.isUrgent && (
                    <Badge variant="danger" className="ml-1.5 rounded-full">
                      {TEACHER_ABSENCE_MSG.URGENT_BADGE}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" className="rounded-full" onClick={() => onAssign(row)}>
                      {TEACHER_ABSENCE_MSG.ACTION_ASSIGN}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() =>
                        setCancelTarget({
                          classSessionId: row.report.classSessionId,
                          sessionLabel: `${row.classRecord?.name ?? ""} · ${row.sessionLabel} (${row.session?.date ?? ""})`,
                          suggestedReason: TEACHER_ABSENCE_MSG.SUBSTITUTE_REASON_PREFIX(row.teacherName),
                        })
                      }
                    >
                      {TEACHER_ABSENCE_MSG.ACTION_CANCEL_SESSION}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CancelSessionDialog target={cancelTarget} onClose={() => setCancelTarget(null)} />
    </SectionCard>
  )
}

export { PendingAbsencesCard }
