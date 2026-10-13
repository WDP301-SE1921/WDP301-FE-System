"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DateText } from "@/components/shared/display/date-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { WORK_CREDIT_MSG } from "@/constants/messages/events/work-credit"
import type { WorkCreditSessionRow } from "@/features/work-credits/selectors"

export interface WorkCreditSessionTableProps {
  rows: WorkCreditSessionRow[]
  /** Nội dung cột cuối cho mỗi dòng (vd nút "Ghi nhận công"); bỏ trống thì không có cột. */
  renderAction?: (row: WorkCreditSessionRow) => React.ReactNode
}

/** Bảng các buổi tính công của một giáo viên — dùng chung cho cổng giáo viên và màn quản lý. */
function WorkCreditSessionTable({ rows, renderAction }: WorkCreditSessionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{WORK_CREDIT_MSG.COL_DATE}</TableHead>
          <TableHead>{WORK_CREDIT_MSG.COL_SESSION}</TableHead>
          <TableHead>{WORK_CREDIT_MSG.COL_HOURS}</TableHead>
          <TableHead>{WORK_CREDIT_MSG.COL_STATUS}</TableHead>
          <TableHead>{WORK_CREDIT_MSG.COL_CREDIT}</TableHead>
          <TableHead>{WORK_CREDIT_MSG.COL_NOTE}</TableHead>
          {renderAction && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.session.id}>
            <TableCell className="whitespace-nowrap">
              <DateText value={row.session.date} />
              <span className="block text-xs text-muted-foreground">
                {row.session.startTime}–{row.session.endTime}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <SubjectTag code={row.subjectCode} />
                <span className="text-sm font-medium text-foreground">
                  {row.classRecord?.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{row.sessionLabel}</span>
            </TableCell>
            <TableCell className="text-sm tabular-nums text-muted-foreground">
              {WORK_CREDIT_MSG.UNIT_HOUR(row.hours)}
            </TableCell>
            <TableCell>
              <StatusBadge category="workCredit" status={row.status} />
            </TableCell>
            <TableCell className="text-sm font-semibold tabular-nums text-foreground">
              {row.credit}
            </TableCell>
            <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={row.note}>
              {row.note ?? "—"}
            </TableCell>
            {renderAction && <TableCell className="text-right">{renderAction(row)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { WorkCreditSessionTable }
